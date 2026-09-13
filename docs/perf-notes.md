# Rendering budgets

## Free 3D flight

The current engine loads by spatial distance rather than forward route time. It queries deterministic sectors around the ship, selects the closest 10 groups, and caps incoming/outgoing groups at 20 during fades. The query runs at most every 0.45 simulation seconds unless travel exceeds 30 units. Loaded bodies keep fixed world coordinates; all GPU transforms subtract the ship position. Local star particles wrap on all three axes.

Steering uses normalized quaternions with bounded integration steps. Pitch and roll are unrestricted. Solid primary bodies, moons, and binary companions have surface boundaries; rings and diffuse clouds remain traversable. The chase camera shortens its boom before a solid surface. The engine exposes mode, position, orientation, speed, and object coordinates through read-only diagnostics.

The older measurements below describe the original route renderer, not the current spatial renderer.

## Original route measurements

The current engine has 7,200 distant stars and 340 local parallax particles. Distant stars remain fixed on the sky; nearby particles wrap using forward travel distance. There is no growing star array.

At most four encounter groups are streamed at a time. An old group's geometries and materials are disposed when it leaves the window, including shared resources deduplicated within that group. A galaxy uses at most 6,500 particles, and an asteroid field uses 110 instances. Route indices and absolute travel stay on the CPU; objects sent to the GPU are positioned relative to the rocket.

The September 13 implementation was stepped through the entire 44-encounter opening route and into the next cycle in the in-app browser: at most four encounter groups, 18–37 resident geometries in those sampled states, and no shader errors. This is a streaming smoke check, not an hour-long frame-time or battery benchmark.

The final deployment bundle was also advanced through two complete cycles (7,480 simulation seconds). At the endpoint it had four active groups, 24 resident geometries, and no browser shader or JavaScript errors. Its compiled module syntax and local import removal were checked separately.

The later rocket refinement adds fixed hull details and a three-engine cluster: the opening view now uses 40 geometries and approximately 47 draw calls in the tested desktop view. Those vehicle resources are built once. The curved route adds only analytic position/heading calculations and offsets existing scenery; it does not create new objects per frame. The study soundtrack schedules overlapping phrases ahead of playback and disconnects finished voices; its scheduler stops while audio is suspended.

The animation loop targets at most 30 rendered frames per second. The drawing buffer is capped at approximately 2.1 million pixels and 1.5 device pixels per CSS pixel. Three.js uses the WebGL renderer with a low-power preference; that preference is a browser hint, not a guarantee.

The initial view renders once. Pause and hidden tabs stop the animation loop and suspend audio. Camera smoothing, star travel, and material animation use the same simulation clock.

These are code-level limits, not measured frame-time or battery-life claims. Use `window.__drift.state` in browser developer tools to inspect current draw calls, geometry count, star count, and playback state when profiling.
