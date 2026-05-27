import { useMemo } from 'react'
import * as THREE from 'three'
import { snoise } from '../shaders/snoise.js'

/**
 * A giant inside-out sphere painted with soft fbm cloud patches. This replaces
 * flat black space with quiet color and depth — the difference between "cheap"
 * and "cinematic." Completely static, so it adds zero motion.
 */
const vert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uGlowA;
  uniform vec3 uGlowB;
  varying vec3 vDir;
  ${snoise}
  void main() {
    vec3 d = normalize(vDir);
    float n = fbm(d * 1.6);
    float m = fbm(d * 3.2 + 7.0);
    float cloudsA = smoothstep(0.05, 0.7, n);
    float cloudsB = smoothstep(0.15, 0.8, m);

    vec3 col = uDeep;
    col = mix(col, uGlowA, cloudsA * 0.6);
    col = mix(col, uGlowB, cloudsB * 0.35);

    gl_FragColor = vec4(col, 1.0);
  }
`

export function Nebula() {
  const uniforms = useMemo(
    () => ({
      uDeep: { value: new THREE.Color('#04050d') },
      uGlowA: { value: new THREE.Color('#10183f') }, // deep indigo
      uGlowB: { value: new THREE.Color('#2a1340') }, // faint violet
    }),
    []
  )

  return (
    <mesh scale={250000}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
