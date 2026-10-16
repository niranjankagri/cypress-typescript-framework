// Test data: the seeded demo users and a builder for unique tasks.
import type { NewTask } from './api';

/** Seeded users (app/server/seed.ts). Every test starts from this data after cy.resetData(). */
export const users = {
  alice: { username: 'alice', name: 'Alice Tester', taskCount: 4 },
  bob: { username: 'bob', name: 'Bob Builder', taskCount: 1 },
  carol: { username: 'carol', name: 'Carol Newcomer', taskCount: 0 },
} as const;

export type Username = keyof typeof users;

/** Seeded tasks of alice that tests refer to by title. */
export const seeded = {
  done: 'Update test plan',
  overdue: 'Renew test environment certificate',
  noDueDate: 'Review pull requests',
  future: 'Prepare sprint demo',
  bobsTaskId: 'seed-5',
} as const;

let counter = 0;

/** A task with a unique title, so a test can find exactly its own task. */
export function buildTask(overrides: Partial<NewTask> = {}): NewTask {
  counter += 1;
  return {
    title: `Task ${counter} ${Math.random().toString(36).slice(2, 8)}`,
    priority: 'medium',
    dueDate: null,
    ...overrides,
  };
}
