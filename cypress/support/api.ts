// Typed client for the TaskBoard API, built on cy.request.
// Every call passes failOnStatusCode: false and yields the full response, so a test can assert
// on 4xx answers as easily as on 2xx ones.
import type { Task, User } from './schemas';

export type Priority = 'low' | 'medium' | 'high';

export interface NewTask {
  title: string;
  priority?: Priority;
  dueDate?: string | null;
}

export type TaskChanges = Partial<Omit<NewTask, 'title'> & { title: string; done: boolean }>;

type Response<T> = Cypress.Chainable<Cypress.Response<T>>;
export interface ApiError {
  error: string;
  field?: string;
}

/** One API request with the token when given; failOnStatusCode: false hands every status to the test. */
function call<T>(method: string, url: string, token?: string, body?: unknown): Response<T> {
  return cy.request<T>({
    method,
    url,
    body: body as Cypress.RequestBody,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    failOnStatusCode: false,
  });
}

export const api = {
  health: () => call<{ status: string }>('GET', '/api/health'),

  /** Sends any body to /api/login: also used for the "missing field" tests. */
  login: (body: unknown) =>
    call<{ token: string; user: User } & ApiError>('POST', '/api/login', undefined, body),
  logout: (token: string) => call<''>('POST', '/api/logout', token),
  me: (token?: string) => call<User & ApiError>('GET', '/api/me', token),

  listTasks: (token?: string, query: { status?: string; q?: string } = {}) =>
    cy.request<{ tasks: Task[] } & ApiError>({
      url: '/api/tasks',
      qs: query,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      failOnStatusCode: false,
    }),
  getTask: (token: string, id: string) => call<Task & ApiError>('GET', `/api/tasks/${id}`, token),
  createTask: (token: string, task: NewTask | Record<string, unknown>) =>
    call<Task & ApiError>('POST', '/api/tasks', token, task),
  updateTask: (token: string, id: string, changes: TaskChanges | Record<string, unknown>) =>
    call<Task & ApiError>('PATCH', `/api/tasks/${id}`, token, changes),
  deleteTask: (token: string, id: string) => call<'' & ApiError>('DELETE', `/api/tasks/${id}`, token),
};
