import { Stars } from '@react-three/drei'
import { Galaxy } from './Galaxy.jsx'
import { Nebula } from './Nebula.jsx'
import { Sun } from './Sun.jsx'
import { Planet } from './Planet.jsx'
import { GALAXY } from './layout.js'
import { slides } from '../slides/index.js'

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
    </>
  )
}
