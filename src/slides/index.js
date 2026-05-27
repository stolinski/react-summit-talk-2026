import { DialogDemo } from './demos/DialogDemo.jsx'

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
 * ─────────────────────────────────────────────────────────────────────────
 */
export const slides = [
  {
    id: 'title',
    kicker: 'Departure',
    eyebrow: 'A talk by Scott Tolinski',
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
    camera: { pos: [48, 6, 40], target: [34, 1, 22] },
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
    eyebrow: 'First neighbor',
    title: 'Planet of Native HTML',
    body: 'You installed a library for this. The platform shipped it years ago.',
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
      '// What people install:',
      "import Modal from 'react-modal'",
      '',
      '// What the platform already gives you:',
      '<dialog ref={ref}>…</dialog>',
      'ref.current.showModal()',
    ].join('\n'),
    demo: DialogDemo,
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
    id: 'galaxy',
    kicker: 'The web',
    eyebrow: 'Now pull all the way back',
    title: 'And it’s one speck in a galaxy',
    body: 'The whole web platform spirals out around you. We spend careers on a single world — and yolo-install the rest.',
    camera: {
      pos: [8000, 52000, 15000],
      target: [8000, -900, -15000], // === GALAXY.center
      smoothTime: 2.2, // long, majestic pull-back (still slower than the hops)
    },
  },
]
