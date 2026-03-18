import { useRef, useEffect, useCallback } from 'react';
import { SEVERITY_LEVELS } from '../constants/hazards';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const TILE_URL    = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function loadLeaflet(onReady) {
  if (window.L) { onReady(); return; }

  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = Object.assign(document.createElement('link'), {
      rel: 'stylesheet', href: LEAFLET_CSS,
    });
    document.head.appendChild(link);
  }

  const script = Object.assign(document.createElement('script'), {
    src: LEAFLET_JS, onload: onReady,
  });
  document.head.appendChild(script);
}

/**
 * Initialises a Leaflet map on the provided ref, syncs markers to
 * filteredWarnings, and flies to selectedWarning when it changes.
 *
 * @param {Array}    filteredWarnings
 * @param {Object}   selectedWarning
 * @param {Function} onCircleClick     – called with a warning object
 */
export function useLeafletMap(filteredWarnings, selectedWarning, onCircleClick) {
  const mapRef     = useRef(null);   // DOM ref – returned and attached in MapView
  const mapInstance = useRef(null);  // Leaflet map instance
  const markers     = useRef([]);    // Current circle layers

  // ── Initialise map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    loadLeaflet(() => {
      if (mapInstance.current) return;

      const map = window.L.map(mapRef.current, {
        zoomControl:        false,
        attributionControl: false,
      }).setView([50, 15], 4);

      window.L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);
      window.L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstance.current = map;
    });
  }, []);

  // ── Sync markers when filteredWarnings changes ───────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;

    markers.current.forEach(layer => mapInstance.current.removeLayer(layer));
    markers.current = [];

    filteredWarnings.forEach(w => {
      const { color } = SEVERITY_LEVELS[w.severity];
      const circle = window.L.circle([w.lat, w.lng], {
        color,
        fillColor:   color,
        fillOpacity: 0.25,
        radius:      w.radius * 50_000,
        weight:      2,
      }).addTo(mapInstance.current);

      circle.on('click', () => onCircleClick(w));
      markers.current.push(circle);
    });
  }, [filteredWarnings, onCircleClick]);

  // ── Fly to selected warning ──────────────────────────────────────────────────
  useEffect(() => {
    if (selectedWarning && mapInstance.current) {
      mapInstance.current.flyTo(
        [selectedWarning.lat, selectedWarning.lng],
        7,
        { duration: 1.5 },
      );
    }
  }, [selectedWarning]);

  const resetView = useCallback(() => {
    mapInstance.current?.flyTo([50, 15], 4, { duration: 1.2 });
  }, []);

  return { mapRef, resetView };
}
