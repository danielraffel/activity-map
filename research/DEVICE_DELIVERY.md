# OpenTrailPaper delivery research

This is a future integration track. The web editor should remain useful with GPX download even when the device is unavailable.

## Current known path

OpenTrailPaper already accepts GPX over BLE through its iOS and Android companion apps. The firmware stores incoming files under `/routes`, parses the track, and accepts maneuver records. The companion apps are therefore the first dependable bridge from a GitHub Pages app to the head unit.

## Candidate delivery paths

### 1. Download/share GPX

Activity Map exports a normal GPX file. The user opens it in the OpenTrailPaper companion app, which sends it over BLE. This has the fewest browser and platform assumptions and should be the baseline.

### 2. OpenTrailPaper handoff link

A future companion-app change could register a custom URL or universal/app link. Activity Map would invoke the link with a route payload or a short-lived file reference; the app would validate it, show the route name/size, and offer BLE upload. The route should not be placed in an unbounded URL. A platform share target may be simpler than a custom URL for large GPX files.

### 3. Direct Chrome Web Bluetooth

Chrome/Edge on desktop can potentially connect directly to the ESP32-S3's existing OpenTrailPaper GATT service. The browser would:

1. Ask the user to select a nearby OpenTrailPaper device.
2. Discover the existing service and route characteristic.
3. Send the same framed start/data/end GPX messages used by the companion app.
4. Send maneuver records if the route contains cues.
5. Wait for the device acknowledgement and show progress/retry state.

This requires the device to be awake and advertising, a user gesture for the connection, a secure HTTPS origin, and browser/platform support. A GitHub Pages site satisfies HTTPS, but Safari/iOS is not a reliable Web Bluetooth target. Direct BLE should therefore be a convenience path with a visible fallback to the companion app.

### 4. Deferred relay or wake-and-fetch

A web request cannot normally wake a sleeping ESP32 over BLE. A push notification can wake a phone app, but it cannot directly wake the head unit unless the companion phone is already participating and the app has a background Bluetooth strategy. A future relay could store an encrypted, expiring route and let the companion app fetch it when opened or when the phone reconnects to the device. This adds identity, storage, expiry, and notification complexity, so it is deliberately deferred.

## Research questions

- Which OpenTrailPaper GATT characteristics and acknowledgement bytes should be treated as the public web-transfer contract?
- How does the firmware advertise and reconnect after sleep or wake?
- Can the companion apps accept a shared GPX file without duplicating route logic?
- What maximum route size and chunk pacing are reliable on real hardware?
- Would a platform share target provide a smoother handoff than a custom URL?
- Is a phone-side background relay valuable enough to justify a small encrypted service?

## Design constraint

No device transport should be required for the first Activity Map release. The web app must always produce a standards-compliant GPX that can be saved, backed up, and imported elsewhere.
