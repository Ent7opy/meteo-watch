import { useState, useEffect } from 'react';

const POLL_INTERVAL_MS = 90_000;

/**
 * Fetches active weather warnings from /api/warnings (Meteoalarm CAP feeds)
 * and polls every 90 seconds to pick up new and expired warnings.
 */
export function useWarnings() {
  const [warnings, setWarnings]         = useState([]);
  const [systemStatus, setSystemStatus] = useState('syncing');

  useEffect(() => {
    async function fetchWarnings() {
      setSystemStatus('syncing');
      try {
        const res      = await fetch('/api/warnings');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json     = await res.json();
        const incoming = json.data ?? [];

        setWarnings(prev => {
          const incomingById = new Map(incoming.map(w => [w.id, w]));
          const prevIds      = new Set(prev.map(w => w.id));

          const newOnes = incoming.filter(w => !prevIds.has(w.id));
          const updated = prev
            .filter(w => incomingById.has(w.id))
            .map(w => incomingById.get(w.id));

          // No-op guard: skip re-render if nothing changed
          if (newOnes.length === 0 && updated.length === prev.length) return prev;

          return [...newOnes, ...updated];
        });

        setSystemStatus('connected');
      } catch {
        setSystemStatus('error');
      }
    }

    fetchWarnings();
    const interval = setInterval(fetchWarnings, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return { warnings, systemStatus };
}
