// UI tests with cy.intercept: states that are hard to produce with the real server
// (slow answers, server errors, network failures, an expired login) and a fully stubbed list.
import { boardPage } from '../../pages/BoardPage';
import { buildTask, users } from '../../support/data';

describe('UI: network conditions (cy.intercept)', () => {
  beforeEach(() => {
    cy.resetData();
    cy.loginAs('alice');
  });

  it('[TC-127] shows the loading state while the list is slow', () => {
    cy.intercept('GET', '/api/tasks*', (req) => {
      req.on('response', (res) => {
        res.setDelay(1500);
      });
    }).as('list');
    boardPage.visit();
    boardPage.loading().should('be.visible');
    boardPage.tasks().should('not.exist');
    cy.wait('@list');
    boardPage.loading().should('not.exist');
    boardPage.tasks().should('have.length', users.alice.taskCount);
  });

  it('[TC-128] shows an error banner on a server error and recovers with Retry', () => {
    // Only the first request fails (times: 1); Retry reaches the real server.
    cy.intercept(
      { method: 'GET', url: '/api/tasks*', times: 1 },
      { statusCode: 500, body: { error: 'Database is down' } },
    ).as('failing');
    boardPage.visit();
    cy.wait('@failing');
    boardPage.errorBanner().should('contain.text', 'Database is down');

    boardPage.retry();
    boardPage.errorBanner().should('not.exist');
    boardPage.tasks().should('have.length', users.alice.taskCount);
  });

  it('[TC-129] shows an error banner when the network fails', () => {
    cy.intercept('GET', '/api/tasks*', { forceNetworkError: true }).as('offline');
    boardPage.visit();
    // The browser's own message differs (Chrome: "Failed to fetch", Firefox: "NetworkError ...").
    boardPage.errorBanner().should('be.visible');
    boardPage.tasks().should('not.exist');
  });

  it('[TC-130] renders whatever the API returns (list stubbed from a fixture)', () => {
    cy.intercept('GET', '/api/tasks*', { fixture: 'tasks.json' }).as('list');
    boardPage.visit();
    cy.wait('@list');
    boardPage.tasks().should('have.length', 3);
    boardPage.taskCount().should('have.text', '3 tasks');
    // A done task is never overdue, even with a due date in the past.
    boardPage.task('Stubbed finished task').find('[data-cy="task-overdue"]').should('not.exist');
    boardPage.task('Stubbed low-priority task').find('[data-cy="task-priority"]').should('have.text', 'low');
  });

  it("[TC-131] shows the server's validation message in the form and keeps the input", () => {
    const task = buildTask();
    cy.intercept('POST', '/api/tasks', {
      statusCode: 400,
      body: { error: 'A task with this title already exists', field: 'title' },
    }).as('create');
    boardPage.visit();
    boardPage.addTask(task.title);
    cy.wait('@create');
    boardPage.formError().should('have.text', 'A task with this title already exists');
    // The user can correct the title and send again: nothing was cleared.
    boardPage.titleInput().should('have.value', task.title);
  });

  it('[TC-132] sends the user to the login page when the API says the login expired', () => {
    cy.intercept('GET', '/api/tasks*', { statusCode: 401, body: { error: 'Not logged in' } });
    boardPage.visit();
    cy.location('pathname').should('equal', '/login');
  });

  it('[TC-133] sends the token as a Bearer header on every API call', () => {
    cy.intercept('GET', '/api/me').as('me');
    cy.intercept('GET', '/api/tasks*').as('list');
    boardPage.visit();
    (['@me', '@list'] as const).forEach((alias) => {
      cy.wait(alias)
        .its('request.headers.authorization')
        .should('match', /^Bearer [0-9a-f-]{36}$/);
    });
  });
});
