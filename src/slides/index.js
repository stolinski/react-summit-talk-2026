import { DialogDemo } from './demos/DialogDemo.jsx'
import { DrawerDemo } from './demos/DrawerDemo.jsx'
import { ScrollScrubDemo } from './demos/ScrollScrubDemo.jsx'
import { CounterDemo } from './demos/CounterDemo.jsx'
import { SiblingIndexDemo } from './demos/SiblingIndexDemo.jsx'
import { CarouselDemo } from './demos/CarouselDemo.jsx'
import { StickyDemo } from './demos/StickyDemo.jsx'
import { BottomSheetDemo } from './demos/BottomSheetDemo.jsx'
import { AnchorFlipDemo } from './demos/AnchorFlipDemo.jsx'
import { DependencyContrastDemo } from './demos/DependencyContrastDemo.jsx'

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE TALK.  Each object is one slide. This is the only file you edit to
 *  build it out — add planets, copy, code, and demos here.
 *
 *  Order: title hook → who I am (Syntax / Sentry constellations) → into the
 *  solar system to meet the planets → final pull-back reveal of the galaxy.
 *
 *  The planets form a small SOLAR SYSTEM orbiting the sun at the origin. The
 *  galaxy lives far away at GALAXY.center. The Syntax/Sentry logo constellations
 *  float in clean deep space above the system (see Universe.jsx).
 *
 *  Fields (all optional except id + camera):
 *    camera  { pos, target, smoothTime? }   where/how the camera flies
 *    planet  { position, radius, color, colorDeep, atmosphere, freq }
 *    eyebrow / title / body / code / demo / socials / kicker   panel content
 *    center  true → centered stage without code (wide centerpiece demo)
 *    accent  '#rrggbb' → override the per-scene accent (else planet/kicker)
 *    support { chrome, safari, firefox: true | 'partial' | false } → 3D engine
 *            orbs (lit = supported, dim = not). Omit to hide. See BrowserSupport.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const slides = [
  {
    id: 'start',
    // Black pre-roll: the screen stays black on load (see .blackout in
    // Overlay.jsx) so the opening fly-in only fires when you hit next. The
    // camera sits pulled back; advancing dollies in to the title.
    camera: { pos: [78, 16, 66], target: [34, 1, 22] },
  },
  {
    id: 'title',
    kicker: 'Departure',
    title: 'This Component Could Have Been A Div',
    body: 'I’m your guide to the world outside of React.',
    planet: {
      position: [34, 1, 22],
      radius: 2.4,
      color: '#5b9dff',
      colorDeep: '#0b2a6b',
      atmosphere: '#9cd0ff',
      freq: 2.6,
    },
    camera: { pos: [48, 6, 40], target: [34, 1, 22], smoothTime: 1.4 },
  },
  {
    id: 'intro-syntax',
    kicker: 'Hello',
    eyebrow: 'Hi, I’m Scott',
    title: 'I make Syntax.fm',
    body: 'A web dev podcast — three times a week. Come say hi.',
    socials: ['@stolinski', '@syntaxfm'],
    // Frames the Syntax constellation (at x -360) head-on, camera looking +z
    // (away from the galaxy band) so the backdrop is clean deep space. Sentry
    // sits far to the right, off-screen, until the next slide pans over to it.
    camera: { pos: [-360, 408, 190], target: [-360, 400, 520] },
  },
  {
    id: 'intro-sentry',
    kicker: 'Hello',
    eyebrow: 'And my work at',
    title: 'Sentry',
    body: 'Application monitoring — and the home of Syntax.',
    socials: ['@stolinski', '@syntaxfm'],
    camera: { pos: [360, 408, 190], target: [360, 400, 520] },
  },
  {
    id: 'system',
    kicker: 'Your neighborhood',
    eyebrow: 'Pull back a little',
    title: 'React is one planet',
    body: 'It orbits the same star as everything else the platform gives you. Most of us never visit the neighbors.',
    camera: { pos: [70, 95, 250], target: [0, 0, 0] },
  },
  {
    id: 'native-html',
    kicker: 'Native HTML',
    title: 'The modal you keep installing',
    support: { chrome: true, safari: true, firefox: true },
    planet: {
      position: [-58, 3, 36],
      radius: 3.0,
      color: '#f5a524',
      colorDeep: '#5a2e05',
      atmosphere: '#ffd27a',
      freq: 3.0,
    },
    camera: { pos: [-44, 9, 52], target: [-58, 3, 36] },
    code: [
      '<dialog ref={ref}>…</dialog>',
      '',
      'ref.current.showModal()',
    ].join('\n'),
    demo: DialogDemo,
  },
  {
    id: 'drawer',
    kicker: 'Native HTML',
    title: 'A drawer that slides both ways',
    // Reuses the native-html waypoint on purpose: within a planet the camera
    // stays PARKED and the cards rapid-fire. We only fly when we change planets.
    camera: { pos: [-44, 9, 52], target: [-58, 3, 36] },
    code: [
      '<dialog class="drawer">…</dialog>',
      '',
      '.drawer       { translate: 100% 0 }',
      '.drawer[open] { translate: 0 }',
      '',
      '@starting-style { .drawer[open] { translate: 100% 0 } }',
      '/* allow-discrete → it animates OUT too */',
    ].join('\n'),
    demo: DrawerDemo,
  },
  {
    id: 'css-nebula',
    kicker: 'CSS',
    eyebrow: 'Next neighbor',
    title: 'The CSS World',
    body: ':has(), container queries, scroll-driven animations, view transitions — no JavaScript required.',
    planet: {
      position: [-30, -4, -92],
      radius: 3.4,
      color: '#a855f7',
      colorDeep: '#2e0a52',
      atmosphere: '#d9a8ff',
      freq: 2.0,
    },
    camera: { pos: [-16, 6, -70], target: [-30, -4, -92] },
  },
  {
    id: 'scroll-scrub',
    kicker: 'CSS',
    title: 'Scroll-driven animation',
    support: { chrome: true, safari: false, firefox: 'partial' },
    // Parked at the CSS planet: same waypoint as css-nebula, card swaps.
    camera: { pos: [-16, 6, -70], target: [-30, -4, -92] },
    code: [
      '.card {',
      '  animation: scrub linear both;',
      '  animation-timeline: view(inline);',
      '}',
      '',
      '@keyframes scrub {',
      '  0%   { scale: .6; rotate: y -42deg }',
      '  50%  { scale: 1;  rotate: y 0 }',
      '  100% { scale: .6; rotate: y 42deg }',
      '}',
    ].join('\n'),
    demo: ScrollScrubDemo,
  },
  {
    id: 'counter',
    kicker: 'CSS',
    title: 'Numbers that count themselves',
    camera: { pos: [-16, 6, -70], target: [-30, -4, -92] },
    code: [
      '@property --n {',
      '  syntax: "<integer>";',
      '  initial-value: 0;',
      '}',
      '',
      '.stat        { counter-reset: n var(--n);',
      '               animation: count 3s both }',
      '.stat::after { content: counter(n) }',
      '',
      '@keyframes count { to { --n: 1000000 } }',
    ].join('\n'),
    demo: CounterDemo,
  },
  {
    id: 'sibling-index',
    kicker: 'CSS',
    title: 'Every element knows its index',
    camera: { pos: [-16, 6, -70], target: [-30, -4, -92] },
    code: [
      '.bar {',
      '  height: calc(sibling-index() * 28px);',
      '  background: hsl(calc(sibling-index() * 26) 85% 62%);',
      '  animation-delay: calc(sibling-index() * 70ms);',
      '}',
      '',
      '/* no style="--i" anywhere */',
    ].join('\n'),
    demo: SiblingIndexDemo,
  },
  {
    id: 'carousel',
    kicker: 'CSS',
    title: 'The carousel builds its own controls',
    camera: { pos: [-16, 6, -70], target: [-30, -4, -92] },
    code: [
      '.carousel { scroll-marker-group: after }',
      '',
      '/* dots — generated by the browser */',
      '.slide::scroll-marker { content: "" }',
      '.slide::scroll-marker:target-current {',
      '  background: #fff',
      '}',
      '',
      '/* arrows — also generated */',
      '.carousel::scroll-button(right) { content: "›" }',
    ].join('\n'),
    demo: CarouselDemo,
  },
  {
    id: 'sticky-state',
    kicker: 'CSS',
    title: 'A header that knows it’s stuck',
    camera: { pos: [-16, 6, -70], target: [-30, -4, -92] },
    code: [
      '.header {',
      '  position: sticky; top: 0;',
      '  container-type: scroll-state;',
      '}',
      '',
      '@container scroll-state(stuck: top) {',
      '  .title { box-shadow: 0 12px 30px #000 }',
      '}',
    ].join('\n'),
    demo: StickyDemo,
  },
  {
    id: 'bottom-sheet',
    kicker: 'CSS',
    title: 'A sheet that snaps to size',
    // Parked at the CSS planet: same waypoint as css-nebula, card swaps.
    camera: { pos: [-16, 6, -70], target: [-30, -4, -92] },
    code: [
      '.sheet {',
      '  overflow-y: auto;',
      '  scroll-snap-type: y mandatory;',
      '  overscroll-behavior: contain;',
      '}',
      '',
      '/* one rung per resting position */',
      '.detent { scroll-snap-align: start }',
    ].join('\n'),
    demo: BottomSheetDemo,
  },
  {
    id: 'web-apis',
    kicker: 'Web APIs',
    eyebrow: 'Out at the edge',
    title: 'The Web APIs World',
    body: 'IntersectionObserver, View Transitions, Web Animations, structuredClone… all built in.',
    planet: {
      position: [118, 5, -46],
      radius: 2.8,
      color: '#22d3ee',
      colorDeep: '#06363f',
      atmosphere: '#8ff2ff',
      freq: 2.6,
    },
    camera: { pos: [101, 13, -26], target: [118, 5, -46] },
  },
  {
    id: 'anchor-flip',
    kicker: 'Web APIs',
    title: 'A menu that flips to stay on screen',
    support: { chrome: true, safari: false, firefox: false },
    // Parked at the Web APIs planet: same waypoint as web-apis, card swaps.
    camera: { pos: [101, 13, -26], target: [118, 5, -46] },
    code: [
      '.btn  { anchor-name: --btn }',
      '',
      '.menu {',
      '  position-anchor: --btn;',
      '  position-area: block-end;',
      '  position-try-fallbacks:',
      '    flip-block, flip-inline;',
      '}',
      '',
      '/* the menu flips to stay on screen — no JS */',
    ].join('\n'),
    demo: AnchorFlipDemo,
  },
  /* ───────────────────────── CLOSING MOVEMENT: AGENTS ─────────────────────────
   *  The "so what" — placed BEFORE the galaxy so the pull-back stays the final
   *  payoff and isn't spoiled (from this "whole system" vista the galaxy is still
   *  just a faint band; see scene/layout.js scale separation). AI is the meaning
   *  of the tour, not a tangent: agents default to the average (div soup + a
   *  dependency), so your platform knowledge is the ceiling on what they ship —
   *  and a vote on the next corpus. Supply chain is the load-bearing middle.
   *
   *  COPY IS PLACEHOLDER — Scott rewrites. Parked at the system overview (a
   *  deliberate rhyme with the early `system` slide); `ai-intro` flies back here
   *  from the Web APIs planet, then `galaxy` does the big pull-back from here.
   * ────────────────────────────────────────────────────────────────────────── */
  {
    id: 'ai-intro',
    kicker: 'Agents',
    title: 'You don’t write most of this anymore',
    body: 'Agents write a lot of our HTML and CSS now. The only question left is what they reach for.',
    // Pull back out of the Web APIs planet to the whole-system vista.
    camera: { pos: [70, 95, 250], target: [0, 0, 0], smoothTime: 1.8 },
  },
  {
    id: 'ai-average',
    kicker: 'Agents',
    eyebrow: 'Regression to the mean',
    title: 'AI writes the average of the web',
    body: 'The average is a div, an onClick, and a dependency for the rest. A model returns the most common answer — and the most common answer is the old one.',
    camera: { pos: [70, 95, 250], target: [0, 0, 0] },
  },
  {
    id: 'ai-supply-chain',
    kicker: 'Agents',
    eyebrow: 'Every import is a trust decision',
    title: 'The same menu, two supply chains',
    center: true,
    demo: DependencyContrastDemo,
    camera: { pos: [70, 95, 250], target: [0, 0, 0] },
  },
  {
    id: 'ai-excuse',
    kicker: 'Agents',
    eyebrow: 'The trade-off collapsed',
    title: 'The reason you installed it is gone',
    body: 'You pulled in the library because writing it yourself was the expensive part. It isn’t anymore. The dependency stopped being a trade and became risk you kept for nothing.',
    camera: { pos: [70, 95, 250], target: [0, 0, 0] },
  },
  {
    id: 'ai-other-edge',
    kicker: 'Agents',
    eyebrow: 'The other edge',
    title: 'Point it at nothing and it installs',
    body: 'Left to its average, an agent reaches for the registry — and will confidently import a package that doesn’t exist, a name attackers now register to catch the guess. The same tool that deletes dependencies will add a hostile one.',
    camera: { pos: [70, 95, 250], target: [0, 0, 0] },
  },
  {
    id: 'ai-defaults',
    kicker: 'Agents',
    title: 'You write its defaults',
    body: 'You can’t approve what you can’t recognize.',
    code: [
      '# CLAUDE.md / .cursorrules',
      '',
      'Prefer the platform over packages:',
      '  <dialog>        over a modal library',
      '  :has()          over state',
      '  anchor + try    over Floating UI',
      '  scroll timeline over scroll listeners',
      '',
      'No new dependency without asking first.',
    ].join('\n'),
    camera: { pos: [70, 95, 250], target: [0, 0, 0] },
  },
  {
    id: 'ai-close',
    kicker: 'Agents',
    eyebrow: 'What you ship is what it learns next',
    title: 'This component could have been a div',
    body: 'Now you’re the one who decides it is. Every component you write becomes the next model’s training data — ship the platform and you raise the floor for everyone.',
    camera: { pos: [70, 95, 250], target: [0, 0, 0] },
  },

  /* ── THE PAYOFF ── The final pull-back. Stays last; nothing parked on top of
   *  it. The huge zoom from the system vista to GALAXY.center is the reveal, and
   *  the sign-off (socials) lands on it. */
  {
    id: 'galaxy',
    kicker: 'The web',
    eyebrow: 'Now pull all the way back',
    title: 'And it’s one speck in a galaxy',
    body: 'The whole web platform spirals out around you. We spend careers on a single world — and yolo-install the rest.',
    socials: ['@stolinski', '@syntaxfm'],
    camera: {
      pos: [8000, 52000, 15000],
      target: [8000, -900, -15000], // === GALAXY.center
      smoothTime: 2.2, // long, majestic pull-back (still slower than the hops)
    },
  },
]
