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
  shows the intro `LogoConstellation`s (gated by slide id).
- `Galaxy.jsx` — procedural spiral galaxy (static points, soft additive discs, very
  slow drift, glowing core). No per-point animation — that caused flicker.
- `Planet.jsx` — custom-shader planet: fbm surface + two-scale bump, half-Lambert
  terminator, warm sun / cool night, atmospheric limb crescent, ocean specular,
  thin fresnel atmosphere shell. Lit from the sun (`SUN_POSITION`).
- `Sun.jsx`, `Nebula.jsx` (colored backdrop sphere), `LogoConstellation.jsx`
  (samples an SVG/image — or text fallback — into a star cloud).
- `CameraRig.jsx` — flies to the active slide's waypoint; per-slide `smoothTime`
  (lower = faster; hops ~1.0, reveal ~2.2).
- `Effects.jsx` — restrained bloom + vignette. Bloom is what makes it premium.

### UI / state

- `src/ui/Overlay.jsx` — the DOM card (eyebrow/title/body/socials/code/demo) + HUD.
- `src/state/useStore.js` — zustand slide index; `next/prev` are **throttled**
  (300ms) and key auto-repeat is ignored so a double-fired key can't skip a slide.
- `src/state/useKeyboardNav.js` — → / Space / PageDown = next, ← = prev, **0–9 jump
  to a slide** (great for Q&A), `f` = fullscreen.

### Assets

- `public/logos/*.svg` — Syntax (yellow) and Sentry (purple) logos sampled into the
  intro constellations. White-on-transparent artwork samples best.
- `src/shaders/snoise.js` — shared GLSL simplex noise + fbm.

## Extending it

- **New topic planet:** add a slide with `planet: { position, radius, color,
  colorDeep, atmosphere, freq }` and a `camera` aimed at it. Keep positions within
  the solar-system scale (~tens of units from origin).
- **New "could have been a div" demo:** drop a self-contained component in
  `src/slides/demos/` that uses only the platform (see `DialogDemo.jsx`), then set
  `demo: TheComponent` on a slide. It renders live in the card.
- **Tuning knobs:** bloom in `Effects.jsx`; galaxy color/size/`uSize` in
  `Galaxy.jsx`; per-planet `specular`; transition speed via `smoothTime`.

## Conventions & gotchas

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
