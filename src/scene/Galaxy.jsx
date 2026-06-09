import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A procedural spiral galaxy — "the web." Enormous (radius ~6000) and far from
 * the solar system, so from inside the system it's a luminous band across the
 * sky, and from the pull-back reveal it's a full face-on spiral with the system
 * an invisible speck inside it.
 *
 * Points are static (no per-point spin — that caused the flicker) with a soft
 * disc shape; the whole disk drifts imperceptibly. A bright core sphere at the
 * center blooms into the galactic heart.
 */
const vertexShader = /* glsl */ `
  uniform float uSize;
  attribute float aScale;
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uSize * aScale * (1.0 / sqrt(-viewPosition.z));
    vColor = aColor;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.5);
    gl_FragColor = vec4(vColor, a);
  }
`

// Galactic nucleus — a camera-facing additive glow (NOT a solid sphere, which
// read as a planet). A tight white-hot core falls off into a broad warm halo;
// bloom turns it into the blazing heart of the galaxy.
const coreVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const coreFrag = /* glsl */ `
  uniform vec3 uHot;
  uniform vec3 uWarm;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;   // 0 at center, 1 at plane edge
    if (r > 1.0) discard;
    float halo = pow(1.0 - r, 2.6);                       // broad soft glow
    float core = pow(1.0 - clamp(r / 0.16, 0.0, 1.0), 3.0); // tight nucleus
    vec3 col = mix(uWarm, uHot, core);
    float a = halo * 0.6 + core * 0.95;
    gl_FragColor = vec4(col * (0.85 + core * 0.7), a);
  }
`

// A flat accretion ring lying in the disk plane: a hot, bright inner lip that
// fades outward, leaving a darker gap between it and the nucleus — the bright-
// ring-around-a-dim-heart silhouette of a black hole / active galactic core.
const ringVert = /* glsl */ `
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFrag = /* glsl */ `
  uniform vec3 uHot;
  uniform vec3 uWarm;
  uniform float uInner;
  uniform float uOuter;
  varying vec3 vLocal;
  void main() {
    float d = length(vLocal.xy);
    float t = (d - uInner) / (uOuter - uInner);
    if (t < 0.0 || t > 1.0) discard;
    float lip = smoothstep(0.2, 0.0, t);     // hot bright inner edge
    float body = pow(1.0 - t, 1.8) * 0.45;   // disk fading outward
    vec3 col = mix(uWarm, uHot, lip);
    float a = lip * 0.85 + body;
    gl_FragColor = vec4(col, a);
  }
`

export function Galaxy({
  center = [0, 0, 0],
  count = 200000,
  radius = 26000,
  branches = 5,
  spinTurns = 1.4,
  insideColor = '#ffe2b0',
  outsideColor = '#3457d6',
}) {
  const coreRadius = radius * 0.022
  const group = useRef()
  const coreGlow = useRef()

  const [positions, colors, scales] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const cInside = new THREE.Color(insideColor)
    const cOutside = new THREE.Color(outsideColor)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const r = Math.pow(Math.random(), 2.2) * radius // dense core
      const branchAngle = ((i % branches) / branches) * Math.PI * 2
      const spinAngle = (r / radius) * spinTurns * Math.PI * 2

      const spread = 0.12
      const rand = () =>
        Math.pow(Math.random(), 2.8) * (Math.random() < 0.5 ? 1 : -1) * spread * r

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + rand()
      positions[i3 + 1] = rand() * 0.3 // flatten the disk
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + rand()

      const mixed = cInside.clone().lerp(cOutside, Math.pow(r / radius, 0.55))
      colors[i3] = mixed.r
      colors[i3 + 1] = mixed.g
      colors[i3 + 2] = mixed.b

      scales[i] = Math.random() * 1.0 + 0.5
    }
    return [positions, colors, scales]
  }, [count, radius, branches, spinTurns, insideColor, outsideColor])

  const uniforms = useMemo(() => ({ uSize: { value: 360 } }), [])

  const coreUniforms = useMemo(
    () => ({
      uHot: { value: new THREE.Color('#fff6e6') },
      uWarm: { value: new THREE.Color('#ffce92') },
    }),
    []
  )
  const ringUniforms = useMemo(
    () => ({
      uHot: { value: new THREE.Color('#fff0cf') },
      uWarm: { value: new THREE.Color('#ffae6e') },
      uInner: { value: coreRadius * 3.0 },
      uOuter: { value: coreRadius * 7.5 },
    }),
    [coreRadius]
  )

  // ~12 minutes per rotation: alive, never busy. The nucleus stays
  // camera-facing so its glow reads the same from any angle.
  useFrame((state, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.008
    if (coreGlow.current) coreGlow.current.quaternion.copy(state.camera.quaternion)
  })

  const nucleusSize = coreRadius * 6

  return (
    <group position={center}>
      {/* the spinning disk of stars */}
      <group ref={group}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
            <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
          </bufferGeometry>
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            transparent
          />
        </points>
      </group>

      {/* Galactic nucleus — a soft, blooming glow (camera-facing billboard). */}
      <mesh ref={coreGlow} renderOrder={2}>
        <planeGeometry args={[nucleusSize, nucleusSize]} />
        <shaderMaterial
          uniforms={coreUniforms}
          vertexShader={coreVert}
          fragmentShader={coreFrag}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          transparent
          toneMapped={false}
        />
      </mesh>

      {/* Accretion ring in the disk plane — the black-hole read. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <ringGeometry args={[ringUniforms.uInner.value, ringUniforms.uOuter.value, 180]} />
        <shaderMaterial
          uniforms={ringUniforms}
          vertexShader={ringVert}
          fragmentShader={ringFrag}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          transparent
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
