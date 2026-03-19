import { XMLParser } from 'fast-xml-parser';

const BASE_FEED_URL    = 'https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-';
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS     = 60_000;

// Country slug → ISO code + provider name
const PROVIDERS = {
  'austria':         { code: 'AT', name: 'ZAMG' },
  'belgium':         { code: 'BE', name: 'RMI-IRM' },
  'bulgaria':        { code: 'BG', name: 'NIMH' },
  'croatia':         { code: 'HR', name: 'DHMZ' },
  'czechia':         { code: 'CZ', name: 'ČHMÚ' },
  'denmark':         { code: 'DK', name: 'DMI' },
  'finland':         { code: 'FI', name: 'FMI' },
  'france':          { code: 'FR', name: 'Météo-France' },
  'germany':         { code: 'DE', name: 'DWD' },
  'greece':          { code: 'GR', name: 'HNMS' },
  'hungary':         { code: 'HU', name: 'OMSZ' },
  'ireland':         { code: 'IE', name: 'Met Éireann' },
  'italy':           { code: 'IT', name: 'MeteoAM' },
  'netherlands':     { code: 'NL', name: 'KNMI' },
  'norway':          { code: 'NO', name: 'MET Norway' },
  'poland':          { code: 'PL', name: 'IMGW-PIB' },
  'portugal':        { code: 'PT', name: 'IPMA' },
  'romania':         { code: 'RO', name: 'NMA' },
  'serbia':          { code: 'RS', name: 'RHMSS' },
  'slovakia':        { code: 'SK', name: 'SHMÚ' },
  'slovenia':        { code: 'SI', name: 'ARSO' },
  'spain':           { code: 'ES', name: 'AEMET' },
  'sweden':          { code: 'SE', name: 'SMHI' },
  'switzerland':     { code: 'CH', name: 'MeteoSwiss' },
  'united-kingdom':  { code: 'GB', name: 'Met Office' },
};

// CAP severity string → UI severity level
const SEVERITY_MAP = {
  Minor:    'YELLOW',
  Moderate: 'YELLOW',
  Severe:   'ORANGE',
  Extreme:  'RED',
};

// Map Meteoalarm event string to UI hazard type
function eventToType(event = '') {
  const e = event.toLowerCase();
  if (e.includes('wind') || e.includes('gale') || e.includes('blizzard'))              return 'wind';
  if (e.includes('flood') || e.includes('rain') || e.includes('avalanche') ||
      e.includes('snow') || e.includes('ice') || e.includes('coastal'))                return 'flood';
  if (e.includes('heat') || e.includes('high temp') || e.includes('drought'))          return 'heat';
  if (e.includes('fire') || e.includes('forest'))                                       return 'fire';
  return 'storm'; // thunderstorm, fog, or unknown
}

// Country centroid coordinates (fallback when no polygon in feed)
const COUNTRY_CENTERS = {
  AT: { lat: 47.5,  lng: 14.5  },
  BE: { lat: 50.5,  lng: 4.5   },
  BG: { lat: 42.7,  lng: 25.5  },
  HR: { lat: 45.1,  lng: 16.4  },
  CZ: { lat: 49.8,  lng: 15.5  },
  DK: { lat: 56.3,  lng: 9.5   },
  FI: { lat: 64.0,  lng: 26.0  },
  FR: { lat: 46.2,  lng: 2.2   },
  DE: { lat: 51.2,  lng: 10.5  },
  GR: { lat: 39.1,  lng: 21.8  },
  HU: { lat: 47.2,  lng: 19.5  },
  IE: { lat: 53.4,  lng: -8.2  },
  IT: { lat: 42.8,  lng: 12.8  },
  NL: { lat: 52.3,  lng: 5.3   },
  NO: { lat: 65.0,  lng: 13.0  },
  PL: { lat: 52.1,  lng: 19.4  },
  PT: { lat: 39.6,  lng: -8.0  },
  RO: { lat: 45.9,  lng: 24.9  },
  RS: { lat: 44.0,  lng: 21.0  },
  SK: { lat: 48.7,  lng: 19.7  },
  SI: { lat: 46.1,  lng: 14.9  },
  ES: { lat: 40.4,  lng: -3.7  },
  SE: { lat: 62.0,  lng: 15.0  },
  CH: { lat: 46.8,  lng: 8.2   },
  GB: { lat: 54.4,  lng: -2.0  },
};

// Deterministic hash of a string (used to spread circles within a country)
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

// Approximate lat/lng from country code + NUTS3 code
// Offsets the country centroid by a deterministic amount so multiple warnings
// from the same country don't all stack on the same point.
function approxGeo(countryCode, nutsCode) {
  const center = COUNTRY_CENTERS[countryCode] ?? { lat: 50.0, lng: 10.0 };
  const h      = hash(nutsCode || countryCode);
  // ±2° latitude, ±3° longitude — keeps points within the country
  const latOff = ((Math.abs(h)       % 200) / 100 - 1) * 2;
  const lngOff = ((Math.abs(h >> 8)  % 200) / 100 - 1) * 3;
  return { lat: center.lat + latOff, lng: center.lng + lngOff };
}

// Parse fast-xml-parser output for one country feed into warning objects.
//
// Actual Meteoalarm legacy Atom feed structure (confirmed from live feed):
//   <feed xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">
//     <entry>
//       <cap:areaDesc>Isère</cap:areaDesc>
//       <cap:event>Moderate avalanches warning</cap:event>
//       <cap:severity>Moderate</cap:severity>
//       <cap:onset>...</cap:onset>
//       <cap:expires>...</cap:expires>
//       <cap:identifier>...</cap:identifier>
//       <cap:geocode><valueName>NUTS3</valueName><value>FR714</value></cap:geocode>
//       <title>Yellow Avalanches Warning issued for France - Isère</title>
//       ...
//     </entry>
//   </feed>
//
// CAP fields are FLAT on <entry> (no <cap:alert> or <cap:info> wrapper).
// Geo is NUTS3 geocode only — no polygon or circle in the feed.
function parseFeed(parsed, countrySlug) {
  const provider = PROVIDERS[countrySlug];
  const feedUrl  = `${BASE_FEED_URL}${countrySlug}`;
  const now      = new Date();

  const rawEntries = parsed?.feed?.entry ?? [];
  const entries    = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  const warnings = [];

  for (const entry of entries) {
    const get = (key) => {
      const v = entry[`cap:${key}`] ?? entry[key];
      return v != null ? String(v) : '';
    };

    const severity   = get('severity');
    const onset      = get('onset');
    const expires    = get('expires');
    const areaDesc   = get('areaDesc');
    const event      = get('event');

    // Skip warnings that have already expired
    if (expires && new Date(expires) < now) continue;
    // Skip non-Actual status (e.g. Test, Exercise)
    const status = get('status') || get('message_type') || 'Actual';
    if (status === 'Test' || status === 'Exercise') continue;

    // NUTS3 code for deterministic geo placement.
    // Also used to make IDs unique — Meteoalarm reuses cap:identifier across
    // multiple entries when one alert covers several areas.
    const geocode  = entry['cap:geocode'];
    const nutsCode = String(geocode?.value ?? areaDesc);
    // Use the Atom entry id (URL with index_area/index_polygon params) as the unique key.
    // cap:identifier is shared across entries for the same alert; entry.id is always unique.
    const id = String(entry.id ?? `${get('identifier') || countrySlug}-${nutsCode}`);

    const geo = approxGeo(provider.code, String(nutsCode));

    // Use the entry title as the description (feed doesn't include full description text)
    const description = String(entry.title ?? event ?? '');

    warnings.push({
      id,
      type:        eventToType(event),
      severity:    SEVERITY_MAP[severity] ?? 'YELLOW',
      region:      areaDesc,
      country:     provider.code,
      provider:    provider.name,
      start:       onset   || now.toISOString(),
      end:         expires || new Date(now.getTime() + 86_400_000).toISOString(),
      description,
      lat:         geo.lat,
      lng:         geo.lng,
      radius:      0.8,
      sourceUrl:   feedUrl,
    });
  }

  return warnings;
}

// Fetch and parse one country feed. Returns [] on any failure (logged to stderr).
async function fetchCountry(countrySlug) {
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_FEED_URL}${countrySlug}`, {
      signal:  controller.signal,
      headers: { Accept: 'application/xml, text/xml, */*' },
    });
    if (!res.ok) {
      console.error(`[api/warnings] ${countrySlug}: HTTP ${res.status}`);
      return [];
    }
    const xml    = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    return parseFeed(parser.parse(xml), countrySlug);
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(`[api/warnings] ${countrySlug}:`, err.message);
    }
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// Module-level cache — persists across warm function invocations
let cachedResponse = null;
let cachedAt       = 0;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')     return res.status(405).end();

  if (cachedResponse && Date.now() - cachedAt < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.status(200).json(cachedResponse);
  }

  try {
    const results  = await Promise.allSettled(Object.keys(PROVIDERS).map(fetchCountry));
    const warnings = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

    const body = {
      data: warnings,
      meta: {
        total:     warnings.length,
        active_at: new Date().toISOString(),
        source:    'meteoalarm',
      },
    };

    if (warnings.length > 0) {
      cachedResponse = body;
      cachedAt       = Date.now();
    }

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.status(200).json(body);
  } catch (err) {
    console.error('[api/warnings]', err);
    return res.status(500).json({ error: 'Failed to fetch warnings from Meteoalarm' });
  }
}
