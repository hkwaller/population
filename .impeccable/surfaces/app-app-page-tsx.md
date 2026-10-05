---
version: 1
slug: "app-app-page-tsx"
primary_target: "app/app/page.tsx"
related_targets: ["app/page.tsx"]
---

# App home (/app)

Scope: the native app's start screen (Capacitor `server.url` points here). Mode: Operate (a launcher), with light Persuade for first-timers. Extends the established terracotta/atlas Pop world; no new identity.

Audience & job: a friend who just installed the app or reopened it at a party. Get into a game in one tap: host, join (code or QR), or today's daily. Returning players see their daily state and streak.

Constraints: website `/` stays the marketing page (mobile polish only). No purchase UI, no Adsterra banner on this screen. Offline is handled by the bundled island in `native/offline/`.

## Direction contract
THESIS: a thumb-first game launcher, not a landing page. Refuses the hero-headline-plus-feature-cards scroll the web `/` uses.
OWN-WORLD: terracotta ground (drifting chips from md up, as PopShell does on every route; phones keep a bare ground), white tilted Population tag, Gabarito black, chunky tilted tiles with the existing pop offset shadow, ochre daily ticket, ink join tile, parchment secondary text.
STORY: I see three ways in, pick one, and I'm playing. Below, I learn the formats on offer and where my stats live.
FIRST VIEWPORT: logo tag + auth top. Short punchy line. Then, filling the lower two thirds within thumb reach: a large white "Start a party" tile, an ink "Join" tile with a QR shortcut, an ochre daily ticket showing today's state and streak. Safe-area aware top and bottom.
FORM: stacked launcher tiles (option 1 of an ordered list: tiles, tab bar, single-hero carousel). Seed key: none (extension, user-specified party-first).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
