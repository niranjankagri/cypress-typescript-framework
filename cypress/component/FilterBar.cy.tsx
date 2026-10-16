// Component tests for the filter bar: it only reports changes; the parent owns the state.
import { useState } from 'react';
import { FilterBar } from '../../app/web/src/components/FilterBar.tsx';
import type { StatusFilter } from '../../app/web/src/types.ts';

/** A small parent that holds the state, like the board does. */
function Harness({
  onStatus,
  onSearch,
}: {
  onStatus: (s: StatusFilter) => void;
  onSearch: (s: string) => void;
}) {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  return (
    <FilterBar
      status={status}
      search={search}
      onStatusChange={(value) => {
        setStatus(value);
        onStatus(value);
      }}
      onSearchChange={(value) => {
        setSearch(value);
        onSearch(value);
      }}
    />
  );
}

describe('<FilterBar />', () => {
  it('marks the current filter with aria-pressed', () => {
    cy.mount(<FilterBar status="done" search="" onStatusChange={cy.stub()} onSearchChange={cy.stub()} />);
    cy.getBySel('filter-done').should('have.attr', 'aria-pressed', 'true');
    cy.getBySel('filter-all').should('have.attr', 'aria-pressed', 'false');
    cy.getBySel('filter-active').should('have.attr', 'aria-pressed', 'false');
  });

  it('reports the chosen status', () => {
    cy.mount(<Harness onStatus={cy.stub().as('status')} onSearch={cy.stub()} />);
    cy.getBySel('filter-active').click();
    cy.get('@status').should('have.been.calledOnceWith', 'active');
    cy.getBySel('filter-active').should('have.attr', 'aria-pressed', 'true');
  });

  it('reports every change of the search text (the board debounces it)', () => {
    cy.mount(<Harness onStatus={cy.stub()} onSearch={cy.stub().as('search')} />);
    cy.getBySel('search').type('abc');
    cy.get('@search').should('have.callCount', 3).and('have.been.calledWith', 'abc');
  });
});
