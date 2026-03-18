import { ShieldAlert } from 'lucide-react';
import { WarningCard } from './WarningCard';

/**
 * Scrollable list of warning cards, or an empty-state message.
 */
export function WarningList({ warnings, selectedId, onSelect }) {
  if (warnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-40">
        <ShieldAlert className="w-10 h-10 text-slate-600" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
          No matching alerts
        </p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5">
      {warnings.map(w => (
        <div key={w.id} className="relative">
          <WarningCard
            warning={w}
            isSelected={selectedId === w.id}
            onClick={() => onSelect(w)}
          />
        </div>
      ))}
    </div>
  );
}
