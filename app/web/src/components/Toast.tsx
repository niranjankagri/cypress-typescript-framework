// Short confirmation message ("Task added") that hides itself after a few seconds.
import { useEffect } from 'react';

export const TOAST_MS = 3000;

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, TOAST_MS);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="toast" role="status" data-cy="toast">
      {message}
    </div>
  );
}
