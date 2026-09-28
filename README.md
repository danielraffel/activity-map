# Activity Map

An activity route planning and editing web app with a strong bike profile designed to run as a static site on GitHub Pages.

## Current demo

The deployable site lives in [`docs/`](docs/). It currently supports:

- OpenStreetMap map interaction
- Place search through Nominatim
- Click-to-add and drag-to-edit route stops
- Cycling-aware route generation through Valhalla
- Undo, clear, and route statistics
- GPX 1.1 export for OpenTrailPaper or another bike computer

Open `docs/index.html` locally, or publish the `docs/` directory with the included GitHub Pages workflow.

## Repository layout

- `app/` — prototype source
- `docs/` — deployable GitHub Pages site
- `public/` — future static assets and metadata
- `research/` — product research, technical decisions, provider notes, and plans

See [research/PLAN.md](research/PLAN.md) for the phased implementation plan and [research/DEVICE_DELIVERY.md](research/DEVICE_DELIVERY.md) for OpenTrailPaper delivery research.
