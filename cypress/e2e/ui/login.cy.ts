// UI tests: logging in and out, the redirect for visitors without a login, and a cached session.
import { boardPage } from '../../pages/BoardPage';
import { loginPage } from '../../pages/LoginPage';
import { users } from '../../support/data';

describe('UI: login', () => {
  beforeEach(() => {
    cy.resetData();
  });

  it('logs in through the form and shows the board with the user name', () => {
    loginPage.visit();
    cy.env<{ password: string }>(['password']).then(({ password }) => {
      loginPage.login('alice', password);
    });
    cy.location('pathname').should('equal', '/');
    boardPage.userName().should('have.text', users.alice.name);
    boardPage.tasks().should('have.length', users.alice.taskCount);
  });

  it('shows the server message for a wrong password and stays on the login page', () => {
    loginPage.visit();
    loginPage.login('alice', 'wrong-password');
    loginPage.error().should('have.text', 'Wrong username or password');
    cy.location('pathname').should('equal', '/login');
  });

  it('disables the button while the login request is running', () => {
    // Slow the real request down by 1 s, so the "busy" state can be seen.
    cy.intercept('POST', '/api/login', (req) => {
      req.on('response', (res) => {
        res.setDelay(1000);
      });
    }).as('login');
    loginPage.visit();
    loginPage.login('alice', 'wrong-password');
    loginPage.submitButton().should('be.disabled').and('have.text', 'Logging in…');
    cy.wait('@login');
    loginPage.submitButton().should('be.enabled').and('have.text', 'Log in');
  });

  it('sends a visitor without a login to the login page', () => {
    boardPage.visit();
    cy.location('pathname').should('equal', '/login');
    loginPage.username().should('be.visible');
  });

  it('opens the board directly with a cached session (no login form)', () => {
    // cy.session logs in through the API once and restores the token for later tests and specs.
    cy.loginAs('bob');
    boardPage.visit();
    boardPage.userName().should('have.text', users.bob.name);
    cy.location('pathname').should('equal', '/');
  });

  it('logs out, removes the token and keeps the board closed', () => {
    cy.loginAs('bob');
    boardPage.visit();
    boardPage.userName().should('have.text', users.bob.name);

    boardPage.logout();

    cy.location('pathname').should('equal', '/login');
    cy.window().its('localStorage').invoke('getItem', 'taskboard.token').should('be.null');
    boardPage.visit();
    cy.location('pathname').should('equal', '/login');
  });

  it('goes back to the login page when the stored token is no longer valid', () => {
    // A token the server does not know, as after a server-side logout or expiry.
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('taskboard.token', '00000000-0000-4000-8000-000000000000');
      },
    });
    // The app sees a token and opens the board; the API answers 401; the app goes back to /login.
    cy.location('pathname').should('equal', '/login');
    cy.window().its('localStorage').invoke('getItem', 'taskboard.token').should('be.null');
  });
});
