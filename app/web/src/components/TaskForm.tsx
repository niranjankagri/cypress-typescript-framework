// New-task form: title, priority and an optional due date.
// Checks the title length before calling the API and shows the server's message if the API refuses.
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewTask, Priority } from '../types.ts';

export const TITLE_MIN = 3;
export const TITLE_MAX = 80;

/** The new-task form; onCreate saves the task and throws when the API refuses it. */
export function TaskForm({ onCreate }: { onCreate: (task: NewTask) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /**
   * Checks the title length first (no API call for an obvious mistake), then saves; the button is disabled
   * while saving.
   */
  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < TITLE_MIN || trimmed.length > TITLE_MAX) {
      setError(`Title must be ${TITLE_MIN}-${TITLE_MAX} characters`);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onCreate({ title: trimmed, priority, dueDate: dueDate || null });
      // Only a saved task clears the form; after an error the user can fix and resend.
      setTitle('');
      setPriority('medium');
      setDueDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the task');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="task-form" onSubmit={(event) => void submit(event)} data-cy="task-form" noValidate>
      <input
        data-cy="new-task-title"
        aria-label="Task title"
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select
        data-cy="new-task-priority"
        aria-label="Priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input
        data-cy="new-task-due"
        aria-label="Due date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <button type="submit" data-cy="add-task" disabled={busy}>
        {busy ? 'Adding…' : 'Add task'}
      </button>
      {error && (
        <p className="error" role="alert" data-cy="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
