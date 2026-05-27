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

export function Galaxy({
  center = [0, 0, 0],
  count = 150000,
  radius = 6000,
  branches = 5,
  spinTurns = 1.25,
  insideColor = '#ffe2b0',
  outsideColor = '#3457d6',
}) {
  const group = useRef()

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

  const uniforms = useMemo(() => ({ uSize: { value: 230 } }), [])

  // ~12 minutes per rotation: alive, never busy.
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.008
  })

  return (
    <group ref={group} position={center}>
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

      {/* Glowing galactic core. */}
      <mesh>
        <sphereGeometry args={[180, 32, 32]} />
        <meshBasicMaterial color="#fff0cf" toneMapped={false} />
      </mesh>
    </group>
  )
}
