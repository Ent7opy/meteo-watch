import { useRef, useEffect, useCallback, useState } from 'react';
import { SEVERITY_LEVELS } from '../constants/hazards';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const TILE_URL    = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

/**
 * Loads Leaflet once, calling onReady when window.L is available.
 * Guards against duplicate script tags from React StrictMode double-invocation.
 */
function loadLeaflet(onReady) {
  if (window.L) { onReady(); return; }

  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = Object.assign(document.createElement('link'), {
      rel: 'stylesheet', href: LEAFLET_CSS,
    });
    document.head.appendChild(link);
  }

  // If a script tag already exists (StrictMode second run), poll instead of
  // adding a duplicate — duplicate tags cause the onload to fire on old refs.
  if (document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
    const poll = setInterval(() => {
      if (window.L) { clearInterval(poll); onReady(); }
    }, 30);
    return;
  }

  const script = Object.assign(document.createElement('script'), {
    src: LEAFLET_JS, onload: onReady,
  });
  document.head.appendChild(script);
}

/**
 * Initialises a Leaflet map, syncs hazard circles to filteredWarnings,
 * highlights the selected warning with stronger styling, and flies to it.
 */
export function useLeafletMap(filteredWarnings, selectedWarning, onCircleClick) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markersRef  = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  // ── Initialise / tear down map ────────────────────────────────────────────
  // The cleanup function handles React StrictMode's mount→unmount→remount cycle,
  // ensuring the map is rebuilt on the correct DOM element each time.
  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    loadLeaflet(() => {
      if (cancelled || mapInstance.current || !mapRef.current) return;

      const map = window.L.map(mapRef.current, {
        zoomControl:        false,
        attributionControl: false,
      }).setView([50, 15], 4);

      window.L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);
      window.L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstance.current = map;

      // Signal ready only after the SVG renderer has computed its bounds —
      // adding circles before this fires causes the _updateCircle crash.
      map.whenReady(() => {
        if (!cancelled) setMapReady(true);
      });
    });

    return () => {
      cancelled = true;
      markersRef.current = [];
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      setMapReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draw / redraw circles on filter or selection change ──────────────────
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L) return;

    // Clear old circles
    markersRef.current.forEach(layer => {
      try { mapInstance.current.removeLayer(layer); } catch (_) {}
    });
    markersRef.current = [];

    if (filteredWarnings.length === 0) return;

    const latLngs = [];

    filteredWarnings.forEach(w => {
      const isSelected = selectedWarning?.id === w.id;
      const { color }  = SEVERITY_LEVELS[w.severity];

      const circle = window.L.circle([w.lat, w.lng], {
        color,
        fillColor:   color,
        fillOpacity: isSelected ? 0.5  : 0.2,
        radius:      w.radius * 50_000 * (isSelected ? 1.15 : 1),
        weight:      isSelected ? 3    : 1.5,
      }).addTo(mapInstance.current);

      circle.on('click', () => onCircleClick(w));

      if (isSelected) {
        circle.bringToFront();
        circle.bindTooltip(w.region, {
          permanent:  true,
          direction:  'center',
          className:  'mw-tooltip',
          opacity:    1,
        }).openTooltip();
      }

      markersRef.current.push(circle);
      latLngs.push([w.lat, w.lng]);
    });

    // Fit map to all visible warnings when no specific one is selected
    if (!selectedWarning && latLngs.length > 0) {
      try {
        mapInstance.current.fitBounds(latLngs, { padding: [70, 70], maxZoom: 7 });
      } catch (_) {}
    }
  }, [mapReady, filteredWarnings, selectedWarning, onCircleClick]);

  // ── Fly to selected warning ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !selectedWarning || !mapInstance.current) return;
    mapInstance.current.flyTo(
      [selectedWarning.lat, selectedWarning.lng],
      7,
      { duration: 1.2 },
    );
  }, [mapReady, selectedWarning]);

  const resetView = useCallback(() => {
    mapInstance.current?.flyTo([50, 15], 4, { duration: 1.2 });
  }, []);

  return { mapRef, resetView };
}
