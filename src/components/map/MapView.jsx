import { HazardTypeFilter } from './HazardTypeFilter';
import { MapLegend } from './MapLegend';
import { WarningDetail } from '../warnings/WarningDetail';

/**
 * Full-height map section with filter overlay, legend, and detail card.
 *
 * @param {React.Ref}  mapRef
 * @param {string}     filterType
 * @param {Function}   onFilterTypeChange
 * @param {Object}     selectedWarning
 * @param {Function}   onCloseDetail
 */
export function MapView({ mapRef, filterType, onFilterTypeChange, selectedWarning, onCloseDetail }) {
  return (
    <section className="flex-1 relative bg-[#12141a] overflow-hidden">
      {/* Leaflet mount point */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Hazard type filter — top-left */}
      <div className="absolute top-5 left-5 z-10">
        <HazardTypeFilter value={filterType} onChange={onFilterTypeChange} />
      </div>

      {/* Legend — bottom-left (desktop only) */}
      <div className="absolute bottom-6 left-6 z-10 hidden lg:block">
        <MapLegend />
      </div>

      {/* Warning detail card — bottom-right */}
      {selectedWarning && (
        <WarningDetail warning={selectedWarning} onClose={onCloseDetail} />
      )}
    </section>
  );
}
