# Initial technical decisions

## Static deployment

The first demonstration is a static site in `docs/`, deployed by GitHub Pages. There is no account system, database, server, or secret in the browser bundle.

## Map and routing

The prototype uses Leaflet with OpenStreetMap tiles and the public `valhalla1.openstreetmap.de` endpoint using `costing: bicycle`. The routing call is isolated in `docs/app.js` so it can later move behind an adapter or proxy if a public endpoint becomes unsuitable.

## Route editing model

The prototype keeps user-selected stops separately from the routed shape. Stop markers are draggable; a drag or new point requests a fresh bicycle route. GPX export writes the routed shape as a GPX 1.1 track. This is deliberately small and gives us a clean seam for richer editing operations later.

## Known prototype limits

- The public tile and routing services are suitable for a demonstration, not a service-level production dependency.
- The current GPX export preserves route geometry but does not yet include elevation or turn cues.
- The current fallback draws a direct line when routing is unavailable and clearly reports that state.
- Provider terms, attribution, rate limits, and a production routing strategy must be reviewed before broad public use.
