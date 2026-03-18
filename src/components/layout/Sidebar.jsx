import { SearchInput } from '../ui/SearchInput';
import { SeverityFilter } from '../ui/SeverityFilter';
import { WarningList } from '../warnings/WarningList';

/**
 * Left sidebar — search, severity filter, and the scrollable warning feed.
 */
export function Sidebar({
  isOpen,
  searchQuery,
  onSearchChange,
  filterSeverity,
  onSeverityChange,
  warnings,
  selectedId,
  onSelect,
}) {
  return (
    <aside
      className={`
        ${isOpen ? 'w-full md:w-80 lg:w-96' : 'w-0 overflow-hidden'}
        transition-all duration-300 ease-in-out
        border-r border-white/10 bg-surface-raised
        flex flex-col z-20
        absolute lg:relative h-full
      `}
    >
      {/* Filters */}
      <div className="p-4 border-b border-white/5 space-y-3 flex-shrink-0">
        <SearchInput value={searchQuery} onChange={onSearchChange} />
        <SeverityFilter value={filterSeverity} onChange={onSeverityChange} />
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <WarningList
          warnings={warnings}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-surface-muted flex justify-between items-center flex-shrink-0">
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
          Aggregated · 32 NMHS
        </span>
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
          v1.2.4-stable
        </span>
      </div>
    </aside>
  );
}
