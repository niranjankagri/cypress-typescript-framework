// Component tests for the new-task form: what it sends, its own checks, and the busy and error states.
import { TaskForm } from '../../app/web/src/components/TaskForm.tsx';

describe('<TaskForm />', () => {
  it('sends title, priority and due date, then clears the form', () => {
    const onCreate = cy.stub().as('create').resolves();
    cy.mount(<TaskForm onCreate={onCreate} />);

    cy.getBySel('new-task-title').type('  Plan the release  ');
    cy.getBySel('new-task-priority').select('low');
    cy.getBySel('new-task-due').type('2030-03-01');
    cy.getBySel('add-task').click();

    cy.get('@create').should('have.been.calledOnceWith', {
      title: 'Plan the release',
      priority: 'low',
      dueDate: '2030-03-01',
    });
    cy.getBySel('new-task-title').should('have.value', '');
    cy.getBySel('new-task-priority').should('have.value', 'medium');
  });

  it('sends dueDate null when no date is chosen', () => {
    const onCreate = cy.stub().as('create').resolves();
    cy.mount(<TaskForm onCreate={onCreate} />);
    cy.getBySel('new-task-title').type('No date');
    cy.getBySel('add-task').click();
    cy.get('@create').should('have.been.calledOnceWith', {
      title: 'No date',
      priority: 'medium',
      dueDate: null,
    });
  });

  // Boundary values of the title check: 2 and 81 characters are refused before any call.
  ['ab', 'x'.repeat(81)].forEach((title) => {
    it(`refuses a ${title.length}-character title without calling onCreate`, () => {
      const onCreate = cy.stub().as('create').resolves();
      cy.mount(<TaskForm onCreate={onCreate} />);
      cy.getBySel('new-task-title').type(title, { delay: 0 });
      cy.getBySel('add-task').click();
      cy.getBySel('form-error').should('have.text', 'Title must be 3-80 characters');
      cy.get('@create').should('not.have.been.called');
    });
  });

  it('disables the button while saving', () => {
    // A promise the test resolves itself: the form stays "busy" until then.
    let finish: () => void = () => undefined;
    const onCreate = cy.stub().returns(new Promise<void>((resolve) => (finish = resolve)));
    cy.mount(<TaskForm onCreate={onCreate} />);
    cy.getBySel('new-task-title').type('Slow save');
    cy.getBySel('add-task').click();
    cy.getBySel('add-task').should('be.disabled').and('have.text', 'Adding…');
    cy.then(() => finish());
    cy.getBySel('add-task').should('be.enabled').and('have.text', 'Add task');
  });

  it('shows the error from onCreate and keeps the input', () => {
    const onCreate = cy.stub().rejects(new Error('A task with this title already exists'));
    cy.mount(<TaskForm onCreate={onCreate} />);
    cy.getBySel('new-task-title').type('Duplicate');
    cy.getBySel('add-task').click();
    cy.getBySel('form-error').should('have.text', 'A task with this title already exists');
    cy.getBySel('new-task-title').should('have.value', 'Duplicate');
  });
});
