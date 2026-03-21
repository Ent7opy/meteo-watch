# MeteoWatch EU

MeteoWatch EU is a React + Vite weather warning dashboard that aggregates active Meteoalarm alerts into a single map-and-list interface.

The app combines:

- A Vite frontend built with React and Tailwind CSS
- A Vercel-style serverless API at `/api/warnings`
- A local Node development shim that runs the API and Vite together
- A Leaflet-powered map loaded from CDN at runtime

It is designed to surface active pan-European weather hazards quickly: warnings are fetched from Meteoalarm feeds, normalized into a single JSON shape, filtered in the UI, and rendered as interactive map circles plus a searchable sidebar feed.

## What the project does

The application:

- Fetches active warnings from Meteoalarm legacy Atom feeds
- Aggregates warnings from the providers currently listed in the codebase
- Normalizes provider-specific feed entries into a consistent warning object
- Polls the backend every 90 seconds for fresh data
- Displays warnings on a dark Leaflet map
- Lets users filter by hazard type, severity, and region/country search
- Shows a detail card for the selected warning, including timing and source feed link

## Current coverage

The API currently pulls feeds for these country slugs:

`austria`, `belgium`, `bulgaria`, `croatia`, `czechia`, `denmark`, `finland`, `france`, `germany`, `greece`, `hungary`, `ireland`, `italy`, `netherlands`, `norway`, `poland`, `portugal`, `romania`, `serbia`, `slovakia`, `slovenia`, `spain`, `sweden`, `switzerland`, `united-kingdom`

That is 25 configured feeds in the current implementation.

## Key implementation details

### Data source

The backend fetches Meteoalarm legacy Atom feeds from:

`https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-<country-slug>`

Each country feed is parsed with `fast-xml-parser`, then converted into a frontend-friendly warning object.

### Warning normalization

Each warning is mapped to this general shape:

```json
{
  "id": "unique-entry-id",
  "type": "wind | flood | heat | fire | storm",
  "severity": "YELLOW | ORANGE | RED",
  "region": "Area name",
  "country": "ISO country code",
  "provider": "National provider name",
  "start": "ISO timestamp",
  "end": "ISO timestamp",
  "description": "Feed title or event summary",
  "lat": 45.68,
  "lng": 16.34,
  "radius": 0.8,
  "sourceUrl": "https://feeds.meteoalarm.org/..."
}
```

Severity mapping in the API:

- `Minor` and `Moderate` become `YELLOW`
- `Severe` becomes `ORANGE`
- `Extreme` becomes `RED`

Hazard mapping is keyword-based and groups Meteoalarm events into:

- `wind`
- `flood`
- `heat`
- `fire`
- `storm`

### Geospatial behavior

The current feed parsing does not use real polygons. Instead, the API derives approximate coordinates by:

- Taking a fixed centroid for each country
- Hashing the warning's NUTS3 code or area descriptor
- Offsetting the centroid deterministically so warnings from the same country do not stack on one point

This means the map is a visual locator, not a precise geographic boundary renderer.

### Caching and refresh

Server behavior:

- Fetch timeout: `8000ms`
- In-memory cache TTL: `60s`
- Response cache header: `public, max-age=60, s-maxage=60`

Client behavior:

- Poll interval: `90s`
- Header status states: `syncing`, `connected`, `error`

## Tech stack

- React 18
- Vite 5
- Tailwind CSS 3
- `lucide-react` for icons
- `fast-xml-parser` for feed parsing
- Leaflet loaded dynamically from unpkg CDN
- Carto dark basemap tiles
- Vercel-compatible serverless API structure

## Local development

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run the app

Recommended local workflow:

```bash
npm run dev
```

This starts:

- A local API server on `http://localhost:3001/api/warnings`
- The Vite frontend on `http://localhost:5174`

Alternative scripts:

```bash
npm run dev:vite
npm run dev:vercel
```

What they do:

- `npm run dev:vite`: starts only Vite. The Vite dev server proxies `/api` to `http://localhost:3001`, so you still need the API running separately.
- `npm run dev:vercel`: runs the project through `vercel dev`, useful if you want to emulate Vercel routing locally.

### Production build

```bash
npm run build
npm run preview
```

The project currently builds successfully with Vite.

## API

### Endpoint

`GET /api/warnings`

### Methods

- `GET`
- `OPTIONS`

Any other method returns `405`.

### Response shape

```json
{
  "data": [
    {
      "id": "https://feeds.meteoalarm.org/api/v1/warnings/...",
      "type": "wind",
      "severity": "YELLOW",
      "region": "Velebit channel region",
      "country": "HR",
      "provider": "DHMZ",
      "start": "2026-03-21T23:01:01+00:00",
      "end": "2026-03-22T22:59:59+00:00",
      "description": "Yellow Wind Warning issued for Croatia - Velebit channel region",
      "lat": 45.68,
      "lng": 16.34,
      "radius": 0.8,
      "sourceUrl": "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-croatia"
    }
  ],
  "meta": {
    "total": 426,
    "active_at": "2026-03-21T12:59:18.127Z",
    "source": "meteoalarm"
  }
}
```

Notes:

- `meta.total` changes with live feed data
- Expired warnings are filtered out in the API
- `Test` and `Exercise` warnings are excluded
- CORS is open with `Access-Control-Allow-Origin: *`

## Frontend behavior

### Layout

- Header with system status and app branding
- Left sidebar with search, severity filter, and warning list
- Main map area with hazard type filter and legend
- Floating warning detail card for the active selection

### Filtering

The UI supports:

- Hazard type filter from the map overlay
- Severity filter from the sidebar
- Search by region or country code

### Selection behavior

- Clicking a warning card selects or toggles it
- Clicking a map circle selects the warning
- Selected warnings are highlighted on the map and in the list
- When a warning is selected, the map flies to it
- When nothing is selected, the map fits to the visible warnings

## Project structure

```text
api/
  warnings.js           Vercel-style API handler that fetches and normalizes feeds
scripts/
  dev-api.mjs           Local API server + Vite launcher
src/
  App.jsx               Top-level composition
  main.jsx              React entry point
  constants/
    hazards.js          Severity and hazard metadata
  hooks/
    useWarnings.js      Polling and system status
    useFilters.js       Derived filter state
    useLeafletMap.js    Dynamic Leaflet loading and map synchronization
  components/
    layout/             Header and sidebar
    map/                Map overlays and legend
    ui/                 Reusable inputs and badges
    warnings/           Warning list cards and detail panel
  styles/
    index.css           Tailwind layers and Leaflet overrides
```

## External runtime dependencies

The application depends on several external services at runtime:

- Meteoalarm feed endpoints
- Leaflet CSS and JS from unpkg
- Carto basemap tiles
- Google Fonts

If any of those are unavailable, parts of the app may degrade or fail to load.

## Deployment

The repository is already structured for Vercel-style deployment:

- Frontend: Vite static bundle
- Backend: `api/warnings.js` serverless endpoint

Typical deployment options:

- Vercel
- Any platform that can serve the Vite build plus a compatible Node serverless/function layer

## Known limitations

- Warning positions are approximate; no polygons are rendered
- Hazard classification is based on simple event keyword matching
- The UI uses live polling rather than push or streaming updates
- Search matches region text and ISO country code, not provider name or full country name
- The `Metadata` button in the detail card is currently non-functional
- No automated test suite is present in the repository today

## Available scripts

```bash
npm run dev
npm run dev:vercel
npm run dev:vite
npm run build
npm run preview
```

## Verification

The repository was inspected and the current documentation was written against the implementation in this codebase. A production build was also run successfully via:

```bash
npm run build
```
