# Browser review

Use `?seed=123&review=1` for a test session that never saves progress.

1. Confirm the rocket and universe render before Begin without sound or animation.
2. Begin; the welcome text disappears and only the small playback toolbar remains. Reduced motion starts paused; explicit Play resumes it.
3. Confirm there is no flight panel, speed slider, steering pad, instructional overlay, or manual camera switch on desktop or mobile.
4. Press WASD, arrows, Q/E, P/C, Shift/X and drag the canvas. They must not change flight mode or speed. Diagnostics must remain `mode: cruise`, `throttle: 1`, `speed: 5.5`.
5. Pause and resume; both simulation time and audio must stop and resume. Check mute and volume persistence.
6. Hide controls with H; restore with H or Escape. Confirm keyboard focus remains usable, controls dim on idle, and About/fullscreen work.
7. Hide the tab; rendering and audio suspend. Return; an explicitly paused journey remains paused.
8. Load an old saved session with manual mode and throttle 0 or 3. Position and heading should restore, with autopilot at 1×.
9. Watch gentle turns, automatic detours, and infrequent camera changes. Inspect narrow and desktop viewports for clipping or scrolling.
10. Repeat against the generated bundle. Check for console errors and failed module/asset requests.

Review-mode `window.__drift.advance(seconds)` can step a paused scene up to 600 seconds. This is a rendering smoke-test aid, not a real-time collision or performance benchmark. Normal URLs do not expose it.

Listen for long quiet chord fades and sparse soft notes. Pause freezes the audio clock. Muting or zero volume should silence all layers.
