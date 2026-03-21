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

// Country centroid coordinates (fallback when NUTS3 code is not in lookup table)
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

// NUTS3 region centroids — accurate coordinates for known regions.
// Prevents hash-based offsets from placing markers in wrong countries.
const NUTS3_COORDS = {
  // Romania
  RO111: { lat: 47.05, lng: 22.25 }, // Bihor
  RO112: { lat: 47.15, lng: 24.50 }, // Bistrița-Năsăud
  RO113: { lat: 46.77, lng: 23.60 }, // Cluj
  RO114: { lat: 47.67, lng: 24.10 }, // Maramureș
  RO115: { lat: 47.80, lng: 22.88 }, // Satu Mare
  RO116: { lat: 47.20, lng: 23.05 }, // Sălaj
  RO121: { lat: 46.07, lng: 23.57 }, // Alba
  RO122: { lat: 45.65, lng: 25.60 }, // Brașov
  RO123: { lat: 45.85, lng: 26.18 }, // Covasna
  RO124: { lat: 46.50, lng: 25.60 }, // Harghita
  RO125: { lat: 46.55, lng: 24.57 }, // Mureș
  RO126: { lat: 45.80, lng: 24.15 }, // Sibiu
  RO211: { lat: 46.57, lng: 26.90 }, // Bacău
  RO212: { lat: 47.75, lng: 26.67 }, // Botoșani
  RO213: { lat: 47.15, lng: 27.60 }, // Iași
  RO214: { lat: 46.98, lng: 26.38 }, // Neamț
  RO215: { lat: 47.65, lng: 25.60 }, // Suceava
  RO216: { lat: 46.63, lng: 27.73 }, // Vaslui
  RO221: { lat: 45.27, lng: 27.97 }, // Brăila
  RO222: { lat: 45.15, lng: 26.82 }, // Buzău
  RO223: { lat: 44.18, lng: 28.65 }, // Constanța
  RO224: { lat: 45.45, lng: 28.05 }, // Galați
  RO225: { lat: 45.18, lng: 29.05 }, // Tulcea
  RO226: { lat: 45.70, lng: 27.05 }, // Vrancea
  RO311: { lat: 44.85, lng: 24.87 }, // Argeș
  RO312: { lat: 44.20, lng: 27.33 }, // Călărași
  RO313: { lat: 44.93, lng: 25.45 }, // Dâmbovița
  RO314: { lat: 43.90, lng: 25.97 }, // Giurgiu
  RO315: { lat: 44.57, lng: 27.37 }, // Ialomița
  RO316: { lat: 45.07, lng: 25.93 }, // Prahova
  RO317: { lat: 43.98, lng: 25.00 }, // Teleorman
  RO321: { lat: 44.43, lng: 26.10 }, // București (municipality)
  RO322: { lat: 44.53, lng: 26.00 }, // Ilfov
  RO411: { lat: 44.32, lng: 23.80 }, // Dolj
  RO412: { lat: 44.93, lng: 23.27 }, // Gorj
  RO413: { lat: 44.50, lng: 22.90 }, // Mehedinți
  RO414: { lat: 44.43, lng: 24.37 }, // Olt
  RO415: { lat: 45.10, lng: 24.37 }, // Vâlcea
  RO421: { lat: 46.17, lng: 21.32 }, // Arad
  RO422: { lat: 45.30, lng: 22.00 }, // Caraș-Severin
  RO423: { lat: 45.70, lng: 23.00 }, // Hunedoara
  RO424: { lat: 45.75, lng: 21.22 }, // Timiș
  // Austria
  AT111: { lat: 46.62, lng: 14.30 }, // Klagenfurt-Villach
  AT112: { lat: 46.82, lng: 13.47 }, // Oberkärnten
  AT113: { lat: 46.68, lng: 14.83 }, // Unterkärnten
  AT121: { lat: 47.80, lng: 13.03 }, // Mostviertel-Eisenwurzen
  AT122: { lat: 48.23, lng: 14.17 }, // Sankt Pölten
  AT123: { lat: 48.35, lng: 15.60 }, // Waldviertel
  AT124: { lat: 48.55, lng: 16.42 }, // Weinviertel
  AT125: { lat: 48.15, lng: 16.52 }, // Wiener Umland Nordteil
  AT126: { lat: 47.95, lng: 16.30 }, // Wiener Umland Südteil
  AT127: { lat: 48.20, lng: 16.37 }, // Wien
  AT131: { lat: 47.82, lng: 16.53 }, // Mittelburgenland
  AT132: { lat: 47.15, lng: 16.47 }, // Südburgenland
  AT133: { lat: 47.70, lng: 16.82 }, // Nordburgenland
  AT211: { lat: 47.07, lng: 15.43 }, // Graz
  AT212: { lat: 47.40, lng: 15.38 }, // Liezen
  AT213: { lat: 46.78, lng: 15.55 }, // Östliche Obersteiermark
  AT221: { lat: 46.92, lng: 13.55 }, // Lungau
  AT222: { lat: 47.47, lng: 13.05 }, // Pinzgau-Pongau
  AT223: { lat: 47.80, lng: 13.05 }, // Salzburg und Umgebung
  AT311: { lat: 48.30, lng: 14.28 }, // Linz-Wels
  AT312: { lat: 47.95, lng: 13.75 }, // Salzkammergut
  AT313: { lat: 48.27, lng: 13.97 }, // Steyr-Kirchdorf
  AT314: { lat: 48.55, lng: 13.47 }, // Traunviertel
  AT321: { lat: 47.38, lng: 10.93 }, // Außerfern
  AT322: { lat: 47.27, lng: 11.40 }, // Innsbruck
  AT323: { lat: 47.13, lng: 10.72 }, // Osttirol
  AT331: { lat: 47.50, lng: 9.75  }, // Bludenz-Bregenzer Wald
  AT332: { lat: 47.52, lng: 9.73  }, // Rheintal-Bodenseegebiet
  // Switzerland
  CH011: { lat: 47.38, lng: 8.08  }, // Aargau
  CH012: { lat: 47.55, lng: 7.58  }, // Basel-Landschaft / Basel-Stadt
  CH013: { lat: 47.13, lng: 7.25  }, // Bern
  CH021: { lat: 46.93, lng: 7.43  }, // Fribourg
  CH022: { lat: 46.22, lng: 7.36  }, // Valais / Wallis
  CH023: { lat: 46.52, lng: 6.63  }, // Vaud
  CH024: { lat: 46.20, lng: 6.15  }, // Genève
  CH025: { lat: 46.99, lng: 6.93  }, // Neuchâtel
  CH026: { lat: 47.22, lng: 6.96  }, // Jura
  CH031: { lat: 47.32, lng: 8.55  }, // Zürich
  CH032: { lat: 47.50, lng: 8.73  }, // Schaffhausen
  CH033: { lat: 47.42, lng: 8.97  }, // Thurgau
  CH040: { lat: 46.82, lng: 9.53  }, // Graubünden
  CH051: { lat: 47.03, lng: 8.30  }, // Luzern
  CH052: { lat: 46.90, lng: 8.65  }, // Uri / Schwyz / Obwalden / Nidwalden / Glarus
  CH053: { lat: 47.17, lng: 8.52  }, // Zug
  CH054: { lat: 47.35, lng: 8.73  }, // St. Gallen
  CH055: { lat: 47.38, lng: 9.28  }, // Appenzell
  CH056: { lat: 47.08, lng: 9.07  }, // Glarus
  CH057: { lat: 46.50, lng: 8.28  }, // Obwalden / Nidwalden
  CH061: { lat: 46.52, lng: 8.85  }, // Ticino
  CH070: { lat: 46.52, lng: 8.85  }, // Ticino
  // Germany (selected major regions)
  DE111: { lat: 48.78, lng: 9.18  }, // Stuttgart
  DE212: { lat: 48.14, lng: 11.58 }, // München
  DE300: { lat: 52.52, lng: 13.40 }, // Berlin
  DE600: { lat: 53.55, lng: 10.00 }, // Hamburg
  DEA11: { lat: 51.45, lng: 7.02  }, // Düsseldorf
  DEB11: { lat: 50.35, lng: 7.60  }, // Koblenz
  DE501: { lat: 53.08, lng: 8.80  }, // Bremen
  // France (selected)
  FR101: { lat: 48.85, lng: 2.35  }, // Paris
  FR102: { lat: 48.85, lng: 2.35  }, // Île-de-France
  FRL04: { lat: 43.30, lng: 5.38  }, // Marseille
  FRL01: { lat: 43.60, lng: 1.44  }, // Toulouse
  // Italy (selected)
  ITC11: { lat: 45.47, lng: 9.18  }, // Milano
  ITI43: { lat: 41.90, lng: 12.50 }, // Roma
  ITF33: { lat: 40.85, lng: 14.27 }, // Napoli
  // Spain (selected)
  ES300: { lat: 40.42, lng: -3.70 }, // Madrid
  ES511: { lat: 41.38, lng: 2.17  }, // Barcelona
  // Poland (selected)
  PL911: { lat: 52.23, lng: 21.00 }, // Warszawa
  PL213: { lat: 50.06, lng: 19.94 }, // Kraków
  // Serbia
  RS110: { lat: 44.80, lng: 20.47 }, // Beograd
  RS121: { lat: 45.25, lng: 19.83 }, // Južna Bačka
  RS122: { lat: 45.83, lng: 20.42 }, // Severna Banat
  // Norway (selected)
  NO011: { lat: 59.91, lng: 10.75 }, // Oslo
  NO021: { lat: 59.73, lng: 10.23 }, // Akershus
  // Sweden (selected)
  SE110: { lat: 59.33, lng: 18.07 }, // Stockholm
  SE211: { lat: 55.60, lng: 13.00 }, // Malmö
  SE231: { lat: 57.71, lng: 11.97 }, // Göteborg
  // Greece (selected)
  EL301: { lat: 37.97, lng: 23.73 }, // Attica / Athens
  EL411: { lat: 40.64, lng: 22.94 }, // Thessaloniki
  // Hungary (selected)
  HU110: { lat: 47.50, lng: 19.05 }, // Budapest
  // Czech Republic (selected)
  CZ010: { lat: 50.08, lng: 14.44 }, // Praha
  // Bulgaria (selected)
  BG411: { lat: 42.70, lng: 23.32 }, // Sofia
  BG421: { lat: 42.15, lng: 24.75 }, // Plovdiv
  // Slovakia (selected)
  SK010: { lat: 48.15, lng: 17.12 }, // Bratislava
  // Croatia (selected)
  HR050: { lat: 45.80, lng: 16.00 }, // Zagreb
  // Slovenia (selected)
  SI038: { lat: 46.05, lng: 14.51 }, // Ljubljana
  // Portugal (selected)
  PT170: { lat: 38.72, lng: -9.14 }, // Lisboa
  PT118: { lat: 41.15, lng: -8.62 }, // Porto
  // UK (selected)
  UKI31: { lat: 51.50, lng: -0.13 }, // London
  UKJ11: { lat: 51.45, lng: -2.60 }, // Bristol
  UKE41: { lat: 53.80, lng: -1.55 }, // Leeds
  UKG31: { lat: 52.48, lng: -1.90 }, // Birmingham
  UKC22: { lat: 54.98, lng: -1.62 }, // Tyne and Wear (Newcastle)
  UKM50: { lat: 55.86, lng: -4.25 }, // Glasgow
  UKM73: { lat: 55.95, lng: -3.19 }, // Edinburgh
  // Netherlands (selected)
  NL329: { lat: 52.37, lng: 4.90  }, // Amsterdam
  NL333: { lat: 51.92, lng: 4.48  }, // Rotterdam
  // Belgium (selected)
  BE100: { lat: 50.85, lng: 4.35  }, // Brussels
  BE211: { lat: 51.22, lng: 4.40  }, // Antwerp
  // Denmark (selected)
  DK011: { lat: 55.68, lng: 12.57 }, // Copenhagen
  // Ireland (selected)
  IE061: { lat: 53.33, lng: -6.25 }, // Dublin
  // Finland (selected)
  FI1C1: { lat: 60.17, lng: 24.94 }, // Helsinki
};

// Deterministic hash of a string (used to spread circles for unknown NUTS3 codes)
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

// Resolve lat/lng for a warning: prefer exact NUTS3 lookup, fall back to
// country centroid with a small deterministic offset (±0.4° lat / ±0.6° lng)
// so markers from the same country don't all stack on the same pixel.
function approxGeo(countryCode, nutsCode) {
  if (nutsCode && NUTS3_COORDS[nutsCode]) {
    return NUTS3_COORDS[nutsCode];
  }
  const center = COUNTRY_CENTERS[countryCode] ?? { lat: 50.0, lng: 10.0 };
  const h      = hash(nutsCode || countryCode);
  // Small offset — keeps unknown regions visually near their country center
  const latOff = ((Math.abs(h)       % 200) / 100 - 1) * 0.4;
  const lngOff = ((Math.abs(h >> 8)  % 200) / 100 - 1) * 0.6;
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
