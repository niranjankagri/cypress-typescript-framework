// Component tests for the toast: shown with a message, nothing without one, onDone after 3 s.
import { Toast, TOAST_MS } from '../../app/web/src/components/Toast.tsx';

describe('<Toast />', () => {
  it('renders nothing without a message', () => {
    cy.mount(<Toast message="" onDone={cy.stub()} />);
    cy.getBySel('toast').should('not.exist');
  });

  it('shows the message as a status and calls onDone after exactly 3 s', () => {
    cy.clock();
    cy.mount(<Toast message="Task added" onDone={cy.stub().as('done')} />);
    cy.getBySel('toast').should('have.text', 'Task added').and('have.attr', 'role', 'status');
    cy.tick(TOAST_MS - 1);
    cy.get('@done').should('not.have.been.called');
    cy.tick(1);
    cy.get('@done').should('have.been.calledOnce');
  });
});
