// Date helpers. "Today" is read from the browser clock, so tests can freeze it with cy.clock().

/** Today's local calendar date as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** An open task is overdue when its due date is before today. */
export function isOverdue(dueDate: string | null, done: boolean, now: Date = new Date()): boolean {
  return !done && dueDate !== null && dueDate < todayIso(now);
}

/** 2026-10-16 → "16 Oct 2026" (fixed format, independent of the browser language). */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${names[month - 1]} ${year}`;
}
