// Page object for /login. Methods return Cypress chains, so specs can keep chaining assertions.
import { fill } from './BoardPage';

export const loginPage = {
  visit() {
    cy.visit('/login');
  },

  username: () => cy.getBySel('username'),
  password: () => cy.getBySel('password'),
  submitButton: () => cy.getBySel('login-submit'),
  error: () => cy.getBySel('login-error'),

  /** Fills the form and submits it. The password is not logged in the command log. */
  login(username: string, password: string) {
    fill('username', username);
    fill('password', password, { log: false });
    this.submitButton().click();
  },
};
