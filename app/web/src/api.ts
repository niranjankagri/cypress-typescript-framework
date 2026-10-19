// Small fetch wrapper for the TaskBoard API. The login token lives in localStorage,
// so a reload keeps the user logged in (and tests can log in by setting it).
import type { NewTask, StatusFilter, Task, User } from './types.ts';

export const TOKEN_KEY = 'taskboard.token';

/** An API answer that was not 2xx; carries the server's message and the broken field. */
export class ApiError extends Error {
  readonly status: number;
  readonly field: string | undefined;

  /** status is the HTTP status; field the input the server refused. */
  constructor(status: number, message: string, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

/** The stored login token, or null when logged out. */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * One API call with the token and JSON body; 204 gives undefined, any other non-2xx answer throws an ApiError
 * with the server's message. The signal lets a newer request cancel this one.
 */
async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    method,
    signal,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`, data.field);
  return data as T;
}

export const api = {
  /** Logs in, stores the token and returns the user. */
  async login(username: string, password: string): Promise<User> {
    const session = await request<{ token: string; user: User }>('POST', '/api/login', {
      username,
      password,
    });
    localStorage.setItem(TOKEN_KEY, session.token);
    return session.user;
  },

  /** Logs out on the server and always removes the local token. */
  async logout(): Promise<void> {
    // The local token goes even if the server call fails: the user wanted out.
    await request<void>('POST', '/api/logout').finally(() => localStorage.removeItem(TOKEN_KEY));
  },

  me: () => request<User>('GET', '/api/me'),

  /**
   * The user's tasks for the status filter and search text (trimmed; an empty search sends no q parameter).
   */
  async listTasks(status: StatusFilter, query: string, signal?: AbortSignal): Promise<Task[]> {
    const params = new URLSearchParams({ status });
    if (query.trim()) params.set('q', query.trim());
    return (await request<{ tasks: Task[] }>('GET', `/api/tasks?${params}`, undefined, signal)).tasks;
  },

  createTask: (task: NewTask) => request<Task>('POST', '/api/tasks', task),
  updateTask: (id: string, changes: Partial<NewTask & { done: boolean }>) =>
    request<Task>('PATCH', `/api/tasks/${id}`, changes),
  deleteTask: (id: string) => request<void>('DELETE', `/api/tasks/${id}`),
};
