// UI tests: the task list and everything a user does with a task (add, finish, rename, delete).
import { boardPage, fill } from '../../pages/BoardPage';
import { buildTask, seeded, users } from '../../support/data';

describe('UI: tasks', () => {
  beforeEach(() => {
    cy.resetData();
  });

  context('as alice (seeded tasks)', () => {
    beforeEach(() => {
      cy.loginAs('alice');
      boardPage.visit();
    });

    it('lists the tasks newest first with the count', () => {
      boardPage.taskCount().should('have.text', `${users.alice.taskCount} tasks`);
      boardPage
        .titles()
        .then(($titles) => Cypress._.map($titles, 'innerText'))
        .should('deep.equal', [seeded.future, seeded.noDueDate, seeded.overdue, seeded.done]);
    });

    it('shows priority and due date, and strikes through a done task', () => {
      boardPage.task(seeded.future).within(() => {
        cy.getBySel('task-priority').should('have.text', 'high');
        cy.getBySel('task-due').should('have.text', '15 Jan 2030');
      });
      boardPage.task(seeded.noDueDate).find('[data-cy="task-due"]').should('not.exist');
      boardPage
        .task(seeded.done)
        .should('have.class', 'done')
        .find('[data-cy="task-done"]')
        .should('be.checked');
    });

    it('marks a task as done and opens it again', () => {
      boardPage.toggle(seeded.noDueDate);
      boardPage.toast().should('have.text', 'Task done');
      boardPage.task(seeded.noDueDate).should('have.class', 'done');

      boardPage.toggle(seeded.noDueDate);
      boardPage.toast().should('have.text', 'Task reopened');
      boardPage.task(seeded.noDueDate).should('not.have.class', 'done');
    });

    it('renames a task in place with Enter', () => {
      boardPage.rename(seeded.noDueDate, 'Review and merge pull requests');
      boardPage.toast().should('have.text', 'Task updated');
      boardPage.task('Review and merge pull requests').should('exist');
      cy.contains(seeded.noDueDate).should('not.exist');
    });

    it('keeps the old title when editing is cancelled with Escape', () => {
      cy.intercept('PATCH', '/api/tasks/*').as('update');
      boardPage.task(seeded.noDueDate).find('[data-cy="edit-task"]').click();
      fill('edit-title', 'Something else{esc}');
      boardPage.task(seeded.noDueDate).should('exist');
      // Nothing was sent to the server.
      cy.get('@update.all').should('have.length', 0);
    });

    it('deletes a task after the confirmation', () => {
      cy.on('window:confirm', (text) => {
        expect(text).to.equal(`Delete "${seeded.noDueDate}"?`);
        return true;
      });
      boardPage.delete(seeded.noDueDate);
      boardPage.toast().should('have.text', 'Task deleted');
      boardPage.tasks().should('have.length', users.alice.taskCount - 1);
      cy.contains(seeded.noDueDate).should('not.exist');
    });

    it('keeps the task when the confirmation is cancelled', () => {
      // Returning false from the window:confirm handler clicks "Cancel".
      cy.on('window:confirm', () => false);
      boardPage.delete(seeded.noDueDate);
      boardPage.tasks().should('have.length', users.alice.taskCount);
      boardPage.task(seeded.noDueDate).should('exist');
    });
  });

  context('as carol (no tasks)', () => {
    beforeEach(() => {
      cy.loginAs('carol');
      boardPage.visit();
    });

    it('shows the empty state', () => {
      boardPage.emptyState().should('have.text', 'No tasks yet. Add your first one above.');
      boardPage.tasks().should('not.exist');
    });

    it('adds a task with priority and due date, then clears the form', () => {
      const task = buildTask();
      cy.intercept('POST', '/api/tasks').as('create');

      boardPage.addTask(task.title, { priority: 'high', dueDate: '2030-05-20' });

      // The request body is exactly what the form holds.
      cy.wait('@create')
        .its('request.body')
        .should('deep.equal', { title: task.title, priority: 'high', dueDate: '2030-05-20' });
      boardPage.toast().should('have.text', 'Task added');
      boardPage.task(task.title).within(() => {
        cy.getBySel('task-priority').should('have.text', 'high');
        cy.getBySel('task-due').should('have.text', '20 May 2030');
      });
      boardPage.titleInput().should('have.value', '');
      boardPage.taskCount().should('have.text', '1 task');
    });

    it('checks the title length before calling the API', () => {
      cy.intercept('POST', '/api/tasks').as('create');
      boardPage.addTask('ab');
      boardPage.formError().should('have.text', 'Title must be 3-80 characters');
      boardPage.addTask('   ');
      boardPage.formError().should('be.visible');
      // No request left the browser.
      cy.get('@create.all').should('have.length', 0);
      boardPage.emptyState().should('be.visible');
    });

    it('survives a page reload (data comes from the server, login from localStorage)', () => {
      const task = buildTask();
      boardPage.addTask(task.title);
      boardPage.task(task.title).should('exist');
      cy.reload();
      boardPage.task(task.title).should('exist');
      boardPage.userName().should('have.text', users.carol.name);
    });
  });
});
