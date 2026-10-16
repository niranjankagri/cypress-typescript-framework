// The board: header, new-task form, filters and the task list, with loading, error and empty states.
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, TOKEN_KEY } from '../api.ts';
import { FilterBar } from '../components/FilterBar.tsx';
import { TaskForm } from '../components/TaskForm.tsx';
import { TaskItem } from '../components/TaskItem.tsx';
import { Toast } from '../components/Toast.tsx';
import type { NewTask, StatusFilter, Task, User } from '../types.ts';

/** Search waits until the user stops typing for this long, so not every key press calls the API. */
export const SEARCH_DEBOUNCE_MS = 300;

export function BoardPage({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // An expired or unknown token: forget it and go back to the login screen.
  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        onLoggedOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Something went wrong');
    },
    [onLoggedOut],
  );

  useEffect(() => {
    api.me().then(setUser, handleError);
  }, [handleError]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // A newer request (other filter, retry) cancels the older one, so an old answer never wins.
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .listTasks(status, query, controller.signal)
      .then(setTasks)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) handleError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [status, query, reloadKey, handleError]);

  const reload = () => setReloadKey((key) => key + 1);
  // Stable function: a new one on every render would restart the toast's timer.
  const hideToast = useCallback(() => setToast(''), []);

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      setToast(message);
      reload();
    } catch (err) {
      handleError(err);
    }
  }

  async function logout() {
    await api.logout().catch(() => undefined);
    onLoggedOut();
  }

  return (
    <div className="board">
      <header>
        <h1>TaskBoard</h1>
        <span data-cy="user-name">{user?.name}</span>
        <button type="button" data-cy="logout" onClick={() => void logout()}>
          Log out
        </button>
      </header>

      <main>
        <TaskForm
          onCreate={async (task: NewTask) => {
            await api.createTask(task);
            setToast('Task added');
            reload();
          }}
        />

        <FilterBar status={status} search={search} onStatusChange={setStatus} onSearchChange={setSearch} />

        {error && (
          <div className="banner" role="alert" data-cy="error-banner">
            <span>{error}</span>
            <button type="button" data-cy="retry" onClick={reload}>
              Retry
            </button>
          </div>
        )}

        {loading && (
          <p className="muted" data-cy="loading">
            Loading tasks…
          </p>
        )}

        {!loading && !error && tasks.length === 0 && (
          <p className="muted" data-cy="empty-state">
            {query || status !== 'all'
              ? 'No tasks match this filter.'
              : 'No tasks yet. Add your first one above.'}
          </p>
        )}

        {!loading && tasks.length > 0 && (
          <>
            <p className="muted" data-cy="task-count">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
            <ul className="tasks" data-cy="task-list">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={(done) =>
                    run(() => api.updateTask(task.id, { done }), done ? 'Task done' : 'Task reopened')
                  }
                  onRename={(title) => run(() => api.updateTask(task.id, { title }), 'Task updated')}
                  onDelete={() => run(() => api.deleteTask(task.id), 'Task deleted')}
                />
              ))}
            </ul>
          </>
        )}
      </main>

      <Toast message={toast} onDone={hideToast} />
    </div>
  );
}
