// UI tests with cy.clock: the "Overdue" badge depends on today's date, and the toast hides itself
// after 3 s. Freezing the browser clock makes both exact and fast, on any day the tests run.
import { boardPage } from '../../pages/BoardPage';
import { buildTask, seeded } from '../../support/data';

/** Noon local time on the given day: no time-zone edge cases around midnight. */
function day(year: number, month: number, date: number): number {
  return new Date(year, month - 1, date, 12).getTime();
}

describe('UI: time (cy.clock)', () => {
  beforeEach(() => {
    cy.resetData();
    cy.loginAs('alice');
  });

  it('marks an open task as overdue the day after its due date', () => {
    // Seeded: "Renew test environment certificate" is due on 1 Oct 2026.
    cy.clock(day(2026, 10, 2), ['Date']);
    boardPage.visit();
    boardPage.task(seeded.overdue).find('[data-cy="task-overdue"]').should('have.text', 'Overdue');
    boardPage.task(seeded.future).find('[data-cy="task-overdue"]').should('not.exist');
  });

  it('does not mark a task as overdue on its due date', () => {
    cy.clock(day(2026, 10, 1), ['Date']);
    boardPage.visit();
    boardPage.task(seeded.overdue).should('exist').find('[data-cy="task-overdue"]').should('not.exist');
  });

  it('never marks a done task as overdue', () => {
    // Seeded: "Update test plan" was due on 30 Sep 2026 and is done.
    cy.clock(day(2027, 1, 1), ['Date']);
    boardPage.visit();
    boardPage.task(seeded.done).find('[data-cy="task-overdue"]').should('not.exist');
    boardPage.task(seeded.overdue).find('[data-cy="task-overdue"]').should('exist');
  });

  it('hides the toast after exactly 3 seconds', () => {
    cy.clock(Date.now(), ['setTimeout', 'clearTimeout']);
    boardPage.visit();
    boardPage.addTask(buildTask().title);
    boardPage.toast().should('have.text', 'Task added');

    cy.tick(2999);
    boardPage.toast().should('be.visible');
    cy.tick(1);
    boardPage.toast().should('not.exist');
  });
});
