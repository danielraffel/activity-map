# Activity profile research

Activity Map uses one route editor with activity-specific profiles. A profile changes routing preferences, map overlays, statistics, and export metadata; it should not fork the editor.

## Initial profiles

| Profile | Route geometry | Useful map data | First implementation status |
|---|---|---|---|
| Road bike | Roads and cycleways | Cycleway tags, access, surface, smoothness, grade, road class | Active |
| Everyday / hybrid bike | Roads, paths, and cycleways | Same as road bike with broader surface tolerance | Active |
| Gravel / cross bike | Roads, paths, and unpaved ways | Surface, smoothness, track grade, access | Active profile option |
| Mountain bike | Trails and unpaved ways | Track type, surface, sac scale where present, elevation | Profile planned |
| E-bike | Bike-capable roads and paths | Access, grade, surface, charging points when mapped | Profile planned |
| Run | Roads, paths, sidewalks, and trails | Foot access, surface, lit/path data, elevation | Later |
| Walk / hike | Footways, paths, trails, and roads | Foot access, trail classification, elevation | Later |

## Activities requiring different workflows

Swimming, indoor activities, strength work, and similar activities do not have a meaningful street route. They may eventually be represented as activity records or venue maps, but they should not be forced into the route editor.

Open-water swimming can use a point sequence on a water body, but it needs water boundaries, safety context, weather/current information, and a different export/navigation model. That belongs in a separate profile after the route editor is stable.

## Capability rules

- Expose an activity only when the selected routing provider supports its costing model.
- Expose surface, elevation, access, and cycleway preferences only when the source data is present and attributable.
- Treat live traffic, subjective safety, route popularity, and complete lane-level information as optional provider features.
- Keep the canonical geometry and GPX export available across profiles where GPX is meaningful.
- Record the selected profile and provider in route metadata so a later editor can explain how the geometry was produced.
