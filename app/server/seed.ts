// Seed data: put back by POST /api/test/reset before every test, so each test starts from the same state.
// Demo accounts only; the password is published in the README on purpose.
import type { Task, User } from './store.ts';

export const DEMO_PASSWORD = 'Password1!';

export const seedUsers: User[] = [
  { id: 'u1', username: 'alice', name: 'Alice Tester', password: DEMO_PASSWORD },
  { id: 'u2', username: 'bob', name: 'Bob Builder', password: DEMO_PASSWORD },
  // No tasks: shows the empty board.
  { id: 'u3', username: 'carol', name: 'Carol Newcomer', password: DEMO_PASSWORD },
];

// Fixed ids and timestamps keep the order (newest first) and API answers predictable.
// Due dates are fixed calendar dates; UI tests freeze the clock (cy.clock) to decide what is overdue.
export const seedTasks: Task[] = [
  {
    id: 'seed-1',
    ownerId: 'u1',
    title: 'Update test plan',
    priority: 'low',
    dueDate: '2026-09-30',
    done: true,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-29T16:00:00.000Z',
  },
  {
    id: 'seed-2',
    ownerId: 'u1',
    title: 'Renew test environment certificate',
    priority: 'high',
    dueDate: '2026-10-01',
    done: false,
    createdAt: '2026-09-02T09:00:00.000Z',
    updatedAt: '2026-09-02T09:00:00.000Z',
  },
  {
    id: 'seed-3',
    ownerId: 'u1',
    title: 'Review pull requests',
    priority: 'medium',
    dueDate: null,
    done: false,
    createdAt: '2026-09-03T09:00:00.000Z',
    updatedAt: '2026-09-03T09:00:00.000Z',
  },
  {
    id: 'seed-4',
    ownerId: 'u1',
    title: 'Prepare sprint demo',
    priority: 'high',
    dueDate: '2030-01-15',
    done: false,
    createdAt: '2026-09-04T09:00:00.000Z',
    updatedAt: '2026-09-04T09:00:00.000Z',
  },
  {
    id: 'seed-5',
    ownerId: 'u2',
    title: 'Book team offsite',
    priority: 'medium',
    dueDate: null,
    done: false,
    createdAt: '2026-09-05T09:00:00.000Z',
    updatedAt: '2026-09-05T09:00:00.000Z',
  },
];
