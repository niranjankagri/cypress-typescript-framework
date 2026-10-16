// Custom commands shared by the API and UI tests.
import { api } from './api';
import type { NewTask } from './api';
import type { Username } from './data';
// Aliased: inside `namespace Cypress` the name Task would mean Cypress's own Task type.
import type { Task as ApiTask } from './schemas';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Gets elements by their data-cy attribute: cy.getBySel('add-task'). */
      getBySel(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElement>>;
      /** Puts the seed data back (POST /api/test/reset). */
      resetData(): Chainable<void>;
      /** Logs in through the API and yields the token; cached per user for the whole spec. */
      apiToken(username: Username): Chainable<string>;
      /** UI login without the UI: a cached cy.session that holds the token in localStorage. */
      loginAs(username: Username): Chainable<void>;
      /** Creates a task through the API (test setup) and yields it. */
      createTask(username: Username, task: NewTask): Chainable<ApiTask>;
    }
  }
}

Cypress.Commands.add(
  'getBySel',
  (selector: string, options?: Partial<Cypress.Loggable & Cypress.Timeoutable>) =>
    cy.get(`[data-cy="${selector}"]`, options),
);

Cypress.Commands.add('resetData', () => {
  cy.request({ method: 'POST', url: '/api/test/reset', log: false }).its('status').should('equal', 204);
});

// One token per user and spec: the server keeps tokens valid across resets.
const tokens = new Map<Username, string>();

Cypress.Commands.add('apiToken', (username: Username) => {
  const cached = tokens.get(username);
  if (cached) return cy.wrap(cached, { log: false });
  // The password is a secret value: cy.env() reads it in Node, it is never part of the spec bundle.
  return cy.env<{ password: string }>(['password']).then(({ password }) =>
    api.login({ username, password }).then((response) => {
      expect(response.status, `API login as ${username}`).to.equal(200);
      tokens.set(username, response.body.token);
      return response.body.token;
    }),
  );
});

Cypress.Commands.add('loginAs', (username: Username) => {
  cy.session(
    username,
    () => {
      // A fresh token for the browser (not the cached API one): a UI logout test may revoke it.
      cy.env<{ password: string }>(['password']).then(({ password }) => {
        api.login({ username, password }).then((response) => {
          expect(response.status, `login as ${username}`).to.equal(200);
          window.localStorage.setItem('taskboard.token', response.body.token);
        });
      });
    },
    {
      // Runs when a cached session is restored: if the token was revoked (logout test), log in again.
      validate() {
        const token = window.localStorage.getItem('taskboard.token') ?? '';
        api.me(token).its('status').should('equal', 200);
      },
      cacheAcrossSpecs: true,
    },
  );
});

Cypress.Commands.add('createTask', (username: Username, task: NewTask) =>
  cy.apiToken(username).then((token) =>
    api.createTask(token, task).then((response): ApiTask => {
      expect(response.status, `create "${task.title}"`).to.equal(201);
      return response.body;
    }),
  ),
);

export {};
