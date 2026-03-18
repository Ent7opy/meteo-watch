/**
 * Live system status indicator shown in the header.
 * @param {'connected'|'syncing'} status
 */
export function StatusBadge({ status }) {
  const isLive = status === 'connected';

  return (
    <div className="flex items-center gap-2 bg-surface-overlay px-3 py-1.5 rounded-full border border-white/5">
      <span
        className={`w-2 h-2 rounded-full ${
          isLive ? 'bg-emerald-500 animate-pulse-dot' : 'bg-amber-400'
        }`}
      />
      <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
        {isLive ? 'LIVE · MQTT CONNECTED' : 'SYNCING DATA…'}
      </span>
    </div>
  );
}
