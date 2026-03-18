import { useState } from 'react';
import { useWarnings }    from './hooks/useWarnings';
import { useFilters }     from './hooks/useFilters';
import { useLeafletMap }  from './hooks/useLeafletMap';
import { Header }         from './components/layout/Header';
import { Sidebar }        from './components/layout/Sidebar';
import { MapView }        from './components/map/MapView';

export default function App() {
  const [selectedWarning, setSelectedWarning] = useState(null);
  const [sidebarOpen, setSidebarOpen]         = useState(true);

  // ── Data & live updates ──────────────────────────────────────────────────────
  const { warnings, systemStatus } = useWarnings();

  // ── Filters ──────────────────────────────────────────────────────────────────
  const {
    filterType,     setFilterType,
    filterSeverity, setFilterSeverity,
    searchQuery,    setSearchQuery,
    filteredWarnings,
  } = useFilters(warnings);

  // ── Map ───────────────────────────────────────────────────────────────────────
  const { mapRef } = useLeafletMap(filteredWarnings, selectedWarning, setSelectedWarning);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSelectWarning = (warning) => {
    setSelectedWarning(prev => prev?.id === warning.id ? null : warning);
  };

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      <Header
        systemStatus={systemStatus}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
      />

      <main className="flex flex-1 overflow-hidden relative">
        <Sidebar
          isOpen={sidebarOpen}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterSeverity={filterSeverity}
          onSeverityChange={setFilterSeverity}
          warnings={filteredWarnings}
          selectedId={selectedWarning?.id}
          onSelect={handleSelectWarning}
        />

        <MapView
          mapRef={mapRef}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          selectedWarning={selectedWarning}
          onCloseDetail={() => setSelectedWarning(null)}
        />
      </main>
    </div>
  );
}
