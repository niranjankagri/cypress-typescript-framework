// Page object for the board at /. Finds a task row by its title, so specs read like the UI:
// boardPage.toggle('Write tests'), boardPage.task('Write tests').should(...).
import type { Priority } from '../support/api';

export type StatusFilter = 'all' | 'active' | 'done';

export const boardPage = {
  visit() {
    cy.visit('/');
  },

  // Header
  userName: () => cy.getBySel('user-name'),
  logout: () => cy.getBySel('logout').click(),

  // New-task form
  titleInput: () => cy.getBySel('new-task-title'),
  formError: () => cy.getBySel('form-error'),

  /** Fills the new-task form and submits it; priority and due date only when given. */
  addTask(title: string, options: { priority?: Priority; dueDate?: string } = {}) {
    if (title) fill('new-task-title', title);
    if (options.priority) cy.getBySel('new-task-priority').select(options.priority);
    if (options.dueDate) cy.getBySel('new-task-due').type(options.dueDate);
    cy.getBySel('add-task').click();
  },

  // Filters
  filter(status: StatusFilter) {
    cy.getBySel(`filter-${status}`).click();
  },
  filterButton: (status: StatusFilter) => cy.getBySel(`filter-${status}`),
  search(text: string) {
    fill('search', text);
  },

  // List and states
  tasks: () => cy.getBySel('task'),
  titles: () => cy.getBySel('task-title'),
  taskCount: () => cy.getBySel('task-count'),
  loading: () => cy.getBySel('loading'),
  emptyState: () => cy.getBySel('empty-state'),
  errorBanner: () => cy.getBySel('error-banner'),
  retry: () => cy.getBySel('retry').click(),
  toast: () => cy.getBySel('toast'),

  /** The row of the task with this exact title. */
  task: (title: string) =>
    cy.contains('[data-cy="task-title"]', new RegExp(`^${escapeRegExp(title)}$`)).parents('[data-cy="task"]'),

  toggle(title: string) {
    this.task(title).find('[data-cy="task-done"]').click();
  },

  rename(title: string, newTitle: string) {
    this.task(title).find('[data-cy="edit-task"]').click();
    fill('edit-title', `${newTitle}{enter}`);
  },

  /** Clicks Delete; Cypress accepts the confirm dialog unless the spec says otherwise. */
  delete(title: string) {
    this.task(title).find('[data-cy="delete-task"]').click();
  },
};

/**
 * Clears a field, then types into it. Two separate chains: React may re-render the field after
 * clear(), and a new cy.getBySel() always finds the current element.
 */
export function fill(selector: string, text: string, options: Partial<Cypress.TypeOptions> = {}) {
  cy.getBySel(selector).clear();
  cy.getBySel(selector).type(text, options);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
