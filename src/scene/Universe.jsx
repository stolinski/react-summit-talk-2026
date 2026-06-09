import { Stars } from '@react-three/drei'
import { Galaxy } from './Galaxy.jsx'
import { Nebula } from './Nebula.jsx'
import { Sun } from './Sun.jsx'
import { Planet } from './Planet.jsx'
import { LogoConstellation } from './LogoConstellation.jsx'
import { BrowserSupport } from './BrowserSupport.jsx'
import { Sandworm } from './Sandworm.jsx'
import { ReactAtom } from './ReactAtom.jsx'
import { GALAXY } from './layout.js'
import { slides } from '../slides/index.js'
import { useStore } from '../state/useStore.js'

/**
 * The Syntax.fm + Sentry logo constellations live in clean deep space above the
 * solar system. They're only shown on the intro slides (index < 2) so they
 * don't clutter the talk proper.
 */
function IntroConstellations() {
  const index = useStore((s) => s.index)
  const id = slides[index]?.id
  const show = id === 'intro-syntax' || id === 'intro-sentry'
  return (
    <group>
      <LogoConstellation
        src="/logos/syntax.svg"
        fallbackText="Syntax"
        color="#ffd23f"
        position={[-360, 420, 520]}
        size={170}
        density={0.32}
        show={show}
      />
      <LogoConstellation
        src="/logos/sentry.svg"
        fallbackText="Sentry"
        color="#8c5cff"
        position={[360, 420, 520]}
        size={170}
        density={0.7}
        show={show}
      />
    </group>
  )
}

export function Universe() {
  const index = useStore((s) => s.index)
  const wormShow = Boolean(slides[index]?.worm)
  const atomShow = slides[index]?.id === 'system'
  return (
    <>
      <ambientLight intensity={0.15} />

      <Nebula />

      {/* Static distant stars filling the volume between system and galaxy. */}
      <Stars radius={120000} depth={20000} count={5000} factor={150} saturation={0} fade speed={0} />

      {/* The far, enormous galaxy — "the web." */}
      <Galaxy center={GALAXY.center} radius={GALAXY.radius} />

      {/* The local solar system. */}
      <Sun />
      {slides.map((s) => (s.planet ? <Planet key={s.id} {...s.planet} /> : null))}

      <IntroConstellations />

      {/* Shai-Hulud breaching the React planet during the supply-chain beat
          (deps burrowing through your project). Shown on slides with `worm`. */}
      <Sandworm position={[34, 1, 22]} radius={2.4} show={wormShow} />

      {/* The React logo AS a planet — a glowing cyan atom, shown alone on the
          "React is one planet" beat. Isolated at +z so framing it never catches
          the sun or the other planets. */}
      <ReactAtom position={[0, 12, 120]} show={atomShow} />

      {/* 3D browser-support readout (per-slide `support` field). */}
      <BrowserSupport />
    </>
  )
}
