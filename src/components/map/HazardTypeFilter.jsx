import { HAZARD_TYPES } from '../../constants/hazards';

/**
 * Compact icon-bar for filtering by hazard type, shown over the map.
 */
export function HazardTypeFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 p-1.5 bg-surface-raised/90 backdrop-blur border border-white/10 rounded-xl shadow-2xl">
      {HAZARD_TYPES.map(type => {
        const active = value === type.id;
        return (
          <button
            key={type.id}
            onClick={() => onChange(active ? 'all' : type.id)}
            title={type.label}
            className={`
              p-2 rounded-lg transition-all flex items-center gap-1.5
              ${active
                ? 'bg-white/10 text-white ring-1 ring-white/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }
            `}
          >
            <type.icon className="w-4 h-4" />
            {active && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-tight pr-0.5">
                {type.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
