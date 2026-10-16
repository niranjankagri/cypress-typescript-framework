// Status filter (All / Active / Done) and the search box. Holds no state: the board owns it.
import type { StatusFilter } from '../types.ts';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
];

interface Props {
  status: StatusFilter;
  search: string;
  onStatusChange: (status: StatusFilter) => void;
  onSearchChange: (search: string) => void;
}

export function FilterBar({ status, search, onStatusChange, onSearchChange }: Props) {
  return (
    <div className="filters" data-cy="filter-bar">
      <div role="group" aria-label="Show">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            data-cy={`filter-${filter.value}`}
            aria-pressed={status === filter.value}
            onClick={() => onStatusChange(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <input
        type="search"
        data-cy="search"
        aria-label="Search tasks"
        placeholder="Search…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
