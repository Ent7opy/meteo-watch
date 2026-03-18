import { ChevronRight, TriangleAlert } from 'lucide-react';
import { SEVERITY_LEVELS, HAZARD_TYPES } from '../../constants/hazards';
import { formatTime } from '../../utils/formatters';

/**
 * Single warning row in the sidebar feed.
 */
export function WarningCard({ warning, isSelected, onClick }) {
  const sev      = SEVERITY_LEVELS[warning.severity];
  const HazardIcon = HAZARD_TYPES.find(h => h.id === warning.type)?.icon ?? TriangleAlert;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border transition-all group
        animate-card-enter
        ${isSelected
          ? 'bg-white/5 border-white/15 shadow-lg'
          : 'bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/10'
        }
      `}
    >
      {/* Severity accent bar */}
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-70"
        style={{ backgroundColor: sev.color }}
      />

      <div className="flex items-start gap-3 relative">
        {/* Icon */}
        <div
          className={`
            flex-shrink-0 p-2.5 rounded-lg transition-transform duration-200
            group-hover:scale-105
            ${sev.bg}
          `}
        >
          <HazardIcon className="w-4 h-4" style={{ color: sev.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              {warning.country} · {warning.provider}
            </span>
            <span className="text-[9px] font-mono text-slate-600 flex-shrink-0 ml-2">
              {formatTime(warning.start)}
            </span>
          </div>

          <h3 className="text-sm font-display font-semibold text-white truncate leading-snug">
            {warning.region}
          </h3>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sev.color }} />
            <span className="text-[10px] font-medium" style={{ color: sev.color }}>
              {sev.description}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight
          className={`
            w-4 h-4 text-slate-600 self-center flex-shrink-0 transition-transform duration-200
            ${isSelected ? 'text-white rotate-90' : 'group-hover:translate-x-0.5'}
          `}
        />
      </div>
    </button>
  );
}
