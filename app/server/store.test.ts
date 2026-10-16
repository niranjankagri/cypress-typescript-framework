// Unit tests for the store's rules (node:test, no server): npm run test:app
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEMO_PASSWORD } from './seed.ts';
import { createStore, isCalendarDate, validateTaskInput, ValidationError } from './store.ts';

describe('validateTaskInput', () => {
  it('fills the defaults on create', () => {
    assert.deepEqual(validateTaskInput({ title: '  Write tests  ' }, false), {
      title: 'Write tests',
      priority: 'medium',
      dueDate: null,
    });
  });

  it('refuses short titles, unknown fields and bad values with the field name', () => {
    const field = (input: unknown, partial = false) => {
      try {
        validateTaskInput(input, partial);
        return 'no error';
      } catch (error) {
        assert.ok(error instanceof ValidationError);
        return error.field;
      }
    };
    assert.equal(field({ title: 'ab' }), 'title');
    assert.equal(field({ title: 'x'.repeat(81) }), 'title');
    assert.equal(field({ title: 'Valid', titel: 'typo' }), 'titel');
    assert.equal(field({ title: 'Valid', priority: 'urgent' }), 'priority');
    assert.equal(field({ title: 'Valid', dueDate: '2026-02-30' }), 'dueDate');
    assert.equal(field({ done: 'yes' }, true), 'done');
    assert.equal(field({ done: true }, false), 'done');
  });

  it('allows a partial update', () => {
    assert.deepEqual(validateTaskInput({ done: true }, true), { done: true });
  });
});

describe('isCalendarDate', () => {
  it('accepts real dates only', () => {
    assert.equal(isCalendarDate('2028-02-29'), true);
    assert.equal(isCalendarDate('2026-02-29'), false);
    assert.equal(isCalendarDate('2026-1-5'), false);
    assert.equal(isCalendarDate(20260105), false);
  });
});

describe('store', () => {
  it('logs in with the demo password only', () => {
    const store = createStore();
    assert.equal(store.login('alice', 'wrong'), null);
    const session = store.login('alice', DEMO_PASSWORD);
    assert.ok(session);
    assert.equal(session.user.name, 'Alice Tester');
    assert.equal('password' in session.user, false);
    assert.equal(store.userForToken(session.token)?.username, 'alice');
    store.logout(session.token);
    assert.equal(store.userForToken(session.token), undefined);
  });

  it('lists only the own tasks, newest first, filtered by status and search', () => {
    const store = createStore();
    const titles = (status?: 'all' | 'active' | 'done', q?: string) =>
      store.listTasks('u1', status, q).map((task) => task.title);
    assert.deepEqual(titles(), [
      'Prepare sprint demo',
      'Review pull requests',
      'Renew test environment certificate',
      'Update test plan',
    ]);
    assert.deepEqual(titles('done'), ['Update test plan']);
    assert.deepEqual(titles('active', 'REVIEW'), ['Review pull requests']);
    assert.deepEqual(store.listTasks('u3'), []);
  });

  it("hides another user's task", () => {
    const store = createStore();
    assert.equal(store.getTask('u2', 'seed-1'), undefined);
    assert.equal(store.updateTask('u2', 'seed-1', { done: false }), undefined);
    assert.equal(store.deleteTask('u2', 'seed-1'), false);
  });

  it('puts the seed data back on reset', () => {
    const store = createStore();
    store.createTask('u3', { title: 'Temporary task' });
    store.deleteTask('u1', 'seed-1');
    store.reset();
    assert.equal(store.listTasks('u3').length, 0);
    assert.ok(store.getTask('u1', 'seed-1'));
  });
});
