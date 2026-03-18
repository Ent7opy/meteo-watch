import { Activity, Menu, X } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

/**
 * Top application bar.
 *
 * @param {'connected'|'syncing'} systemStatus
 * @param {boolean}               sidebarOpen
 * @param {Function}              onToggleSidebar
 */
export function Header({ systemStatus, sidebarOpen, onToggleSidebar }) {
  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface-raised z-30 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-600 rounded-lg shadow-inner shadow-orange-900/50">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-[17px] font-display font-bold tracking-tight text-white leading-none">
            MeteoWatch EU
          </h1>
          <p className="text-[9px] font-mono text-slate-600 tracking-[0.2em] mt-0.5 uppercase">
            Unified Hazard Aggregator
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Status badge — hidden on small screens */}
        <div className="hidden md:block">
          <StatusBadge status={systemStatus} />
        </div>

        {/* Region/Status meta */}
        <div className="hidden md:flex items-center gap-5 border-l border-white/10 pl-5">
          <MetaBlock label="Region"  value="PAN-EUROPEAN" />
          <MetaBlock label="Status"  value="NOMINAL"      valueClass="text-emerald-400" />
        </div>

        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}

function MetaBlock({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="text-right">
      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">
        {label}
      </div>
      <div className={`text-xs font-display font-semibold tracking-wide ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}
