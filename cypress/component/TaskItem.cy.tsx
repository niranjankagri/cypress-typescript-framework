// Component tests for one task row: rendering rules and the callbacks it calls.
// No server and no page: the component gets its props and cy.stub() records the calls.
import { TaskItem } from '../../app/web/src/components/TaskItem.tsx';
import type { Task } from '../../app/web/src/types.ts';

const task: Task = {
  id: 't1',
  title: 'Write component tests',
  priority: 'high',
  dueDate: '2026-10-20',
  done: false,
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-01T08:00:00.000Z',
};

/**
 * Mounts one row of the sample task (with overrides) inside a list, with stubbed callbacks named @toggle,
 * @rename and @delete.
 */
function mountItem(overrides: Partial<Task> = {}) {
  const props = {
    onToggle: cy.stub().as('toggle'),
    onRename: cy.stub().as('rename'),
    onDelete: cy.stub().as('delete'),
  };
  cy.mount(
    <ul>
      <TaskItem task={{ ...task, ...overrides }} {...props} />
    </ul>,
  );
}

describe('<TaskItem />', () => {
  it('shows title, priority and the formatted due date', () => {
    mountItem();
    cy.getBySel('task-title').should('have.text', task.title);
    cy.getBySel('task-priority').should('have.text', 'high').and('have.class', 'high');
    cy.getBySel('task-due').should('have.text', '20 Oct 2026');
  });

  it('shows "Overdue" only for an open task with a past due date', () => {
    cy.clock(new Date(2026, 9, 21, 12).getTime(), ['Date']);
    mountItem();
    cy.getBySel('task-overdue').should('have.text', 'Overdue');
  });

  it('hides "Overdue" for a done task and strikes it through', () => {
    cy.clock(new Date(2026, 9, 21, 12).getTime(), ['Date']);
    mountItem({ done: true });
    cy.getBySel('task-overdue').should('not.exist');
    cy.getBySel('task').should('have.class', 'done');
    cy.getBySel('task-done').should('be.checked');
  });

  it('calls onToggle with the new state', () => {
    mountItem();
    cy.getBySel('task-done').click();
    cy.get('@toggle').should('have.been.calledOnceWith', true);
  });

  it('calls onRename with the trimmed new title, and not for an unchanged one', () => {
    mountItem();
    cy.getBySel('edit-task').click();
    cy.getBySel('edit-title').should('be.focused').and('have.value', task.title);
    cy.getBySel('save-title').click();
    cy.get('@rename').should('not.have.been.called');

    cy.getBySel('edit-task').click();
    cy.getBySel('edit-title').clear();
    cy.getBySel('edit-title').type('  New title  {enter}');
    cy.get('@rename').should('have.been.calledOnceWith', 'New title');
  });

  it('calls onDelete only after the user confirms', () => {
    mountItem();
    // One handler for both clicks: "Cancel" the first time, "OK" the second. (With two handlers,
    // any one returning false cancels the dialog.)
    const confirm = cy.stub().as('confirm');
    confirm.onFirstCall().returns(false).onSecondCall().returns(true);
    cy.on('window:confirm', confirm);

    cy.getBySel('delete-task').click();
    cy.get('@delete').should('not.have.been.called');

    cy.getBySel('delete-task').click();
    cy.get('@delete').should('have.been.calledOnce');
    cy.get('@confirm').should('have.been.calledTwice').and('have.been.calledWith', `Delete "${task.title}"?`);
  });
});
