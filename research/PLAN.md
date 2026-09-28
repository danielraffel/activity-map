# Activity Map project plan

## Product goal

Activity Map is an activity route authoring tool with a strong bike profile: open a map, draw or import a route, edit it with high-quality cycling-aware routing, inspect distance/elevation/surface, export a portable route, and send it to an OpenTrailPaper head unit with as little ceremony as possible.

The first release is a personal route editor. It does not need accounts, a social feed, route discovery, or a database. A route should remain usable as a normal GPX file even if Activity Map disappears.

## Findings that shape the plan

- A strong bike route editor should provide bike mode, surface and elevation preferences, manual editing, GPX import/export, undo/redo, distance markers, elevation profile, and route statistics.
- The map stack should combine an open basemap, bicycle-specific road attributes, and documented elevation data behind replaceable provider adapters.
- `/Users/danielraffel/Code/cyclemap` is currently empty, so the initial work can establish the architecture cleanly.
- OpenTrailPaper already accepts a GPX route over BLE. Its route characteristic uses start/data/end framing, accepts files up to 256 KB, parses GPX in firmware, stores routes under `/routes`, and accepts maneuver records alongside the track.
- The OpenTrailPaper companion apps already author/send routes and expose the necessary BLE workflow. The iOS app currently uses MapKit cycling directions and exports GPX; Android supports GPX file import.

## Proposed v1 experience

1. Open Activity Map at a location, with the last route and map view kept locally in the browser.
2. Click to set a start, add destinations or intermediate points, and choose `Bike`, `Gravel`, or `Manual` mode.
3. Let the router snap each leg to bicycle-suitable roads. Drag a segment to force a road choice; switch to manual mode for trails or private corrections.
4. Import `.gpx` by file picker or drag-and-drop. Display the imported track immediately and allow it to be edited, rerouted, reversed, split, or merged.
5. Show distance, ascent/descent, estimated time, surface mix, route points, and an elevation profile. Warn when a route has gaps, implausible jumps, or unsupported geometry.
6. Export GPX 1.1 with track points, route name, timestamps/elevation when present, waypoints, and generated turn cues where available.
7. Offer `Download GPX` first. Add `Open in OpenTrailPaper` through the platform share/file handoff. Add direct Chrome Web Bluetooth only after the file path is reliable.
8. Persist drafts in IndexedDB/local storage. A share link can encode a compressed route later; no account is required for v1.

## Technical direction

### Client

- TypeScript + Vite, deployable as a static site on GitHub Pages.
- React or Svelte only if the chosen mapping/editing libraries benefit from it; keep the first app mostly framework-light.
- MapLibre GL JS for GPU-accelerated vector maps and style control. Keep the map provider behind a small adapter so tiles can be changed without rewriting route editing.
- Use a map editing layer such as Terra Draw or Mapbox GL Draw's MapLibre-compatible fork. The editor must support vertex dragging, segment insertion, deletion, continuation, reverse, split, and undo/redo.
- Use `@tmcw/togeojson` (or equivalent) for GPX/KML/KMZ conversion. Treat GPX 1.1 as the canonical export format; treat TCX/FIT as import/conversion formats rather than the internal model.
- Use a canonical route model based on GeoJSON LineString plus typed metadata: coordinates, elevation, surface, road class, source, waypoints, turn cues, and route provenance.

### Routing and data

- Start with an adapter interface, not a hard-coded provider: `route(request)`, `snap(track)`, `elevation(points)`, and `tiles(style)`.
- Evaluate Valhalla, GraphHopper, BRouter, and OSRM in a small proof-of-concept using the same Bay Area routes. Valhalla is a strong default for multimodal/cycling costing; BRouter is attractive for detailed bicycle profiles and elevation-aware customization; GraphHopper is a practical hosted/self-hosted option; OSRM is useful as a speed baseline but has less bike-specific customization.
- Do not depend on an anonymous public demo endpoint for production. Begin with a configurable development endpoint, then add a very small proxy/cache (Cloud Run, Cloudflare Worker, or GCP function) only when rate limits, CORS, or API keys require it.
- Use OpenStreetMap-derived road and surface attributes. Add elevation from a documented DEM source such as EarthEnv/DEM90 or a routing provider's elevation service. Cache only what licensing permits.
- A future discovery layer can ingest user-provided files, OSM bicycle relations, and openly licensed route datasets with attribution and provenance.

### Device delivery

Implement delivery in this order:

1. **Reliable baseline:** export a GPX file that OpenTrailPaper's existing companion apps can import/send.
2. **One-tap handoff:** add a custom `opentrailpaper://` route deep link or platform share target so the companion app receives a GPX and immediately offers BLE upload. This requires a small, explicit companion-app change and no cloud service.
3. **Direct browser BLE (optional):** on Chrome/Edge desktop, connect to the existing OpenTrailPaper GATT service and send the same framed GPX/maneuver payload. Keep this behind capability detection; Safari/iOS cannot be the primary path because Web Bluetooth support is not dependable there.
4. **Cloud relay only if needed:** if the user needs to create on one device and retrieve on another, add an expiring, encrypted route handoff. Store no route history by default and avoid putting route contents or tokens in URLs/logs.

## Phases and exit criteria

### Phase 0 — product and technical spike

- Write a short feature inventory for the planned bike editing workflow.
- Build a map/routing spike with MapLibre and one routing adapter.
- Compare Valhalla, GraphHopper, BRouter, and OSRM on representative cycling routes.
- Confirm GPX round-trip compatibility with OpenTrailPaper's parser and the 256 KB limit.
- Decide the initial tile, routing, elevation, and attribution providers.

Exit: a written decision record, a rendered map, one routed sample, and a GPX that OpenTrailPaper accepts.

### Phase 1 — static route editor MVP

- Establish the Vite TypeScript app and GitHub Pages deployment.
- Implement map pan/zoom, location search, route creation, manual mode, route import, route editing, undo/redo, clear/reverse, and local draft persistence.
- Add route statistics and an elevation profile.
- Add GPX export and a small fixture corpus covering GPX tracks, routes, waypoints, elevation, and malformed files.

Exit: a user can import a common GPX, make a meaningful edit, export it, reload it, and obtain equivalent geometry without a server account.

### Phase 2 — cycling quality

- Add bike-specific routing preferences: safest/most popular, paved/unpaved, climbing tolerance, road class, avoidances, and gravel/trail mode.
- Add surface and road-class overlays, route warnings, snap-to-road, and explicit manual detours.
- Add elevation-aware route comparison and cue generation.
- Add KML/KMZ and TCX import; add FIT-to-GPX conversion only where a dependable parser is available.

Exit: three real local routes can be recreated or imported and edited with predictable results, with no silent loss of elevation or waypoints.

### Phase 3 — OpenTrailPaper handoff

- Add the GPX file/share handoff to the iOS and Android companion apps.
- In the companion app, show route name, size, distance, and a clear BLE send/received status.
- Preserve the existing OpenTrailPaper framing, parser, maneuver format, and `/routes` storage.
- Add end-to-end tests using a known GPX fixture and a BLE/device mock where hardware is unavailable.

Exit: `Share → OpenTrailPaper → Send` transfers a route and the device lists and navigates it.

### Phase 4 — direct and cross-device delivery

- Prototype Chrome Web Bluetooth against the existing GATT service.
- Add capability detection, reconnect/retry, progress, and a fallback to companion-app handoff.
- If cross-device retrieval is genuinely needed, add an expiring encrypted handoff service with no permanent route database.

Exit: direct BLE is a convenience, never the only supported delivery path, and the fallback remains one or two taps.

### Phase 5 — optional route discovery

- Add opt-in libraries for user-imported routes, OSM bicycle relations, and openly licensed route collections.
- Preserve source, license, date, and transformation metadata for every imported route.
- Add private/local collections before any public social features.

Exit: discovery is additive and does not make the editor, hosting, or privacy model depend on a social backend.

## Validation strategy

- Unit-test format conversion, geometry editing, distance/elevation calculations, route simplification, cue placement, and malformed-file handling.
- Browser-test the core workflow in Chrome: create, import, edit, undo/redo, export, reload, and share.
- Keep a fixture matrix for GPX 1.0/1.1, KML/KMZ, TCX, elevation/no elevation, tracks/routes, waypoints, and files near the OpenTrailPaper size limit.
- Validate exported GPX with OpenTrailPaper's real parser and, when hardware is available, verify BLE receipt, `/routes` persistence, route listing, and navigation.
- Record map/routing/elevation provider licenses and attribution in the app and repository before publishing.

## Open decisions to resolve in Phase 0

- Which tile source gives acceptable bicycle detail, terms, and cost for a GitHub Pages app?
- Which routing backend gives the best safety/surface behavior for the user's local rides without requiring a permanently operated server?
- Should the first routing request go to a hosted provider, a small proxy, or a user-configured endpoint?
- Should the companion deep link carry a compressed route, refer to a short-lived download, or receive a shared file through the OS?
- Does the user need route transfer from a desktop directly to the head unit, or is the phone companion app an acceptable first hop?
- What is the minimum OpenTrailPaper firmware/companion version that should be declared compatible?

## First implementation slice

Create the Phase 0 spike as a reviewable vertical slice:

- Vite + TypeScript shell with MapLibre map.
- One sample route rendered and editable.
- GPX import/export round-trip.
- A routing adapter with one provider selected behind an interface.
- A `Download GPX` action and a compatibility note linking the existing OpenTrailPaper companion workflow.
- A short decision record based on real routes and provider terms.

This slice should be useful on its own and should not introduce accounts, a database, a social feed, or a cloud relay.

## Demonstration milestone

The first public GitHub Pages demonstration is intentionally small and account-free. It is complete when a visitor can:

1. Open a responsive map, pan/zoom, change the visible area, and search or choose a starting location.
2. Create and edit a bike route by adding points, dragging/inserting/removing points, undoing changes, and clearing or reversing the route.
3. Request cycling-aware routing for the route and see the resulting line plus distance/elevation summary.
4. Export the current route as a standards-compliant GPX file that can be imported into OpenTrailPaper or another cycling application.

The demonstration does not require accounts, saved routes, social features, direct Bluetooth, push notifications, a relay service, or a permanent server. Those remain follow-on work after the core editor is visibly useful.

## Activity profiles and map capabilities

The product model is broader than one bicycle setting, while the first release stays focused on cycling. The initial profile set is Road bike, Everyday/Hybrid bike, Gravel/Cross bike, Mountain bike, and E-bike. Each profile should be represented as routing preferences rather than a separate editor: surface tolerance, cycleway preference, road-class tolerance, hill tolerance, and speed assumptions.

Later activity profiles can include walking, running, hiking, wheelchair travel, and other route types when the routing provider and map data can represent them honestly. The UI should only expose a capability when the selected provider has data to support it.

OpenStreetMap can provide cycleways, bicycle access, surface, smoothness, road class, grade proxies, and many access restrictions. A routing engine can use those tags for route choice. A DEM can provide elevation and climb estimates. Live traffic, reliable safety ratings, and complete lane-level detail are provider-dependent and must be labeled as such instead of inferred from a generic map line.

See [ACTIVITY_PROFILES.md](ACTIVITY_PROFILES.md) for the activity model. Cycling remains the first shipping profile; the editor is designed so running, hiking, walking, mountain biking, and e-bike profiles can be added without forking route editing. Swimming and indoor activities require different data and are intentionally separate follow-on work.
