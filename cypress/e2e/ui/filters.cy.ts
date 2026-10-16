// UI tests: status filter and search, including the 300 ms search debounce (controlled with cy.clock).
import { boardPage } from '../../pages/BoardPage';
import { seeded } from '../../support/data';

describe('UI: filters and search', () => {
  beforeEach(() => {
    cy.resetData();
    cy.loginAs('alice');
  });

  it('shows active, done and all tasks, and marks the chosen filter', () => {
    boardPage.visit();

    boardPage.filter('active');
    boardPage.filterButton('active').should('have.attr', 'aria-pressed', 'true');
    boardPage.tasks().should('have.length', 3);
    cy.contains(seeded.done).should('not.exist');

    boardPage.filter('done');
    boardPage.titles().should('have.length', 1).and('have.text', seeded.done);

    boardPage.filter('all');
    boardPage.filterButton('active').should('have.attr', 'aria-pressed', 'false');
    boardPage.tasks().should('have.length', 4);
  });

  it('sends the filter to the API as a query parameter', () => {
    cy.intercept('GET', '/api/tasks*').as('list');
    boardPage.visit();
    cy.wait('@list').its('request.query').should('deep.equal', { status: 'all' });
    boardPage.filter('done');
    cy.wait('@list').its('request.query').should('deep.equal', { status: 'done' });
  });

  it('searches only after typing stops for 300 ms', () => {
    // Freeze the timers before the page loads; Date keeps today's date.
    cy.clock(Date.now(), ['setTimeout', 'clearTimeout']);
    cy.intercept('GET', '/api/tasks*').as('list');
    boardPage.visit();
    cy.wait('@list');

    boardPage.search('pull');
    // Typing done, but the debounce timer has not fired: no search request yet.
    cy.tick(299);
    cy.get('@list.all').should('have.length', 1);

    cy.tick(1);
    cy.wait('@list').its('request.query.q').should('equal', 'pull');
    boardPage.titles().should('have.length', 1).and('have.text', seeded.noDueDate);
  });

  it('combines search and status filter, and says when nothing matches', () => {
    boardPage.visit();
    boardPage.search('test');
    boardPage.tasks().should('have.length', 2);
    boardPage.filter('done');
    boardPage.titles().should('have.length', 1).and('have.text', seeded.done);
    boardPage.search('no such task');
    boardPage.emptyState().should('have.text', 'No tasks match this filter.');
  });
});
