# Browser review

Use a fixed `?seed=123` and the same viewport when comparing source with `dist/`. This is a manual procedure, not an automated test suite.

1. Open the page. Confirm the rocket, ocean world, and stars render, Begin becomes enabled, and no sound or animation starts before the user gesture.
2. Begin and confirm the welcome text disappears. If reduced motion is enabled, confirm the page starts paused and explicit play resumes it.
3. Pause and resume. Check both simulation time and the audio context in `window.__drift.state`.
4. Toggle mute, adjust volume, and reload. Confirm the selected sound settings persist.
5. Hold D or Right for about four seconds; release, and confirm the craft faces and travels back along world Z. Test W / S or Up / Down through a full loop, Q / E through a roll, and drag-and-hold steering. Scroll changes chase distance.
6. Hide controls and restore with H or Escape. Check keyboard focus remains usable.
7. Open and close About. Try fullscreen in a supported browser.
8. Hide the tab. Confirm rendering and audio suspend; return and confirm an explicitly paused flight remains paused.
9. Review narrow and desktop viewports for clipped controls, text overlap, and unwanted scrolling.
10. Repeat against the generated bundle and check the console for errors and failed requests, especially module and asset paths.

## Free flight review

Use `?seed=123&review=1` for a test session that never saves progress. Diagnostics include `course` (world position), `orientation` (unit quaternion), `forward`, `mode`, and the stable world coordinates of loaded `objects`.

Check that releasing input holds the new heading, Shift boosts, X brakes, and zero speed allows turning in place after deceleration. Toggle P during a turn and confirm there is no position or orientation jump. Switch C between the chase and pilot views. Fly away from the opening world and return: its world position must remain unchanged. Approach a planet directly, turn away at its surface, and inspect the chase camera for intersections.

Test touch drag-and-hold and both roll buttons with a coarse pointer. Cancellation, window blur, opening About, pausing, and hiding the tab must release all steering. With controls hidden, H or Escape restores access. Keyboard shortcuts must not capture input when a slider or dialog has focus. On a normal URL without a seed, reload after manual flight to check position, orientation, speed, and mode restoration.

Review-mode `advance(seconds)` is limited to 600 seconds per step; it is a rendering smoke-test aid, not a real-time collision or performance benchmark. `at` initializes a location along the original departure corridor.

## Original route review (historical)

`?seed=123&review=1&at=2380` opens a deterministic development view at the stellar black hole. Review mode does not save progress or sound changes. Use `at=2295` for the magnetar, `at=2465` for emission nebulae, and `at=3145` for a spiral galaxy.

On review URLs only, `window.__drift.advance(seconds)` steps a preflight or paused scene. Use 85-second increments to traverse the catalogue, inspect geometry counts and shader errors, and check transition into the second cycle. Normal URLs do not expose this method.

Confirm the rocket stays pointed forward, nearby scenery approaches and recedes, the director holds a shot between slow transitions, and manual camera control postpones the next automatic move. For real-time behavior, also watch normal playback; accelerated review is not a frame-time benchmark.

## Curved flight and study sound

Compare review times 0, 35, 65, and 100 seconds. The vehicle should follow both left and right turns, with subtle banking and attached exhaust. `window.__drift.state.course`, `forward`, and `bank` describe the same analytic trajectory. Zero-time redraws and pausing must not advance the course.

Listen for long, quiet chord fades with a soft key approximately every 15–21 seconds, no beat, and very little cabin noise. Pause freezes the audio clock and resumes the phrase instead of starting a second score. Muting or setting volume to zero should silence all layers.

During the September 13 update, 96 seconds of the score were rendered through Web Audio's OfflineAudioContext at a 54% user volume: finite samples, peak 0.01392, RMS 0.003254, and no clipping. These are digital signal measurements, not a claim about speaker/headphone loudness or listening quality.
