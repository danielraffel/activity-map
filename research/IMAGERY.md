# Street-level imagery

Activity Map can open a selected route point in Google Maps Street View with a deep link. This requires no API key, but Google decides whether a panorama exists and may show the nearest available imagery or an unavailable state.

Coverage detection is provider-specific:

- Google Street View metadata can report `OK`, `ZERO_RESULTS`, or an error, but the metadata endpoint requires a Google API key and billing setup.
- Mapillary has broad coverage and useful sequence metadata, but its Graph API requires an access token.
- KartaView exposes open imagery APIs and may be a good no-key fallback, though coverage and API stability vary.
- Wikimedia and other providers are useful for special imagery but are not a general route-preview source.

The first implementation keeps the static app keyless. The map context menu offers coordinate copy, route-point insertion, and an imagery deep link. A later coverage-aware imagery panel can query one or more providers through a small serverless proxy, report coverage before opening a viewer, and fall back cleanly when a region has no imagery.
