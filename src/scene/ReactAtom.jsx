import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The React logo as a planet — a glowing cyan ATOM, not a rocky world.
 *
 * It's the visual pun for the "React is one planet" beat: React's mark *is* an
 * atom, so here it literally is one — an emissive nucleus orbited by the three
 * elliptical rings of the logo, each carrying a small electron. The whole thing
 * is self-illuminated (it ignores the sun) so it reads as energy against deep
 * space, and the additive rings bloom (see Effects.jsx) into the React glow.
 *
 * Shown only on the `system` slide (Universe gates it via `show`), so it never
 * collides with the solid React/home planet at [34,1,22] used by the title slide
 * and the supply-chain worm beat — those stay untouched.
 *
 * Motion stays calm per the house rule: smooth mesh transforms only (a slow
 * tilt-spin of the whole logo + electrons gliding their rings), no per-frame
 * noise. The atom is built tilted so the 3 rings read as 3D orbits, not a flat
 * billboard, while still being recognizably the logo.
 */
const CYAN = '#61dafb'
const RING_PHASES = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3] // 0°, 120°, 240° → the logo's three orbits

// Emissive core: cyan-hot center fading to a deep-blue limb with a fresnel halo.
// Independent of scene lighting so the atom glows on its own.
const coreVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`
const coreFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uDeep;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float facing = max(dot(normalize(vN), normalize(vV)), 0.0);
    float rim = pow(1.0 - facing, 3.0);
    vec3 col = mix(uDeep, uColor, facing);  // deep-blue edges, cyan core
    col += uColor * rim * 0.85;             // fresnel halo
    gl_FragColor = vec4(col * 1.3, 1.0);    // push into bloom
  }
`

// A clean, uniform-thickness elliptical ring (the logo's orbit) in the XY plane.
function ellipseRing(a, b, tube) {
  const curve = new THREE.EllipseCurve(0, 0, a, b, 0, Math.PI * 2, false, 0)
  const pts = curve.getPoints(220).map((p) => new THREE.Vector3(p.x, p.y, 0))
  const path = new THREE.CatmullRomCurve3(pts, true)
  return new THREE.TubeGeometry(path, 260, tube, 14, true)
}

export function ReactAtom({ position = [0, 0, 0], scale = 1, show = true }) {
  const root = useRef()
  const spin = useRef()
  const electrons = useRef([])
  const amp = useRef(0)

  // Logo proportions: the orbit ellipse is ~2.5× as wide as it is tall.
  const A = 4.6 * scale
  const B = 1.85 * scale
  const ringGeo = useMemo(() => ellipseRing(A, B, 0.09 * scale), [A, B, scale])

  const coreUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(CYAN) },
      uDeep: { value: new THREE.Color('#1b3a8f') },
    }),
    []
  )

  useFrame((_, dt) => {
    const g = root.current
    if (!g) return
    // materialize: ease in from `show`, gate out when fully gone. Snappy enough
    // (lambda ~4 → ~95% in <0.8s) that it's fully glowing as the camera arrives.
    amp.current = THREE.MathUtils.damp(amp.current, show ? 1 : 0, 4, dt)
    g.visible = amp.current > 0.01
    // materialize grow (geometry already carries `scale`, so this is unit-grow only)
    g.scale.setScalar(0.82 + 0.18 * amp.current)

    // slow logo spin about its (tilted) axis — the React spinner, calm
    if (spin.current) spin.current.rotation.z += dt * 0.16

    // electrons glide their orbits; phase-offset so they don't cluster
    const t = (spin.current ? spin.current.rotation.z : 0) * 1.7
    electrons.current.forEach((e, i) => {
      if (!e) return
      const th = t + RING_PHASES[i]
      e.position.set(A * Math.cos(th), B * Math.sin(th), 0)
    })
  })

  return (
    // outer group positions in world space; inner `spin` carries the logo tilt so
    // the three orbits read as 3D, and spins about that tilted axis.
    <group ref={root} position={position}>
      <group ref={spin} rotation={[-0.42, 0.22, 0]}>
        {/* nucleus */}
        <mesh>
          <sphereGeometry args={[1.25 * scale, 48, 48]} />
          <shaderMaterial vertexShader={coreVert} fragmentShader={coreFrag} uniforms={coreUniforms} />
        </mesh>

        {/* three elliptical orbits, each with an electron riding it */}
        {RING_PHASES.map((phase, i) => (
          <group key={i} rotation={[0, 0, phase]}>
            <mesh geometry={ringGeo}>
              <meshBasicMaterial color={CYAN} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={(el) => (electrons.current[i] = el)}>
              <sphereGeometry args={[0.34 * scale, 24, 24]} />
              <meshBasicMaterial color={CYAN} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
