// API tests: create, read, update and delete tasks, filters, and access to other users' tasks.
import { api } from '../../support/api';
import { buildTask, seeded, users } from '../../support/data';
import { expectSchema, TaskListSchema, TaskSchema } from '../../support/schemas';

describe('API: tasks', () => {
  beforeEach(() => {
    cy.resetData();
  });

  it("[TC-211] lists only the user's own tasks, newest first, matching the contract", () => {
    cy.apiToken('alice').then((token) => {
      api.listTasks(token).then((response) => {
        expect(response.status).to.equal(200);
        expectSchema(TaskListSchema, response.body);
        const titles = response.body.tasks.map((task) => task.title);
        expect(titles).to.have.length(users.alice.taskCount);
        expect(titles).to.deep.equal([seeded.future, seeded.noDueDate, seeded.overdue, seeded.done]);
      });
    });
  });

  it('[TC-212] filters by status and by a case-insensitive search', () => {
    cy.apiToken('alice').then((token) => {
      api.listTasks(token, { status: 'done' }).its('body.tasks').should('have.length', 1);
      api.listTasks(token, { status: 'active' }).its('body.tasks').should('have.length', 3);
      api.listTasks(token, { q: 'REVIEW' }).then((response) => {
        expect(response.body.tasks.map((task) => task.title)).to.deep.equal([seeded.noDueDate]);
      });
    });
  });

  it('[TC-213] answers 400 for an unknown status filter', () => {
    cy.apiToken('alice').then((token) => {
      api.listTasks(token, { status: 'archived' }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body.field).to.equal('status');
      });
    });
  });

  it('[TC-214] creates a task with defaults and returns it with 201', () => {
    const task = buildTask();
    cy.apiToken('carol').then((token) => {
      api.createTask(token, { title: task.title }).then((response) => {
        expect(response.status).to.equal(201);
        expectSchema(TaskSchema, response.body);
        expect(response.body).to.deep.include({
          title: task.title,
          priority: 'medium',
          dueDate: null,
          done: false,
        });
      });
      // The new task is now part of the list.
      api.listTasks(token).its('body.tasks').should('have.length', 1);
    });
  });

  it('[TC-215] trims the title before saving', () => {
    cy.apiToken('carol').then((token) => {
      api
        .createTask(token, { title: '   Padded title   ' })
        .its('body.title')
        .should('equal', 'Padded title');
    });
  });

  it('[TC-216] updates a task partially and changes updatedAt', () => {
    cy.createTask('carol', buildTask({ priority: 'low' })).then((created) => {
      cy.apiToken('carol').then((token) => {
        api.updateTask(token, created.id, { done: true, priority: 'high' }).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body).to.deep.include({ title: created.title, done: true, priority: 'high' });
          expect(response.body.updatedAt >= created.updatedAt, 'updatedAt moved forward').to.equal(true);
        });
      });
    });
  });

  it('[TC-217] deletes a task, after which it is gone', () => {
    cy.createTask('carol', buildTask()).then((created) => {
      cy.apiToken('carol').then((token) => {
        api.deleteTask(token, created.id).its('status').should('equal', 204);
        api.getTask(token, created.id).its('status').should('equal', 404);
        api.deleteTask(token, created.id).its('status').should('equal', 404);
      });
    });
  });

  it("[TC-218] answers 404 for another user's task on read, update and delete", () => {
    // Alice must not see, change or delete Bob's task; 404 (not 403) hides that it exists.
    cy.apiToken('alice').then((token) => {
      api.getTask(token, seeded.bobsTaskId).its('status').should('equal', 404);
      api.updateTask(token, seeded.bobsTaskId, { done: true }).its('status').should('equal', 404);
      api.deleteTask(token, seeded.bobsTaskId).its('status').should('equal', 404);
    });
    // And Bob's task is unchanged.
    cy.apiToken('bob').then((token) => {
      api.getTask(token, seeded.bobsTaskId).its('body.done').should('equal', false);
    });
  });

  it('[TC-219] puts the seed data back on reset', () => {
    cy.apiToken('alice').then((token) => {
      api
        .listTasks(token)
        .its('body.tasks.0.id')
        .then((id: string) => {
          api.deleteTask(token, id).its('status').should('equal', 204);
        });
      api
        .listTasks(token)
        .its('body.tasks')
        .should('have.length', users.alice.taskCount - 1);
      cy.resetData();
      api.listTasks(token).its('body.tasks').should('have.length', users.alice.taskCount);
    });
  });
});
