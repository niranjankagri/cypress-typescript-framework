// API tests: login, logout and the token check on protected routes.
import { api } from '../../support/api';
import { users } from '../../support/data';
import { ErrorSchema, expectSchema, LoginResponseSchema, UserSchema } from '../../support/schemas';

describe('API: authentication', () => {
  let password = '';

  before(() => {
    cy.env<{ password: string }>(['password']).then((env) => {
      password = env.password;
    });
  });

  it('[TC-201] logs in with valid credentials and returns a token and the user without password', () => {
    // Act
    api.login({ username: 'alice', password }).then((response) => {
      // Assert: status, contract (no extra fields such as a password) and values
      expect(response.status).to.equal(200);
      expectSchema(LoginResponseSchema, response.body);
      expect(response.body.user).to.deep.include({ username: 'alice', name: users.alice.name });
    });
  });

  it('[TC-202] refuses a wrong password with 401 and a clear message', () => {
    api.login({ username: 'alice', password: 'wrong-password' }).then((response) => {
      expect(response.status).to.equal(401);
      expectSchema(ErrorSchema, response.body);
      expect(response.body.error).to.equal('Wrong username or password');
    });
  });

  it('[TC-203] refuses an unknown user with the same message as a wrong password', () => {
    // The same answer for both cases does not reveal which usernames exist.
    api.login({ username: 'mallory', password }).then((response) => {
      expect(response.status).to.equal(401);
      expect(response.body.error).to.equal('Wrong username or password');
    });
  });

  // Data-driven: one test per broken body, generated from the table.
  const badBodies: { id: string; name: string; body: unknown }[] = [
    { id: 'TC-204', name: 'no password', body: { username: 'alice' } },
    { id: 'TC-205', name: 'no username', body: { password: 'x' } },
    { id: 'TC-206', name: 'empty strings', body: { username: '', password: '' } },
    { id: 'TC-207', name: 'username is a number', body: { username: 42, password: 'x' } },
  ];
  badBodies.forEach(({ id, name, body }) => {
    it(`[${id}] answers 400 for a login body with ${name}`, () => {
      api.login(body).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body.error).to.equal('Username and password are required');
      });
    });
  });

  it('[TC-208] answers 401 on protected routes without a token or with an unknown one', () => {
    api.listTasks().its('status').should('equal', 401);
    api.me('00000000-0000-4000-8000-000000000000').its('status').should('equal', 401);
  });

  it('[TC-209] returns the logged-in user from /api/me', () => {
    cy.apiToken('bob').then((token) => {
      api.me(token).then((response) => {
        expect(response.status).to.equal(200);
        expectSchema(UserSchema, response.body);
        expect(response.body.username).to.equal('bob');
      });
    });
  });

  it('[TC-210] makes the token unusable after logout', () => {
    // Arrange: a token of its own, so the cached one of other tests stays valid
    api.login({ username: 'carol', password }).then(({ body: { token } }) => {
      // Act
      api.logout(token).its('status').should('equal', 204);
      // Assert
      api.me(token).its('status').should('equal', 401);
    });
  });
});
