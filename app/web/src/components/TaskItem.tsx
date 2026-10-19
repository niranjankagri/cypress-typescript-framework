// One task row: done checkbox, title (editable in place), priority, due date with an "Overdue" badge,
// and a delete button that asks for confirmation first.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatDate, isOverdue } from '../dates.ts';
import type { Task } from '../types.ts';

interface Props {
  task: Task;
  onToggle: (done: boolean) => void | Promise<void>;
  onRename: (title: string) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}

/** One task row; Overdue is only shown for an open task whose due date has passed. */
export function TaskItem({ task, onToggle, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const overdue = isOverdue(task.dueDate, task.done);

  /** Leaves edit mode and renames only when the trimmed title is not empty and really changed. */
  function save(event: FormEvent) {
    event.preventDefault();
    setEditing(false);
    if (draft.trim() && draft.trim() !== task.title) void onRename(draft.trim());
  }

  return (
    <li className={`task${task.done ? ' done' : ''}`} data-cy="task" data-task-id={task.id}>
      <input
        type="checkbox"
        data-cy="task-done"
        aria-label={`Mark "${task.title}" as done`}
        checked={task.done}
        onChange={(e) => void onToggle(e.target.checked)}
      />

      {editing ? (
        <form className="edit" onSubmit={save}>
          <input
            data-cy="edit-title"
            aria-label="New title"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDraft(task.title);
                setEditing(false);
              }
            }}
          />
          <button type="submit" data-cy="save-title">
            Save
          </button>
        </form>
      ) : (
        <span className="title" data-cy="task-title" onDoubleClick={() => setEditing(true)}>
          {task.title}
        </span>
      )}

      <span className={`badge ${task.priority}`} data-cy="task-priority">
        {task.priority}
      </span>
      {task.dueDate && (
        <span className="due" data-cy="task-due">
          {formatDate(task.dueDate)}
        </span>
      )}
      {overdue && (
        <span className="badge overdue" data-cy="task-overdue">
          Overdue
        </span>
      )}

      {!editing && (
        <button
          type="button"
          className="link"
          data-cy="edit-task"
          onClick={() => {
            setDraft(task.title);
            setEditing(true);
          }}
        >
          Edit
        </button>
      )}
      <button
        type="button"
        className="link danger"
        data-cy="delete-task"
        onClick={() => {
          if (window.confirm(`Delete "${task.title}"?`)) void onDelete();
        }}
      >
        Delete
      </button>
    </li>
  );
}
