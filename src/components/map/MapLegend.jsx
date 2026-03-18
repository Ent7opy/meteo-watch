import { SEVERITY_LEVELS } from '../../constants/hazards';

const LEGEND_ORDER = [
  { key: 'RED',    label: 'LEVEL 3 · VERY DANGEROUS'       },
  { key: 'ORANGE', label: 'LEVEL 2 · DANGEROUS'             },
  { key: 'YELLOW', label: 'LEVEL 1 · POTENTIALLY DANGEROUS' },
];

/**
 * Static severity colour legend shown in the bottom-left of the map.
 */
export function MapLegend() {
  return (
    <div className="bg-surface-raised/80 backdrop-blur-sm border border-white/10 p-3 rounded-xl space-y-2">
      {LEGEND_ORDER.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: SEVERITY_LEVELS[key].color }}
          />
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
