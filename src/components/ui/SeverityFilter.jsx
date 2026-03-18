import { SEVERITY_LEVELS } from '../../constants/hazards';

/**
 * Horizontal pill-button row for filtering by severity level.
 */
export function SeverityFilter({ value, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      <Pill
        active={value === 'all'}
        onClick={() => onChange('all')}
        label="All"
      />
      {Object.entries(SEVERITY_LEVELS).map(([key, sev]) => (
        <Pill
          key={key}
          active={value === key}
          onClick={() => onChange(key)}
          label={sev.label}
          color={sev.color}
        />
      ))}
    </div>
  );
}

function Pill({ active, onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      style={active && color ? { color, borderColor: color + '55' } : {}}
      className={`
        px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider
        border transition-all whitespace-nowrap
        ${active
          ? 'bg-white/5 border-white/20 text-white'
          : 'bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
        }
      `}
    >
      {label}
    </button>
  );
}
