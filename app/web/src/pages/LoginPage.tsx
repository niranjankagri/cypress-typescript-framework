// Login screen: username + password; shows the server's message when the login is refused.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api.ts';

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.login(username, password);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <h1>TaskBoard</h1>
      <form onSubmit={(event) => void submit(event)} data-cy="login-form">
        <label>
          Username
          <input
            data-cy="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            data-cy="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="error" role="alert" data-cy="login-error">
            {error}
          </p>
        )}
        <button type="submit" data-cy="login-submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="hint">Demo users: alice, bob, carol · password Password1!</p>
    </main>
  );
}
