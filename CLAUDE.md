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
- **AI is a SECTION just before the finale** (was "undercurrent" — Scott
  expanded it). The slides `ai-intro … ai-close` sit **before** the galaxy, not
  after: the galaxy pull-back is the big visual payoff and must stay the very
  last beat with nothing parked on top of it (and parking the AI slides at the
  galaxy vista also *spoiled* the reveal). The AI section is parked at the
  whole-system vista (`pos [70,95,250] target [0,0,0]` — a rhyme with the early
  `system` slide; galaxy is still just a faint band from there). It's the payoff
  argument, not an "AI talk": agents default to the *average* of their training
  data (div-soup), so your platform knowledge is the ceiling on what they ship —
  and a vote on the next corpus. **Supply chain is the load-bearing middle**:
  writing it by hand used to be the expensive part that justified the dependency;
  AI removes that excuse, so you can *delete* deps (less code, no stranger's JS
  shipped to users) — but pointed at nothing it installs (and slopsquats), so
  knowledge is the steering. Two built artifacts: the side-by-side
  `DependencyContrastDemo` and the `.cursorrules`/CLAUDE.md "defaults" code slide.
  **All section copy is placeholder — Scott rewrites it (he dislikes cheesy
  copy).** Final sign-off (socials) lives on the galaxy slide.
- **Structure: the 3 planets are clusters**, escalating *outward* = more
  bleeding-edge: Native HTML → CSS → Web APIs → (future, e.g. html-in-canvas) →
  galaxy pull-back ("the web"). Flying between planets = the cluster breaks/breathers.
- **Graffiti** (Scott's shadcn competitor, HTML/CSS only) is the credibility
  payoff: "this isn't toys — here's a whole reliable library." Lean on it.
- **Planned, not yet built:** cross-document view transitions, zero-JS menu
  (popover + anchor positioning + invokers), `:has()` as state, html-in-canvas
  finale; plus a **browser-reactions Baseline badge** (per-engine 🟢/💦 faces,
  Safari sweating, driven by the `web-features` package) as the compat indicator
  on each demo.
- **Cut: masonry.** Native CSS masonry (`grid-template-rows: masonry`,
  `display: masonry`, `item-pack`) does **not** render in the Chrome 148
  presentation browser — a live demo would be a dud on stage. Don't reintroduce
  it. (Confirmed-live in Chrome 148 and safe to lean on: scroll-snap, scroll-driven
  animation + `timeline-scope`, container `scroll-state`, `sibling-index()`,
  anchor positioning + `position-try`, popover, view transitions, `allow-discrete`,
  `field-sizing`, `interpolate-size`/`calc-size`, `appearance: base-select`.)

### Demo verification

The live dev server is at https://outside-react.robo.online/ (HMR). Drive it with
the chrome-devtools tools: keys **0–9 jump to a slide**, → / ← step. When
checking a **scroll-driven** demo, note that setting `scrollTop` from a script
lags one frame before the animation samples — wait two `requestAnimationFrame`s
(or read `getComputedStyle`) before trusting a screenshot.

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
  thin fresnel atmosphere shell. Plus a **slow sun-lit cloud deck** (separate
  sphere at 1.02×, patchy fbm, fades on the night side, rotates ~1.35× the
  surface for parallax — mesh rotation only, no per-frame noise = no flicker) and
  a **day/night atmosphere rim** (the fresnel shell brightens on the sunlit limb
  via `uLightDir`, instead of a flat ring). Lit from the sun (`SUN_POSITION`).
- `BrowserSupport.jsx` — the **3D browser-support readout** (replaces the planned
  emoji Baseline badge — Scott rejected emoji). Three **embossed logo coins** in a
  right-margin vertical column (placement Scott liked), camera-anchored (clears the
  centered cards, tuned for 16:9). Each coin **bump-maps its browser logo** into
  the face: the logo texture's luminance drives a relief normal (object-space lit,
  stable on screen), so it reads instantly as that browser AND has 3D emboss.
  Supported = the coin lights up and glows its brand color; unsupported = a dim
  dark coin with the logo still embossed. Driven by each slide's `support` field
  (omit to hide). Logos are **simpleicons white glyphs** in `public/logos/`
  (`chrome/safari/firefox.svg`, fetched via `cdn.simpleicons.org/<slug>/white`) —
  swap in official/full-color art by replacing those files. Brand tint colors and
  emboss depth (`* 5.0` in `discFrag`) are easy dials.
- `Sun.jsx` — core sphere + a **two-layer corona** (inner + wide faint outer) and
  an **anamorphic horizontal lens streak**, all camera-facing sprites at the sun
  so the flare only shows when the sun is on screen (no global wash).
  `Nebula.jsx` (colored backdrop sphere), `LogoConstellation.jsx`
  (samples an SVG/image — or text fallback — into a star cloud; fades via a
  `uOpacity` uniform damped toward its `show` prop in `useFrame`).
- `CameraRig.jsx` — flies to the active slide's waypoint; per-slide `smoothTime`
  (lower = faster; hops ~1.0, reveal ~2.2).
- `Effects.jsx` — restrained bloom + vignette. Bloom is what makes it premium.

### UI / state

- `src/ui/Overlay.jsx` — the DOM card (eyebrow/title/body/socials/code/demo) + HUD.
  Any slide with `code` is a **"code-hero" slide**: the card centers, the code is
  enlarged, and the planet drops to a backdrop glow behind the frosted glass. A
  slide can also set **`center: true`** to use the centered stage *without* code
  (gets `.card--wide`) — for a wide centerpiece demo (see `ai-supply-chain`). The
  card is **keyed by slide id** so its `rise` fade-in replays on every change (a
  0.35s delay lands it as the camera arrives, not mid-flight); the card's
  children then **stagger in** (`rise-in`, eyebrow→title→body→code/demo, focusing
  from a soft blur).
- **Per-scene accent.** `Overlay.accentFor(slide)` resolves `slide.accent ||
  slide.planet.atmosphere || SCENE_ACCENT[kicker] || #38bdf8` and sets `--accent`
  on `.overlay`. `--accent` is a **registered `@property` `<color>`** with a 0.6s
  transition, so it **cross-fades** between scenes; eyebrow, buttons, demo
  accents and the card's colored halo all inherit it. Add `accent: '#…'` to a
  slide to override; keep `SCENE_ACCENT` (in `Overlay.jsx`) matched to the planet
  atmospheres so parked demos match their planet.
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
