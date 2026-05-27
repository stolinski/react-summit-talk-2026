import { Stars } from '@react-three/drei'
import { Galaxy } from './Galaxy.jsx'
import { Nebula } from './Nebula.jsx'
import { Sun } from './Sun.jsx'
import { Planet } from './Planet.jsx'
import { LogoConstellation } from './LogoConstellation.jsx'
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
  return (
    <group visible={index < 2}>
      <LogoConstellation
        src="/logos/syntax.svg"
        fallbackText="Syntax"
        color="#ffd23f"
        position={[-360, 420, 520]}
        size={170}
        density={0.32}
      />
      <LogoConstellation
        src="/logos/sentry.svg"
        fallbackText="Sentry"
        color="#8c5cff"
        position={[360, 420, 520]}
        size={170}
        density={0.7}
      />
    </group>
  )
}

export function Universe() {
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
    </>
  )
}
