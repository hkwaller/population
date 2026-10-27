# Responsive map interaction

Approved: October 27, 2026.

Use the existing atlas identity in a fullscreen map picker. The map occupies the space between a compact header and a confirmation dock, including portrait and landscape safe areas. Its SVG view follows the actual container aspect ratio without distorting geography. Portrait starts with a useful, vertically fitted view; players can pan across the world and zoom out to see the whole globe.

A click or tap places a pin only when total displacement stays within a small input-specific threshold. Crossing that threshold starts panning on mouse, touch, or pen. Space-drag also pans and never places a pin. Two pointers pinch and pan, with no pin placement when a pointer lifts or a gesture is cancelled. Wheel zoom stays anchored to the cursor. Zoom and reset remain visible with 44px targets.

Implementation: update WorldMap viewport sizing and gesture state, then MapPicker layout and dialog focus handling. Keep shared scoring and existing unrelated work unchanged. Verify gesture regressions, TypeScript, focused lint, and rendered portrait/landscape/desktop layouts using the preview route.

## Automatic opening

Approved follow-up: open every active map question directly in fullscreen on phone and desktop. Show the actual question in the compact header. Closing returns to the inline preview and stays closed until reopened or the next question begins. Question identity resets the picker; disabled/answered questions do not auto-open.
