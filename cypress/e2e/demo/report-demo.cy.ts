// REPORT DEMO: these tests pass, fail and skip ON PURPOSE, to show what the HTML report looks like
// for each result (a failed UI test gets its screenshot embedded). Left out of normal runs;
// run them with: npm run cy:demo
import { boardPage } from '../../pages/BoardPage';
import { seeded, users } from '../../support/data';

describe('Report demo (fails and skips on purpose)', () => {
  beforeEach(() => {
    cy.resetData();
    cy.loginAs('alice');
    boardPage.visit();
  });

  it('passes: shows the seeded tasks', () => {
    boardPage.tasks().should('have.length', users.alice.taskCount);
  });

  it('fails on purpose: expects a task that does not exist', () => {
    // Wrong on purpose: alice has no task with this title. The report shows the error and a screenshot.
    boardPage.task('A task that was never created').should('exist');
  });

  it('fails on purpose: expects the wrong number of tasks', () => {
    boardPage.taskCount().should('have.text', `${users.alice.taskCount + 1} tasks`);
  });

  it.skip('skipped on purpose: shows how a skipped test looks in the report', () => {
    boardPage.task(seeded.future).should('exist');
  });
});
