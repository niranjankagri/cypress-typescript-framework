// In-memory data for TaskBoard: users, login tokens and tasks, with all validation rules.
// Kept apart from the HTTP layer so the rules can be unit-tested without a server.
import { randomUUID } from 'node:crypto';
import { seedTasks, seedUsers } from './seed.ts';

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];
export type StatusFilter = 'all' | 'active' | 'done';

export interface User {
  id: string;
  username: string;
  name: string;
  password: string;
}

/** What the API returns for a user: never the password. */
export type PublicUser = Omit<User, 'password'>;

export interface Task {
  id: string;
  ownerId: string;
  title: string;
  priority: Priority;
  /** Calendar date YYYY-MM-DD, or null when the task has no due date. */
  dueDate: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

/** What the API returns for a task: the owner is implied by the login. */
export type PublicTask = Omit<Task, 'ownerId'>;

/** A rule broken by the client's input; the server turns it into HTTP 400. */
export class ValidationError extends Error {
  readonly field: string | undefined;

  /** field names the broken input field, for the API's error answer. */
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export const TITLE_MIN = 3;
export const TITLE_MAX = 80;

const CREATE_FIELDS = ['title', 'priority', 'dueDate'];
const UPDATE_FIELDS = [...CREATE_FIELDS, 'done'];

/** Checks a create (partial = false) or update (partial = true) body and returns the clean values. */
export function validateTaskInput(input: unknown, partial: boolean): Partial<Omit<Task, 'id' | 'ownerId'>> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new ValidationError('Body must be a JSON object');
  }
  const body = input as Record<string, unknown>;
  const allowed = partial ? UPDATE_FIELDS : CREATE_FIELDS;
  // Unknown fields are refused instead of silently ignored: a typo like "titel" should not pass.
  const unknown = Object.keys(body).find((key) => !allowed.includes(key));
  if (unknown) throw new ValidationError(`Unknown field: ${unknown}`, unknown);
  if (partial && Object.keys(body).length === 0) throw new ValidationError('Nothing to update');

  const clean: Partial<Omit<Task, 'id' | 'ownerId'>> = {};

  if (body.title !== undefined || !partial) {
    if (typeof body.title !== 'string') throw new ValidationError('Title is required', 'title');
    const title = body.title.trim();
    if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
      throw new ValidationError(`Title must be ${TITLE_MIN}-${TITLE_MAX} characters`, 'title');
    }
    clean.title = title;
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority as Priority)) {
      throw new ValidationError(`Priority must be one of: ${PRIORITIES.join(', ')}`, 'priority');
    }
    clean.priority = body.priority as Priority;
  } else if (!partial) {
    clean.priority = 'medium';
  }

  if (body.dueDate !== undefined) {
    if (body.dueDate !== null && !isCalendarDate(body.dueDate)) {
      throw new ValidationError('Due date must be a date in the form YYYY-MM-DD', 'dueDate');
    }
    clean.dueDate = body.dueDate;
  } else if (!partial) {
    clean.dueDate = null;
  }

  if (body.done !== undefined) {
    if (typeof body.done !== 'boolean') throw new ValidationError('Done must be true or false', 'done');
    clean.done = body.done;
  }

  return clean;
}

/** True for a real calendar date in the form YYYY-MM-DD (2026-02-30 is false). */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** The user without the password, as the API returns it. */
export function toPublicUser({ password: _password, ...user }: User): PublicUser {
  return user;
}

/** The task without its owner id, as the API returns it. */
export function toPublicTask({ ownerId: _ownerId, ...task }: Task): PublicTask {
  return task;
}

export type Store = ReturnType<typeof createStore>;

/** Creates a store filled with the seed data; reset() puts the seed data back. */
export function createStore() {
  let users: User[] = [];
  let tasks: Task[] = [];
  const tokens = new Map<string, string>(); // token -> user id

  // Logins survive a reset: user ids never change, so a token stays valid. That lets tests reset the
  // data before every test and still reuse one login per user (cy.session).
  function reset(): void {
    users = seedUsers.map((user) => ({ ...user }));
    tasks = seedTasks.map((task) => ({ ...task }));
  }

  /** The task only if it belongs to this user. */
  function ownTask(userId: string, taskId: string): Task | undefined {
    // Another user's task is reported as missing, not forbidden: its existence is not revealed.
    return tasks.find((task) => task.id === taskId && task.ownerId === userId);
  }

  reset();

  return {
    reset,

    /** Returns a new token for the right username + password, otherwise null. */
    login(username: string, password: string): { token: string; user: PublicUser } | null {
      const user = users.find((u) => u.username === username && u.password === password);
      if (!user) return null;
      const token = randomUUID();
      tokens.set(token, user.id);
      return { token, user: toPublicUser(user) };
    },

    /** Forgets the token; later calls with it get 401. */
    logout(token: string): void {
      tokens.delete(token);
    },

    /** The user behind a token, or undefined for an unknown token. */
    userForToken(token: string): User | undefined {
      const userId = tokens.get(token);
      return users.find((user) => user.id === userId);
    },

    /** The user's tasks, newest first, filtered by status and by a case-insensitive title search. */
    listTasks(userId: string, status: StatusFilter = 'all', query = ''): Task[] {
      const needle = query.trim().toLowerCase();
      return tasks
        .filter((task) => task.ownerId === userId)
        .filter((task) => status === 'all' || (status === 'done' ? task.done : !task.done))
        .filter((task) => task.title.toLowerCase().includes(needle))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    /** One of the user's tasks, or undefined. */
    getTask(userId: string, taskId: string): Task | undefined {
      return ownTask(userId, taskId);
    },

    /** Validates the body and stores a new open task with priority medium and no due date unless given. */
    createTask(userId: string, input: unknown): Task {
      const values = validateTaskInput(input, false);
      const now = new Date().toISOString();
      const task: Task = {
        id: randomUUID(),
        ownerId: userId,
        title: values.title!,
        priority: values.priority!,
        dueDate: values.dueDate ?? null,
        done: false,
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(task);
      return task;
    },

    /** Applies a partial update; undefined when the task is not the user's. */
    updateTask(userId: string, taskId: string, input: unknown): Task | undefined {
      const task = ownTask(userId, taskId);
      if (!task) return undefined;
      Object.assign(task, validateTaskInput(input, true), { updatedAt: new Date().toISOString() });
      return task;
    },

    /** True when the task existed (and belonged to the user) and was deleted. */
    deleteTask(userId: string, taskId: string): boolean {
      const task = ownTask(userId, taskId);
      if (!task) return false;
      tasks = tasks.filter((t) => t !== task);
      return true;
    },
  };
}
