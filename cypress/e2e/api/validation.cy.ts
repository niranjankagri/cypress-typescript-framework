// API tests: every validation rule of POST/PATCH /api/tasks answers 400 with the broken field.
import { api } from '../../support/api';
import { buildTask } from '../../support/data';
import { ErrorSchema, expectSchema } from '../../support/schemas';

interface Case {
  name: string;
  body: Record<string, unknown>;
  field?: string;
  error: string;
}

// Boundary values: 2 and 81 characters fail, 3 and 80 pass (see the "accepts" test below).
const createCases: Case[] = [
  { name: 'a missing title', body: { priority: 'high' }, field: 'title', error: 'Title is required' },
  {
    name: 'a 2-character title',
    body: { title: 'ab' },
    field: 'title',
    error: 'Title must be 3-80 characters',
  },
  {
    name: 'an 81-character title',
    body: { title: 'x'.repeat(81) },
    field: 'title',
    error: 'Title must be 3-80 characters',
  },
  {
    name: 'a title of only spaces',
    body: { title: '      ' },
    field: 'title',
    error: 'Title must be 3-80 characters',
  },
  {
    name: 'an unknown priority',
    body: { title: 'Valid title', priority: 'urgent' },
    field: 'priority',
    error: 'Priority must be one of: low, medium, high',
  },
  {
    name: 'an impossible date',
    body: { title: 'Valid title', dueDate: '2026-02-30' },
    field: 'dueDate',
    error: 'Due date must be a date in the form YYYY-MM-DD',
  },
  {
    name: 'a date in another format',
    body: { title: 'Valid title', dueDate: '16.10.2026' },
    field: 'dueDate',
    error: 'Due date must be a date in the form YYYY-MM-DD',
  },
  {
    name: 'an unknown field (typo)',
    body: { title: 'Valid title', titel: 'typo' },
    field: 'titel',
    error: 'Unknown field: titel',
  },
  {
    name: '"done" on create',
    body: { title: 'Valid title', done: true },
    field: 'done',
    error: 'Unknown field: done',
  },
];

describe('API: task validation', () => {
  beforeEach(() => {
    cy.resetData();
  });

  createCases.forEach(({ name, body, field, error }) => {
    it(`refuses a new task with ${name}`, () => {
      cy.apiToken('carol').then((token) => {
        api.createTask(token, body).then((response) => {
          expect(response.status).to.equal(400);
          expectSchema(ErrorSchema, response.body);
          expect(response.body).to.deep.equal({ error, field });
        });
        // Nothing was saved.
        api.listTasks(token).its('body.tasks').should('have.length', 0);
      });
    });
  });

  it('accepts titles of exactly 3 and 80 characters', () => {
    cy.apiToken('carol').then((token) => {
      api.createTask(token, { title: 'abc' }).its('status').should('equal', 201);
      api
        .createTask(token, { title: 'x'.repeat(80) })
        .its('status')
        .should('equal', 201);
    });
  });

  it('refuses invalid updates and keeps the task unchanged', () => {
    cy.createTask('carol', buildTask()).then((task) => {
      cy.apiToken('carol').then((token) => {
        api.updateTask(token, task.id, {}).its('body.error').should('equal', 'Nothing to update');
        api.updateTask(token, task.id, { done: 'yes' }).its('body.field').should('equal', 'done');
        api.updateTask(token, task.id, { id: 'other-id' }).its('body.field').should('equal', 'id');
        api.getTask(token, task.id).its('body').should('deep.equal', task);
      });
    });
  });

  it('answers 400 for a body that is not JSON', () => {
    cy.apiToken('carol').then((token) => {
      cy.request({
        method: 'POST',
        url: '/api/tasks',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{"title": "unclosed',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body).to.deep.equal({ error: 'Body must be valid JSON' });
      });
    });
  });
});
