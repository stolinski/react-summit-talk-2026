import { DialogDemo } from './demos/DialogDemo.jsx'

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE TALK.  Each object is one slide. This is the only file you edit to
 *  build it out — add planets, copy, code, and demos here.
 *
 *  The planets form a small SOLAR SYSTEM orbiting the sun at the origin
 *  (positions within ~130 units, radii a few units). The galaxy lives far
 *  away at GALAXY.center. The arc of the talk zooms steadily outward and ends
 *  by revealing that the whole system is one speck in the galaxy.
 *
 *  Fields (all optional except id + camera):
 *    camera  { pos, target }          where the camera flies to
 *    planet  { position, radius, color, colorDeep, atmosphere, label, freq }
 *    eyebrow / title / body / code / demo / kicker   the DOM panel content
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
      label: 'React',
      freq: 2.6,
    },
    camera: { pos: [48, 6, 40], target: [34, 1, 22] },
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
      label: '<dialog>',
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
      label: 'CSS',
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
      label: 'Web APIs',
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
      pos: [0, 50000, 14000],
      target: [0, -600, -16000],
      smoothTime: 3.2, // long, majestic pull-back
    },
  },
]
