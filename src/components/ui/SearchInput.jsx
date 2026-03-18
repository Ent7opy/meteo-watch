import { Search, X } from 'lucide-react';

/**
 * Controlled search input with clear button.
 */
export function SearchInput({ value, onChange }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      <input
        type="text"
        placeholder="Search region or country…"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="
          w-full bg-surface-overlay border border-white/10 rounded-lg
          py-2 pl-10 pr-9 text-sm font-sans
          placeholder:text-slate-600
          focus:outline-none focus:ring-1 focus:ring-orange-500/60
          transition-all
        "
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
