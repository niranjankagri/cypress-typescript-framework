// ESLint flat config: TypeScript rules for all code, Cypress rules for the tests.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import pluginCypress from 'eslint-plugin-cypress';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/', 'dist/', 'cypress/screenshots/', 'cypress/videos/', 'cypress/reports/'] },

  js.configs.recommended,
  // Type-aware rules: each file is checked with its nearest tsconfig.json
  // (root one for the app, cypress/tsconfig.json for the tests).
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // A leading underscore marks a parameter that a signature requires but the code doesn't use.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  {
    files: ['cypress/**/*.{ts,tsx}'],
    ...pluginCypress.configs.recommended,
    rules: {
      ...pluginCypress.configs.recommended.rules,
      // cy.wait(<number>) is the main source of slow and flaky Cypress tests: wait on an alias instead.
      'cypress/no-unnecessary-waiting': 'error',
      // A test that keeps the value of a command in a variable reads it before the command has run.
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-force': 'error',
      'cypress/no-pause': 'error',
      // Cypress chains are not promises, and `expect(...).to.be.true` style is valid Chai.
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },

  // Plain JavaScript files (this config) are not part of a TypeScript project.
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { ...tseslint.configs.disableTypeChecked.languageOptions, globals: globals.node },
  },

  // Last: turn off every rule that would fight with Prettier's formatting.
  prettier,
);
