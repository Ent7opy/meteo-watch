import { X, Clock, Info, TriangleAlert } from 'lucide-react';
import { SEVERITY_LEVELS, HAZARD_TYPES } from '../../constants/hazards';
import { formatDateTime, formatEndLabel } from '../../utils/formatters';

/**
 * Floating detail card shown over the map when a warning is selected.
 */
export function WarningDetail({ warning, onClose }) {
  if (!warning) return null;

  const sev      = SEVERITY_LEVELS[warning.severity];
  const HazardIcon = HAZARD_TYPES.find(h => h.id === warning.type)?.icon ?? TriangleAlert;

  return (
    <div
      className="
        absolute bottom-6 right-6 left-6
        md:left-auto md:w-[400px]
        z-20
        animate-in slide-in-from-bottom-4 fade-in duration-300
      "
    >
      <div className="bg-surface-overlay/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Severity bar */}
        <div className="h-[3px] w-full" style={{ backgroundColor: sev.color }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${sev.bg} ring-1 ${sev.ring}`}>
                <HazardIcon className="w-5 h-5" style={{ color: sev.color }} />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-white leading-tight">
                  {warning.region}
                </h2>
                <p className="text-[10px] font-mono text-slate-500 tracking-wider mt-0.5">
                  {warning.country} · {warning.provider}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <TimeBlock label="Effective From" value={formatDateTime(warning.start)} />
            <TimeBlock label="Expected End"   value={formatDateTime(warning.end)}   />
          </div>

          {/* Duration pill */}
          <div className="flex justify-center mb-5">
            <span
              className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border"
              style={{ color: sev.color, borderColor: sev.color + '44', backgroundColor: sev.color + '11' }}
            >
              {formatEndLabel(warning.end)}
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Info className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                Localized Instructions
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed bg-surface/60 p-4 rounded-xl border border-white/5 italic">
              "{warning.description}"
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="
              flex-1 py-2.5 bg-white/5 hover:bg-white/[0.08] rounded-xl
              text-[10px] font-mono font-bold uppercase tracking-widest
              border border-white/10 transition-all
            ">
              Metadata
            </button>
            <button
              onClick={() => warning.sourceUrl && window.open(warning.sourceUrl, '_blank', 'noopener,noreferrer')}
              style={{ backgroundColor: sev.color }}
              className="
                flex-1 py-2.5 rounded-xl text-black
                text-[10px] font-mono font-bold uppercase tracking-widest
                hover:brightness-110 transition-all
                shadow-lg
              "
            >
              Source Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ label, value }) {
  return (
    <div className="bg-white/[0.04] rounded-xl p-3 border border-white/5">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        <Clock className="w-3 h-3" />
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xs font-medium text-slate-200 leading-snug">{value}</p>
    </div>
  );
}
