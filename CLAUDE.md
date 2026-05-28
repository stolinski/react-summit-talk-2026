# CLAUDE.md

## What this is

A conference talk **rendered as an interactive 3D universe** — the slides *are* a
Three.js scene you fly through. Talk title: **"This Component Could Have Been A
Div"** by Scott Tolinski. Thesis: React abstracts the DOM so much that devs forget
how capable the raw web platform is — so the talk tours the "world outside React"
(native HTML, CSS, Web APIs) as planets in a solar system, then pulls back to reveal
that whole system is one speck in a galaxy (the web).

The medium is the message: it's a graphics-heavy presentation built on the web
platform itself.

## Talk direction & voice

The decisions driving content (keep copy and demos coherent with these):

- **Thesis: the fundamentals *moved*.** Not "relearn the basics" — there's a 2026
  platform baseline (`:has()`, anchor positioning, view transitions, container
  queries, scroll-driven animation, html-in-canvas) that React devs were
  insulated from. Sympathetic, not scoldy: the ground shifted; the audience is
  the hero leveling up.
- **Emotional engine: shock.** Each demo is a magic trick — the shock lives in the
  *setup* (let them feel the heavy JS/library version in their head), the reveal
  is tiny platform code. Pick demos by *known pain*: did the room bleed doing this
  the old way (carousel, masonry, drawer/`vaul`, scroll-anim/GSAP)?
- **AI is the undercurrent, not the headline.** A beat or two + the close: agents
  default to the *average* of their training data (div-soup), so your platform
  knowledge is the ceiling on what they produce — and you can't approve what you
  can't recognize. Don't turn it into an "AI talk".
- **Structure: the 3 planets are clusters**, escalating *outward* = more
  bleeding-edge: Native HTML → CSS → Web APIs → (future, e.g. html-in-canvas) →
  galaxy pull-back ("the web"). Flying between planets = the cluster breaks/breathers.
- **Graffiti** (Scott's shadcn competitor, HTML/CSS only) is the credibility
  payoff: "this isn't toys — here's a whole reliable library." Lean on it.
- **Planned, not yet built:** masonry (one line), cross-document view transitions,
  zero-JS menu (popover + anchor positioning + invokers), `:has()` as state,
  html-in-canvas finale; plus a **browser-reactions Baseline badge** (per-engine
  🟢/💦 faces, Safari sweating, driven by the `web-features` package) as the
  compat indicator on each demo.

## Stack

- **Vite** + **React 18**
- **React Three Fiber 8** (`@react-three/fiber`) + **drei** + **`@react-three/postprocessing`**
- **zustand** for slide state (shared across the `<Canvas>` boundary)
- Package manager: **pnpm** (not npm)

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build
```

> The live dev server is hosted at **https://outside-react.robo.online/** (HMR
> on). Use that URL to view and verify changes — no need to run `pnpm dev`
> locally.

## How it works

Each slide is a plain config object. A slide declares where the **camera** flies
(`{ pos, target, smoothTime? }`) and, optionally, a **planet**, a **logo
constellation**, and DOM **content** (title/body/code/demo/socials). Navigating
tweens the camera between waypoints; all readable text/code/demos are real DOM
layered over the WebGL canvas (crisp on a projector, and itself a proof of the
thesis).

### The one file you usually edit

**`src/slides/index.js`** — the entire talk: order, copy, camera waypoints,
planets, code samples, demos. Start here.

### Scene (`src/scene/`)

- `layout.js` — scale constants. **Key idea: scale separation.** The solar system
  is tiny and local (sun at origin, planets within ~130 units); the galaxy is huge
  and far (`GALAXY.center` ~15k units away, radius 26k). From inside, the galaxy is
  just a faint star band; its true scale stays hidden until the final pull-back.
- `Universe.jsx` — assembles everything; maps planet-bearing slides to `<Planet>`s;
  shows the intro `LogoConstellation`s. They **fade** in/out via a `show` prop —
  don't toggle `visible`, that pops.
- `Galaxy.jsx` — procedural spiral galaxy (static points, soft additive discs, very
  slow drift, glowing core). No per-point animation — that caused flicker.
- `Planet.jsx` — custom-shader planet: fbm surface + two-scale bump, half-Lambert
  terminator, warm sun / cool night, atmospheric limb crescent, ocean specular,
  thin fresnel atmosphere shell. Lit from the sun (`SUN_POSITION`).
- `Sun.jsx`, `Nebula.jsx` (colored backdrop sphere), `LogoConstellation.jsx`
  (samples an SVG/image — or text fallback — into a star cloud; fades via a
  `uOpacity` uniform damped toward its `show` prop in `useFrame`).
- `CameraRig.jsx` — flies to the active slide's waypoint; per-slide `smoothTime`
  (lower = faster; hops ~1.0, reveal ~2.2).
- `Effects.jsx` — restrained bloom + vignette. Bloom is what makes it premium.

### UI / state

- `src/ui/Overlay.jsx` — the DOM card (eyebrow/title/body/socials/code/demo) + HUD.
  Any slide with `code` is a **"code-hero" slide**: the card centers, the code is
  enlarged, and the planet drops to a backdrop glow behind the frosted glass. The
  card is **keyed by slide id** so its `rise` fade-in replays on every change (a
  0.35s delay lands it as the camera arrives, not mid-flight).
- `src/ui/CodeBlock.jsx` — **zero-dependency** syntax highlighter (~20-line
  tokenizer; comments/strings/tags/numbers only). Intentionally not Shiki:
  synchronous (no flash on slide change), offline-safe, on-brand for a no-install
  talk. Token colors are `.tok-*` classes in `index.css`.
- `src/state/useStore.js` — zustand slide index; `next/prev` are **throttled**
  (300ms) and key auto-repeat is ignored so a double-fired key can't skip a slide.
- `src/state/useKeyboardNav.js` — → / Space / PageDown = next, ← = prev, **0–9 jump
  to a slide** (great for Q&A), `f` = fullscreen.

### Assets

- `public/logos/*.svg` — Syntax (yellow) and Sentry (purple) logos sampled into the
  intro constellations. White-on-transparent artwork samples best.
- `public/fonts/Newake.*` — **Newake**, the display face for all headings
  (`.card h1`), self-hosted via `@font-face` in `src/index.css` so it works
  offline. woff2 preferred; see `public/fonts/README.md`.
- `src/shaders/snoise.js` — shared GLSL simplex noise + fbm.

## Extending it

- **New topic planet:** add a slide with `planet: { position, radius, color,
  colorDeep, atmosphere, freq }` and a `camera` aimed at it. Keep positions within
  the solar-system scale (~tens of units from origin).
- **New "could have been a div" demo:** drop a self-contained component in
  `src/slides/demos/` that uses only the platform (see `DialogDemo.jsx`,
  `DrawerDemo.jsx`, `ScrollScrubDemo.jsx`), then set `demo: TheComponent` on a
  slide. It renders live in the card. Conventions for demo slides:
  - **Code is the star.** Give the slide a tight `code` block and **no `body`
    explainer** — you narrate over it. Don't name the library you're replacing on
    the slide; say it out loud instead.
  - **Stay parked.** Reuse the cluster's arrival-slide `camera` waypoint so the
    camera doesn't fly — within a planet, demos rapid-fire as card swaps. Only fly
    when you change planets.
  - **Drop the metaphor from the copy.** The 3D universe carries the
    planet/galaxy metaphor; titles stay direct and about the feature
    ("Scroll-driven animation"), never "Planet of X" / "first neighbor".
- **Tuning knobs:** bloom in `Effects.jsx`; galaxy color/size/`uSize` in
  `Galaxy.jsx`; per-planet `specular`; transition speed via `smoothTime`.

## Conventions & gotchas

- **The overlay is a scaled stage.** All overlay/DOM sizes are authored in
  **1080p design pixels** on a fixed 1920×1080 stage that's scaled to fit the
  viewport (`--stage-scale`, set on resize in `Overlay.jsx`), so the deck is
  proportionally identical at any resolution. Use fixed `px`/`rem` for overlay
  content — **not** `vw`/`vh`. Exception: `showModal()` dialogs are promoted to
  the top layer, which ignores the stage transform, so size those in `vmin`.
- **Keep motion calm.** Static or very slow drift only — earlier versions flickered
  from animated points, grain, and twinkle. Avoid reintroducing per-frame churn.
- Planets use **custom shaders**, so scene `<light>`s don't affect them — lighting
  is hand-rolled and comes from the sun direction.
- `logarithmicDepthBuffer` + a far plane of 150k–400k let the tiny system and the
  huge galaxy coexist without z-fighting. Don't shrink the far plane.
- drei `<Text>` / troika fonts fetch from a CDN — **self-host a font before
  presenting** so it works offline on conference wifi.
- For the live talk: **record a full screen-capture backup run** — insurance
  against WebGL/projector failure.
