import { Stars } from '@react-three/drei'
import { Galaxy } from './Galaxy.jsx'
import { Nebula } from './Nebula.jsx'
import { Planet } from './Planet.jsx'
import { slides } from '../slides/index.js'

/**
 * A static bright core at the galactic center. No animation — bloom alone turns
 * this into a soft glowing heart. (The old pulsing version was a flicker source.)
 */
function GalacticCore() {
  return (
    <mesh>
      <sphereGeometry args={[7, 32, 32]} />
      <meshBasicMaterial color="#fff1cf" toneMapped={false} />
    </mesh>
  )
}

export function Universe() {
  return (
    <>
      <ambientLight intensity={0.22} />

      <Nebula />

      {/* Static distant stars — speed={0} kills the twinkle. */}
      <Stars radius={900} depth={120} count={2500} factor={7} saturation={0} fade speed={0} />

      <Galaxy />
      <GalacticCore />

      {/* Every planet is just a slide that declared one. */}
      {slides.map((s) => (s.planet ? <Planet key={s.id} {...s.planet} /> : null))}
    </>
  )
}
