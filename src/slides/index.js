import { DialogDemo } from './demos/DialogDemo.jsx'

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE TALK.  Each object is one slide. This is the only file you edit to
 *  build it out — add planets, copy, code, and demos here.
 *
 *  Coordinates live inside a galaxy of radius ~240 on the XZ plane. Planets
 *  sit out along the spiral arms; the galaxy core is at the origin and lights
 *  every planet. Point a slide's camera.target at a planet's position to frame
 *  it, and pull the camera way back (slide 2) to reveal the whole galaxy.
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
      position: [55, 2, 35],
      radius: 4,
      color: '#5b9dff',
      colorDeep: '#0b2a6b',
      atmosphere: '#7cc4ff',
      label: 'React',
    },
    camera: { pos: [55, 7, 60], target: [55, 2, 35] },
  },
  {
    id: 'galaxy',
    kicker: 'The web',
    eyebrow: 'Pull back',
    title: 'React is one planet. The web is a galaxy.',
    body: 'A whole platform of capability spirals out around it. Most of us never leave the one world we landed on.',
    camera: { pos: [0, 190, 380], target: [0, 0, 0] },
  },
  {
    id: 'native-html',
    kicker: 'Native HTML',
    eyebrow: 'First stop',
    title: 'Planet of Native HTML',
    body: 'You installed a library for this. The platform shipped it years ago.',
    planet: {
      position: [-150, 6, -55],
      radius: 6,
      color: '#f5a524',
      colorDeep: '#5a2e05',
      atmosphere: '#ffd27a',
      label: '<dialog>',
      freq: 3.0,
    },
    camera: { pos: [-120, 14, -18], target: [-150, 6, -55] },
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
    eyebrow: 'Next system',
    title: 'The CSS Nebula',
    body: ':has(), container queries, scroll-driven animations, view transitions — no JavaScript required.',
    planet: {
      position: [135, -12, -150],
      radius: 7,
      color: '#a855f7',
      colorDeep: '#2e0a52',
      atmosphere: '#d9a8ff',
      label: 'CSS',
      freq: 2.0,
    },
    camera: { pos: [98, 4, -108], target: [135, -12, -150] },
  },
  {
    id: 'web-apis',
    kicker: 'Web APIs',
    eyebrow: 'Deep space',
    title: 'The Web APIs Galaxy',
    body: 'IntersectionObserver, View Transitions, Web Animations, structuredClone… all built in.',
    planet: {
      position: [-40, 16, 180],
      radius: 5.5,
      color: '#22d3ee',
      colorDeep: '#06363f',
      atmosphere: '#8ff2ff',
      label: 'Web APIs',
      freq: 2.6,
    },
    camera: { pos: [-26, 24, 138], target: [-40, 16, 180] },
  },
  {
    id: 'closer',
    kicker: 'Home',
    eyebrow: 'Looking back',
    title: 'React is one planet. Not the universe.',
    body: 'A fine planet. But reach for the platform first — you may not need the dependency at all.',
    camera: { pos: [120, 70, 250], target: [55, 2, 35] },
  },
]
