# Framework design

Why the framework is built the way it is. The README says what it does and how to run it.

## 1. Goals

1. Show what Cypress does best: tests that control the browser's network, clock and storage, and
   component tests next to end-to-end tests.
2. Stay green for reasons that are in this repository only: no public demo site, no shared test data.
3. Read like the product: a failing test name and message should tell a non-tester what broke.

## 2. Why an app inside the repository

Public practice sites change, add bot checks (one of my Playwright repos has to skip two tests on CI
because of a Cloudflare check) and share their data with everybody who tests against them. A small app in
the repo gives:

- a **reset hook** (`POST /api/test/reset`), so each test starts from known data;
- **known users and tasks** (`app/server/seed.ts`) that tests refer to by name;
- **React components** to mount in component tests;
- full control over the rules, so validation and access tests can be exact.

The cost is that the app itself must be correct: it has its own 15 `node:test` tests and runs as plain
TypeScript in Node 24 (no build step, no dependencies), so there is little to maintain.

The reset hook is a test-only route. It is on by default for local runs and CI and switched off with
`TEST_HOOKS=off`; a real deployment would not ship it.

## 3. Layers

| Layer        | Files                              | Rule                                                                   |
| ------------ | ---------------------------------- | ---------------------------------------------------------------------- |
| Specs        | `cypress/e2e`, `cypress/component` | describe behaviour; no selectors in UI specs except via page objects   |
| Page objects | `cypress/pages`                    | one object per screen; return Cypress chains, no assertions on results |
| API client   | `cypress/support/api.ts`           | typed `cy.request` wrapper; never fails on status, yields the response |
| Contracts    | `cypress/support/schemas.ts`       | zod `strictObject` schemas + `expectSchema()`                          |
| Commands     | `cypress/support/commands.ts`      | cross-cutting setup: reset, login, create data                         |
| Test data    | `cypress/support/data.ts`          | seeded users/tasks by name, `buildTask()` for unique titles            |

Page objects are plain objects with methods, not classes: there is no state to keep, and `this` stays
simple. A task row is found by its **exact** title (anchored regular expression), so "Review" does not
match "Review pull requests".

## 4. Test data and isolation

- `cy.resetData()` in `beforeEach` of every spec that changes data. The server keeps logins valid across a
  reset (user ids never change), so one login per user can be reused.
- Data a test needs is created **through the API** (`cy.createTask`), which is faster and does not depend
  on the UI the test is not about.
- New tasks get unique titles (`buildTask()`), so a test finds exactly its own task.
- Test isolation (Cypress default) clears the browser between tests; `cy.session` restores only the login.

## 5. Login: `cy.session`

`cy.loginAs(user)` wraps `cy.session(user, setup, { validate, cacheAcrossSpecs: true })`:

- **setup** logs in with `cy.request` and stores the token in localStorage, like the app does after a form
  login. The form login itself is tested once, in `login.cy.ts`.
- **validate** calls `/api/me` with the stored token. When a test revoked it (logout test), validation
  fails and Cypress runs setup again instead of starting a test with a dead session.
- The API tests use a separate per-spec token cache (`cy.apiToken`), so a UI logout never breaks them.

## 6. Secrets and switches (Cypress 16)

Cypress 16 splits configuration values in two:

- `env` holds **secret** values. They are read in Node with `cy.env(['password'])`, which yields them to
  the test, and they are never part of the spec bundle the browser loads. The demo password lives there and
  can be overridden with `CYPRESS_PASSWORD`.
- `expose` holds **public** values, readable everywhere with `Cypress.expose()`. The `demo` switch is one:
  `--expose demo=true` adds the report demo specs.

## 7. Network and time

`cy.intercept` is used in three ways:

1. **Spy**: let the request through and assert on it (`cy.wait('@create').its('request.body')`), or prove
   that no request was sent (`cy.get('@create.all').should('have.length', 0)`).
2. **Modify**: delay the real response (`res.setDelay`) to see loading and busy states.
3. **Stub**: answer instead of the server (500, 400 with a message, 401, `forceNetworkError`, a fixture).
   `times: 1` stubs only the first call, so Retry reaches the real server.

`cy.clock` freezes the browser's clock before the page loads:

- `cy.clock(date, ['Date'])` only replaces `Date`: the app's timers still run, and "today" is fixed for
  the Overdue badge. Noon is used so no time zone moves the date.
- `cy.clock(Date.now(), ['setTimeout', 'clearTimeout'])` freezes timers only: `cy.tick(299)` and
  `cy.tick(1)` prove the 300 ms search debounce and the 3 s toast exactly, without waiting.

## 8. Component tests

`cy.mount` renders one component with the app's own CSS through Vite (same config as the app). Props that
are callbacks are `cy.stub()`s, so the test asserts **what the component asked for** (for example
`onCreate` called once with `{ title, priority, dueDate: null }`), not how the parent reacts. Busy states
use a promise the test resolves itself.

When a component and an e2e test check the same rule (title length), the component test covers the
boundaries in detail and the e2e test checks once that the rule is wired up (no request sent).

## 9. Waiting and flakiness

- `cy.wait(<number>)` is a lint error (`cypress/no-unnecessary-waiting`); waits are on aliases or on
  Cypress's retrying assertions (`defaultCommandTimeout` 6 s).
- `clear()` and `type()` run as two chains (`cypress/unsafe-to-chain-command`): React may re-render the
  input after `clear()`.
- `retries: { runMode: 1, openMode: 0 }`: one retry in CI, none locally, where a flaky test should be seen.
- Messages that differ per browser (network error texts) are not asserted; only the visible state is.

## 10. Reports and CI

- `cypress-mochawesome-reporter` writes one HTML report per run with failure screenshots embedded;
  e2e and component runs write to separate folders.
- CI: one checks job (lint, Prettier, `tsc`, `node:test`), then API, UI (Chrome, Firefox, Edge) and
  component jobs in parallel. Each job builds and starts its own app, so jobs share nothing.
- The report demo is not part of CI: it fails on purpose.

## 11. What I would add next

- Accessibility checks (axe) and visual comparison: planned as their own project.
- Parallel specs with one server (or data set) per worker.
- A contract shared by the app and the tests (the zod schemas could validate the server's answers too).
