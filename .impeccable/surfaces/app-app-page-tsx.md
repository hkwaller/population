---
version: 1
slug: "app-app-page-tsx"
primary_target: "app/app/page.tsx"
related_targets: ["app/page.tsx"]
---

# App home (/app)

Scope: the native app's start screen (Capacitor `server.url` points here). Mode: Operate (a launcher), with light Persuade for first-timers. The user approved a playful-atlas refinement that differentiates Population from its Ish origins, then expanded review and reuse across the app. Gameplay scoring, content, launcher structure and earthy colours remain. The implemented shared system is recorded in `DESIGN.md` and `.impeccable/design.json`.

Audience & job: a friend who just installed the app or reopened it at a party. Get into a game in one tap: host, join (code or QR), or today's daily. Returning players see their daily state and streak.

Constraints: website `/` stays the marketing page. Its approved refinement uses an asymmetric introduction with actual world-atlas vector geography; the globe stacks after actions on mobile. No purchase UI or Adsterra banner on the app launcher. Offline is handled by the bundled island in `native/offline/`. Keep the Population name and “Made by Amalies Utviklingsfabrikk” attribution.

## Direction contract

THESIS: a thumb-first game launcher with a geographic identity. Keep host, join and daily as the three immediate ways in.

OWN-WORLD: terracotta ground with static parchment meridian linework, a straight globe Population wordmark, bold Gabarito, level main launcher tiles with soft blurred depth, an ochre daily ticket, ink join tile and parchment secondary text. Shared buttons use 12px corners; shared panels and main launcher tiles use 16px corners. The shared decoration no longer uses floating category chips.

STORY: I see three ways in, pick one, and I'm playing. Below, I learn the formats on offer and where my stats live.

FIRST VIEWPORT: wordmark and auth at the top. Short punchy line. Then, within thumb reach: a large white “Start a party” tile, an ink “Join” tile with a native QR shortcut, and an ochre daily ticket showing today's state and streak. Respect top and bottom safe areas.

FORM: stacked launcher tiles retain their existing order, destinations, daily state and scanning behaviour. Format examples and supporting navigation remain below. Seed key: none; approved refinement of an existing surface.

EXTENSION SCOPE: shared atlas controls, panels, readable labels and static decoration now extend to setup/lobby, answering/reveal/results, daily/offline practice and parchment support/legal shells. This brief remains about `/app`; the broader system does not prescribe the launcher's composition to every page. The main tiles, headline, format cards and player badges are level. Circles remain for avatars, globe and badges; pills remain for semantic labels, scores and switches. Confetti retains celebratory rotation and map overlays retain real device-orientation handling. The waiting loader respects reduced motion; primary actions have no constant idle bob. Safe-area docks and fullscreen overlays preserve usable controls. Authenticated profile/admin were source-reviewed only, and externally hosted sign-in is outside local styling control. The website globe is a local SVG derived from the existing world-atlas dataset; no raster imagery was generated.

FINISH: record the implemented tokens and scope, review both website and launcher at desktop/mobile widths, and verify that host/join/daily actions, native safe areas and keyboard focus remain usable. Documentation alone is not evidence of a completed visual or runtime review.
