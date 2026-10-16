// Loaded before every component spec: cy.mount for React, the app's styles and the shared commands.
import 'cypress-mochawesome-reporter/register';
import { mount } from 'cypress/react';
import '../../app/web/src/styles.css';
import './commands';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Renders a React element into the test page: cy.mount(<TaskItem ... />). */
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);
