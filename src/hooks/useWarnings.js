import { useState, useEffect } from 'react';
import { MOCK_WARNINGS } from '../constants/mockData';

/**
 * Manages the live warning feed and simulated MQTT update cycle.
 */
export function useWarnings() {
  const [warnings, setWarnings]           = useState(MOCK_WARNINGS);
  const [systemStatus, setSystemStatus]   = useState('connected');

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus('syncing');

      setTimeout(() => setSystemStatus('connected'), 800);

      // Randomly inject a duplicate alert simulating a live feed push
      if (Math.random() > 0.85) {
        const base = MOCK_WARNINGS[Math.floor(Math.random() * MOCK_WARNINGS.length)];
        const incomingAlert = {
          ...base,
          id:    `w-live-${Date.now()}`,
          start: new Date().toISOString(),
        };
        setWarnings(prev => [incomingAlert, ...prev.slice(0, 15)]);
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, []);

  return { warnings, systemStatus };
}
