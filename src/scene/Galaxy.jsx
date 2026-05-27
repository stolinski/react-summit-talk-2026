import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A procedural spiral galaxy — "the web." The points are STATIC (no per-point
 * differential spin — that was the cause of the constant scintillation/flicker).
 * The whole disk drifts almost imperceptibly slowly so it feels alive but never
 * busy. Each point is a soft glowing disc, not a hard 1/d spike, so nothing
 * twinkles when the camera moves.
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

    // sqrt attenuation: points stay visible from a planet close-up all the way
    // out to the full-galaxy reveal, without exploding up close.
    gl_PointSize = uSize * aScale * (1.0 / sqrt(-viewPosition.z));
    vColor = aColor;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    // Soft gaussian-ish disc. No hot center spike => no twinkle.
    float d = distance(gl_PointCoord, vec2(0.5));
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.5);
    gl_FragColor = vec4(vColor, a);
  }
`

export function Galaxy({
  count = 120000,
  radius = 240,
  branches = 5,
  spin = 0.9,
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
      const r = Math.pow(Math.random(), 2.0) * radius // dense core
      const branchAngle = ((i % branches) / branches) * Math.PI * 2
      const spinAngle = r * spin * 0.012

      const spread = 0.16
      const rand = () =>
        Math.pow(Math.random(), 2.8) * (Math.random() < 0.5 ? 1 : -1) * spread * r

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + rand()
      positions[i3 + 1] = rand() * 0.32 // flatten the disk
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + rand()

      const mixed = cInside.clone().lerp(cOutside, Math.pow(r / radius, 0.6))
      colors[i3] = mixed.r
      colors[i3 + 1] = mixed.g
      colors[i3 + 2] = mixed.b

      scales[i] = Math.random() * 1.0 + 0.5
    }
    return [positions, colors, scales]
  }, [count, radius, branches, spin, insideColor, outsideColor])

  const uniforms = useMemo(() => ({ uSize: { value: 34 } }), [])

  // Barely-perceptible drift — full rotation takes ~10 minutes. Alive, not busy.
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.01
  })

  return (
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
  )
}
