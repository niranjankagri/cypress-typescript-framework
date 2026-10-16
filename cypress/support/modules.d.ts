// The reporter ships no types for its plugin entry point.
declare module 'cypress-mochawesome-reporter/plugin' {
  export default function mochawesomePlugin(on: Cypress.PluginEvents): void;
}
