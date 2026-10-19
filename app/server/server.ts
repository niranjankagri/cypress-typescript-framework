// TaskBoard server: the JSON API under /api and the built React app (dist/) for every other path.
// Node built-ins only, run directly as TypeScript: `node app/server/server.ts` (npm start).
import { readFile } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore, toPublicTask, ValidationError } from './store.ts';
import type { StatusFilter, Store, User } from './store.ts';

const DIST_DIR = fileURLToPath(new URL('../../dist/', import.meta.url));
const MAX_BODY_BYTES = 10_000;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/** An error that already knows its HTTP status; anything else becomes a 500. */
class HttpError extends Error {
  readonly status: number;
  readonly field: string | undefined;

  /** field names the request field that caused the error, so the UI can point at it. */
  constructor(status: number, message: string, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

export interface ServerOptions {
  /** POST /api/test/reset puts the seed data back. A test hook: off in a real deployment. */
  testHooks?: boolean;
  /** Prints one line per request. */
  log?: boolean;
}

/**
 * Creates the HTTP server (not yet listening): /api/* goes to the API, every other path to the built React
 * app. Known errors become JSON with their status; anything unexpected is logged and answered with a 500.
 */
export function createServer(store: Store = createStore(), options: ServerOptions = {}): Server {
  const { testHooks = true, log = false } = options;

  return createHttpServer((req, res) => {
    const started = Date.now();
    res.on('finish', () => {
      if (log) console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - started} ms`);
    });
    const url = new URL(req.url ?? '/', 'http://localhost');
    const handler = url.pathname.startsWith('/api/') ? handleApi(req, res, url) : serveStatic(res, url);
    handler.catch((error: unknown) => {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message, ...(error.field && { field: error.field }) });
      } else if (error instanceof ValidationError) {
        sendJson(res, 400, { error: error.message, ...(error.field && { field: error.field }) });
      } else {
        console.error(error);
        sendJson(res, 500, { error: 'Internal server error' });
      }
    });
  });

  /**
   * All API routes: health, test reset and login without a token; everything else needs "Authorization:
   * Bearer <token>". Another user's task answers 404, the same as a task that does not exist.
   */
  async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    const route = `${req.method} ${url.pathname}`;

    // Routes that need no login.
    if (route === 'GET /api/health') return sendJson(res, 200, { status: 'ok' });
    if (route === 'POST /api/test/reset' && testHooks) {
      store.reset();
      return sendEmpty(res, 204);
    }
    if (route === 'POST /api/login') {
      const body = await readJson(req);
      const { username, password } = (body ?? {}) as Record<string, unknown>;
      if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        throw new HttpError(400, 'Username and password are required');
      }
      const session = store.login(username, password);
      if (!session) throw new HttpError(401, 'Wrong username or password');
      return sendJson(res, 200, session);
    }

    // Everything below needs "Authorization: Bearer <token>".
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1] ?? '';
    const user: User | undefined = store.userForToken(token);
    if (!user) throw new HttpError(401, 'Not logged in');

    if (route === 'POST /api/logout') {
      store.logout(token);
      return sendEmpty(res, 204);
    }
    if (route === 'GET /api/me') {
      return sendJson(res, 200, { id: user.id, username: user.username, name: user.name });
    }
    if (route === 'GET /api/tasks') {
      const status = url.searchParams.get('status') ?? 'all';
      if (!['all', 'active', 'done'].includes(status)) {
        throw new HttpError(400, 'Status must be one of: all, active, done', 'status');
      }
      const tasks = store.listTasks(user.id, status as StatusFilter, url.searchParams.get('q') ?? '');
      return sendJson(res, 200, { tasks: tasks.map(toPublicTask) });
    }
    if (route === 'POST /api/tasks') {
      const task = store.createTask(user.id, await readJson(req));
      return sendJson(res, 201, toPublicTask(task));
    }

    const taskId = /^\/api\/tasks\/([^/]+)$/.exec(url.pathname)?.[1];
    if (taskId) {
      if (req.method === 'GET') {
        const task = store.getTask(user.id, taskId);
        if (!task) throw new HttpError(404, 'Task not found');
        return sendJson(res, 200, toPublicTask(task));
      }
      if (req.method === 'PATCH') {
        const task = store.updateTask(user.id, taskId, await readJson(req));
        if (!task) throw new HttpError(404, 'Task not found');
        return sendJson(res, 200, toPublicTask(task));
      }
      if (req.method === 'DELETE') {
        if (!store.deleteTask(user.id, taskId)) throw new HttpError(404, 'Task not found');
        return sendEmpty(res, 204);
      }
    }

    throw new HttpError(404, `No route for ${route}`);
  }
}

/** Serves a file from dist/; unknown paths get index.html so the React app can route them. */
async function serveStatic(res: ServerResponse, url: URL): Promise<void> {
  // normalize + the startsWith check keep "/../" paths inside dist/.
  const requested = normalize(join(DIST_DIR, decodeURIComponent(url.pathname)));
  const file =
    requested.startsWith(DIST_DIR) && extname(requested) ? requested : join(DIST_DIR, 'index.html');
  try {
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(content);
  } catch {
    if (file.endsWith('index.html')) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('The web app is not built yet: run "npm run build" first.');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }
}

/** Reads the request body as JSON: more than MAX_BODY_BYTES is a 413, invalid JSON a 400. */
async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Body too large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new HttpError(400, 'Body must be valid JSON');
  }
}

/** Writes a JSON response. */
function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

/** Writes a response without a body (204). */
function sendEmpty(res: ServerResponse, status: number): void {
  res.writeHead(status);
  res.end();
}

// Started as a program (not imported by a test): listen on PORT (default 3000).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  const server = createServer(createStore(), {
    testHooks: process.env.TEST_HOOKS !== 'off',
    log: process.env.LOG === '1',
  });
  server.listen(port, () => console.log(`TaskBoard running at http://localhost:${port}`));
}
