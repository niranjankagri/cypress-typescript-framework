// HTTP tests for the API: start the server on a free port and call it with fetch. npm run test:app
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { DEMO_PASSWORD } from './seed.ts';
import { createServer } from './server.ts';

const server = createServer();
let base = '';

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

async function login(username = 'alice'): Promise<string> {
  const res = await fetch(`${base}/api/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password: DEMO_PASSWORD }),
  });
  assert.equal(res.status, 200);
  return ((await res.json()) as { token: string }).token;
}

describe('API', () => {
  it('answers the health check without login', async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });

  it('refuses a wrong password, a missing field and invalid JSON', async () => {
    const post = (body: string) => fetch(`${base}/api/login`, { method: 'POST', body });
    assert.equal((await post(JSON.stringify({ username: 'alice', password: 'nope' }))).status, 401);
    assert.equal((await post(JSON.stringify({ username: 'alice' }))).status, 400);
    assert.equal((await post('{not json')).status, 400);
    assert.equal((await post('null')).status, 400);
  });

  it('needs a token for the task routes', async () => {
    assert.equal((await fetch(`${base}/api/tasks`)).status, 401);
  });

  it('creates, reads, updates and deletes a task', async () => {
    const headers = { Authorization: `Bearer ${await login('carol')}` };
    const created = await fetch(`${base}/api/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Server test task', priority: 'high' }),
    });
    assert.equal(created.status, 201);
    const task = (await created.json()) as { id: string; done: boolean };
    assert.equal(task.done, false);

    const patched = await fetch(`${base}/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ done: true }),
    });
    assert.equal(((await patched.json()) as { done: boolean }).done, true);

    assert.equal((await fetch(`${base}/api/tasks/${task.id}`, { method: 'DELETE', headers })).status, 204);
    assert.equal((await fetch(`${base}/api/tasks/${task.id}`, { headers })).status, 404);
  });

  it('returns 400 with the field name for a bad task', async () => {
    const headers = { Authorization: `Bearer ${await login()}` };
    const res = await fetch(`${base}/api/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'ok', priority: 'high' }),
    });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'Title must be 3-80 characters', field: 'title' });
  });

  it('resets the data through the test hook', async () => {
    const headers = { Authorization: `Bearer ${await login()}` };
    await fetch(`${base}/api/tasks/seed-1`, { method: 'DELETE', headers });
    assert.equal((await fetch(`${base}/api/test/reset`, { method: 'POST' })).status, 204);
    // Reset also logs everybody out, so log in again.
    const fresh = { Authorization: `Bearer ${await login()}` };
    assert.equal((await fetch(`${base}/api/tasks/seed-1`, { headers: fresh })).status, 200);
  });

  it('serves index.html for app routes, or explains how to build it', async () => {
    const res = await fetch(`${base}/login`);
    assert.ok([200, 503].includes(res.status));
  });
});
