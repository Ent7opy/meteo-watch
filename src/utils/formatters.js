/**
 * Format an ISO date string as "18 Mar, 14:00"
 */
export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format an ISO date string as "14:00"
 */
export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns a human-readable relative duration label, e.g. "until 19 Mar 02:00"
 */
export function formatEndLabel(isoString) {
  const end = new Date(isoString);
  const now = new Date();
  const diffH = Math.round((end - now) / 3_600_000);
  if (diffH <= 0) return 'Expired';
  if (diffH < 24) return `${diffH}h remaining`;
  return `${Math.round(diffH / 24)}d remaining`;
}
