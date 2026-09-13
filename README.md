# Space Drift

A small rocket traveling through an endless procedural starscape. A quiet companion for focus, reading, or taking a break.

Website: [Space Drift](https://ankit8125.github.io/space-drift/) · Source: [Ankit8125/space-drift](https://github.com/Ankit8125/space-drift)

## Run

With Node.js installed, run `npm run dev` and open http://localhost:5173. There is no install step. You can also use any static HTTP server from this directory. Opening `index.html` directly as a `file://` URL will not load the JavaScript modules.

## Stack

The same core stack as Kun Chen's **Fly With Me**: plain HTML, CSS, JavaScript ES modules, Three.js **0.185.1** through an import map, and browser-synthesized Web Audio. No React, Vite, backend, asset downloads, or npm dependencies. Three.js is fetched from jsDelivr, so an internet connection is needed on the first load.

This version uses Three.js's WebGL renderer and GLSL shaders. The original uses its WebGPU renderer with TSL and a WebGL fallback. The scene here is a smaller original implementation designed around space instead of carrying across the terrain engine.

## Experience

- Press **Begin your journey**. The rocket travels continuously forward through a streamed universe. Planets and other objects approach, pass alongside, and recede behind it.
- The opening route contains 44 encounter types over about 62 minutes. After that, seeded variations continue indefinitely, with every catalogue entry appearing once per complete cycle.
- The camera holds each view for several minutes, then eases into a new angle over 22 seconds. Manual camera input overrides the director for 75 seconds, followed by a gentle hand-back.
- The rocket follows slow left-right curves, tilting into its turns while its nose follows the actual course. The scenery and nearby particles move relative to that same path.
- A beatless study soundtrack blends slow chords with sparse felt-key notes. Full volume has approximately 24 dB more gain than the original quiet mix, with a compressor controlling peaks. New sessions default to a gentle 28% volume; existing choices remain saved.
- Drag or use arrow keys to shift your view. Scroll to zoom.
- **Space** pauses both motion and audio. **M** mutes; the slider controls volume.
- **H** hides or restores controls. **Escape** also restores them. **F** toggles fullscreen when supported.
- Controls dim on idle. Keyboard focus brings them back.
- Reduced-motion settings start the journey paused; play explicitly to animate.
- Hidden tabs stop rendering and suspend audio.
- Sound settings, world seed, and simulation time are saved locally. Add `?seed=123` to open a reproducible fresh universe.

## Project layout

The layout follows the original Fly With Me project, with space-specific scenery:

```text
fly-with-me-space/
├── .github/workflows/     # Automated checks
├── assets/               # Static page assets
├── docs/                 # Engine and performance notes
├── library/
│   ├── bodies/           # Planets, stars, remnants, nebulae, galaxies
│   ├── vehicles/         # Rocket geometry and materials
│   ├── catalog.js        # Celestial encounter catalogue
│   └── index.js          # Object-builder registry
├── src/                  # Engine, noise, audio, UI, styles
├── tests/                # Browser review procedures
├── tools/                # Server, checks, bundler
├── index.html            # Page and Three.js import map
├── CONTRIBUTING.md       # Commands and extension guidance
├── VISION.md             # Experience and design principles
└── dist/                 # Generated static site (ignored)
```

The engine in `src/space.js` assembles reusable builders from `library/index.js`. Flight behavior and rendering remain in the engine; object geometry lives in the library. `src/noise.js` contains shared procedural noise, and `src/audio.js` synthesizes the sound.

`src/journey.js` generates the infinite route and occasional camera moves. `src/scenery.js` keeps at most four encounter groups alive, disposing geometry and materials after they pass. Floating-origin rendering keeps GPU coordinates small even on a long flight.

The visuals cover major observed object classes, not every astronomical subtype or a complete database of discovered objects. Sizes, spacing, colors of high-energy emission, and travel times are artistic interpretations. See [the celestial reference](docs/celestial-reference.md) for sources and limitations.

See [CONTRIBUTING.md](CONTRIBUTING.md) for build and deployment commands, [VISION.md](VISION.md) for the experience goals, [performance notes](docs/perf-notes.md) for rendering budgets, and [browser review](tests/flight-review.md) for verification steps.

## Inspiration

Inspired by [Fly With Me](https://github.com/kunchenguid/fly-with-me) by Kun Chen, released under MIT. Its source was studied for the procedural world, synthesized sound, resource limits, and calm interaction philosophy. This project uses original application code and geometry. Three.js retains its own MIT license.
