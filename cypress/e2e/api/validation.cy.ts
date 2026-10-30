// API tests: every validation rule of POST/PATCH /api/tasks answers 400 with the broken field.
import { api } from '../../support/api';
import { buildTask } from '../../support/data';
import { ErrorSchema, expectSchema } from '../../support/schemas';

interface Case {
  id: string;
  name: string;
  body: Record<string, unknown>;
  field?: string;
  error: string;
}

// Boundary values: 2 and 81 characters fail, 3 and 80 pass (see the "accepts" test below).
const createCases: Case[] = [
  {
    id: 'TC-220',
    name: 'a missing title',
    body: { priority: 'high' },
    field: 'title',
    error: 'Title is required',
  },
  {
    id: 'TC-221',
    name: 'a 2-character title',
    body: { title: 'ab' },
    field: 'title',
    error: 'Title must be 3-80 characters',
  },
  {
    id: 'TC-222',
    name: 'an 81-character title',
    body: { title: 'x'.repeat(81) },
    field: 'title',
    error: 'Title must be 3-80 characters',
  },
  {
    id: 'TC-223',
    name: 'a title of only spaces',
    body: { title: '      ' },
    field: 'title',
    error: 'Title must be 3-80 characters',
  },
  {
    id: 'TC-224',
    name: 'an unknown priority',
    body: { title: 'Valid title', priority: 'urgent' },
    field: 'priority',
    error: 'Priority must be one of: low, medium, high',
  },
  {
    id: 'TC-225',
    name: 'an impossible date',
    body: { title: 'Valid title', dueDate: '2026-02-30' },
    field: 'dueDate',
    error: 'Due date must be a date in the form YYYY-MM-DD',
  },
  {
    id: 'TC-226',
    name: 'a date in another format',
    body: { title: 'Valid title', dueDate: '16.10.2026' },
    field: 'dueDate',
    error: 'Due date must be a date in the form YYYY-MM-DD',
  },
  {
    id: 'TC-227',
    name: 'an unknown field (typo)',
    body: { title: 'Valid title', titel: 'typo' },
    field: 'titel',
    error: 'Unknown field: titel',
  },
  {
    id: 'TC-228',
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

  createCases.forEach(({ id, name, body, field, error }) => {
    it(`[${id}] refuses a new task with ${name}`, () => {
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

  it('[TC-229] accepts titles of exactly 3 and 80 characters', () => {
    cy.apiToken('carol').then((token) => {
      api.createTask(token, { title: 'abc' }).its('status').should('equal', 201);
      api
        .createTask(token, { title: 'x'.repeat(80) })
        .its('status')
        .should('equal', 201);
    });
  });

  it('[TC-230] refuses invalid updates and keeps the task unchanged', () => {
    cy.createTask('carol', buildTask()).then((task) => {
      cy.apiToken('carol').then((token) => {
        api.updateTask(token, task.id, {}).its('body.error').should('equal', 'Nothing to update');
        api.updateTask(token, task.id, { done: 'yes' }).its('body.field').should('equal', 'done');
        api.updateTask(token, task.id, { id: 'other-id' }).its('body.field').should('equal', 'id');
        api.getTask(token, task.id).its('body').should('deep.equal', task);
      });
    });
  });

  it('[TC-231] answers 400 for a body that is not JSON', () => {
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
