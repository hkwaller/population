# Locate It geography detail

Approved: October 27, 2026.

Use the same Natural Earth 10m source as Border Shapes, in the existing world projection with all territories retained. Replace the coarse 110m world geometry with a locally served 10m atlas shared by rendering and country-hit scoring. Keep the parchment palette, pin gestures, viewport sizing and controls. Preserve clear, thin borders through zoom, and show location markers while small countries are too small to distinguish; hide those markers once their real outlines become readable.

Implementation: copy the installed world-atlas data into public/geo through a repeatable build script, switch the shared loader, and derive small-country markers from projected area at the current zoom. The native offline build already copies the geo directory. Verify real small-country and overseas-territory scoring, existing gestures, TypeScript and lint, and inspect desktop and mobile renders.

## Performance correction

The full 10m world atlas made interaction feel sluggish. It contains 477,295 points and produces about 8.3 MB of projected SVG paths. Use the 50m atlas for the interactive world map and matching hit scoring: 80,617 points and about 1.5 MB of SVG paths, while retaining Malta, Singapore, Seychelles and overseas territories. Keep the 10m source for standalone Border Shapes silhouettes. A geometry-budget regression check bounds world-map SVG complexity below 2 MB at its canonical projection size; timing comparisons remain diagnostic rather than machine-dependent test assertions.
