const STATUS_CONFIG = {
  connected: { dot: 'bg-emerald-500 animate-pulse-dot', label: 'LIVE · METEOALARM' },
  syncing:   { dot: 'bg-amber-400 animate-pulse-dot',   label: 'SYNCING DATA…'     },
  error:     { dot: 'bg-red-500',                        label: 'FEED UNAVAILABLE'  },
};

/**
 * Live system status indicator shown in the header.
 * @param {'connected'|'syncing'|'error'} status
 */
export function StatusBadge({ status }) {
  const { dot, label } = STATUS_CONFIG[status] ?? STATUS_CONFIG.connected;

  return (
    <div className="flex items-center gap-2 bg-surface-overlay px-3 py-1.5 rounded-full border border-white/5">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
        {label}
      </span>
    </div>
  );
}
