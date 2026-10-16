// Cypress configuration for the three kinds of tests:
//   e2e (cypress/e2e/api + cypress/e2e/ui) against the running TaskBoard app,
//   component (cypress/component) mounting React components without the server.
import { defineConfig } from 'cypress';
import mochawesomePlugin from 'cypress-mochawesome-reporter/plugin';

export default defineConfig({
  // One HTML report (with screenshots of failures embedded) per run, in cypress/reports.
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports/e2e',
    reportPageTitle: 'TaskBoard Cypress report',
    reportTitle: 'TaskBoard: E2E and API tests',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },

  viewportWidth: 1280,
  viewportHeight: 800,
  // Cypress retries assertions for up to this long; the app answers in milliseconds.
  defaultCommandTimeout: 6000,
  // One retry in `cypress run` (CI) so a single network hiccup does not fail the build;
  // never in `cypress open`, where a flaky test should be seen.
  retries: { runMode: 1, openMode: 0 },
  // Videos cost time; CI switches them on with CYPRESS_VIDEO=true.
  video: false,

  // Secret values: only readable with cy.env(), never bundled into the browser code.
  // Override with CYPRESS_PASSWORD=... in the environment.
  env: {
    password: 'Password1!',
  },
  // Public values: readable everywhere with Cypress.expose().
  expose: {
    // `--expose demo=true` adds the intentionally failing demo specs (npm run cy:demo).
    demo: false,
  },

  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(on, config) {
      mochawesomePlugin(on);
      // The demo specs fail and skip on purpose (to show the report); left out of normal runs.
      if (!config.expose.demo) {
        config.excludeSpecPattern = ['cypress/e2e/demo/**'];
      }
      return config;
    },
  },

  component: {
    devServer: { framework: 'react', bundler: 'vite' },
    specPattern: 'cypress/component/**/*.cy.tsx',
    setupNodeEvents(on, config) {
      mochawesomePlugin(on);
      config.reporterOptions = {
        ...config.reporterOptions,
        reportDir: 'cypress/reports/component',
        reportTitle: 'TaskBoard: component tests',
      };
      return config;
    },
  },
});
