# Working on Space Drift

## Commands

Node.js 22 is sufficient; there is no dependency installation step.

- `npm run dev` — serve the source at http://localhost:5173.
- `npm run check` — check JavaScript syntax and run deterministic route, streaming-window, and camera-continuity tests.
- `npm run build` — produce and validate the complete `dist/` site, guide, sharing image, robots.txt, and sitemap.
- `npm run preview` — serve the generated output on the same port. Stop the development server first, or set `PORT` to a different port.

Any static HTTP server can serve the source. ES modules require HTTP rather than opening the page with `file://`.

## Folder responsibilities

- `index.html` owns page markup and the pinned Three.js import map.
- `src/` owns the engine, shared noise, audio, interaction, and CSS.
- `library/` owns reusable object builders, registered in `library/index.js`. Vehicles belong in `vehicles/`; celestial objects belong in `bodies/`.
- `assets/` holds static page assets. Runtime geometry and sound are procedural.
- `tools/` holds development, validation, and packaging scripts.
- `tests/` holds browser review procedures.
- `docs/` holds implementation notes such as rendering budgets.
- `.github/workflows/` holds automated validation.
- `dist/` is generated output; change the source rather than editing it.

Object builders receive Three.js from the engine and return their objects. They do not control the render loop, camera, storage, or audio. Register new builders in the library, then let the engine place and animate them.

Celestial builders return `{group, update, dispose}` using the shared body-result helper. Add encounter definitions to `library/catalog.js`; register any new renderer family in `library/index.js`. Every streamed builder must release its resources. Avoid allocating geometry, materials, or arrays in per-frame updates.

The bundler follows static relative `import ... from` statements from `src/main.js`. It supports the current named imports and `export const` / `export function` declarations; use unique top-level names because modules are folded into a single scope. External imports remain CDN imports. New module syntax needs a corresponding bundler change and source/bundle verification.

## Validation and publishing

Run syntax checks and the build, then follow [the browser review](tests/flight-review.md) against both source and bundle. Keep the look and behavior unchanged for organizational refactors.

Upload the contents of `dist/` to a static host when ready. The validation workflow checks and builds the site but does not publish it.

For Vercel, `vercel.json` supplies the static build settings. After signing in, link the project with `vercel link`, then use `vercel --prod` to publish. Build-time `SITE_URL` overrides the canonical origin; otherwise Vercel's production project URL is used, falling back to `https://space-drift-focus.vercel.app`. This keeps the canonical tags, sharing metadata, robots.txt, and sitemap consistent. Keep `.vercel/` and local credentials out of Git.
