import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { snoise } from '../shaders/snoise.js'

/**
 * A planet that looks like a planet:
 *  - surface: fbm-noise continents/bands, lit from the galaxy core (so the
 *    terminator faces the bright center), with a fresnel sheen at the limb
 *  - atmosphere: a slightly larger additive shell that glows only at the rim
 *    — the trick that sells "this is a real world," amplified by bloom.
 */
const surfaceVert = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vPos;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vPos = position;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const surfaceFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColorDeep;
  uniform vec3 uAtmo;
  uniform vec3 uLightDir;
  uniform float uFreq;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vPos;
  ${snoise}
  void main() {
    vec3 n = normalize(vNormalW);

    float elevation = fbm(normalize(vPos) * uFreq);
    vec3 base = mix(uColorDeep, uColor, smoothstep(-0.35, 0.55, elevation));

    float diff = clamp(dot(n, normalize(uLightDir)), 0.0, 1.0);
    float ambient = 0.22;
    vec3 lit = base * (ambient + diff * 1.15);

    // Fresnel limb -> blends into the atmosphere color.
    float fres = pow(1.0 - max(dot(n, vViewDir), 0.0), 3.0);
    lit += uAtmo * fres * 0.85;

    gl_FragColor = vec4(lit, 1.0);
  }
`

const atmoFrag = /* glsl */ `
  uniform vec3 uAtmo;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 3.5);
    gl_FragColor = vec4(uAtmo * 0.7, fres);
  }
`

export function Planet({
  position = [0, 0, 0],
  radius = 4,
  color = '#3b82f6',
  colorDeep,
  atmosphere,
  label,
  freq = 2.4,
  spin = 0.012,
}) {
  const surface = useRef()

  const surfaceUniforms = useMemo(() => {
    // Lit from the galaxy core at the origin.
    const lightDir = new THREE.Vector3(...position).multiplyScalar(-1).normalize()
    return {
      uColor: { value: new THREE.Color(color) },
      uColorDeep: { value: new THREE.Color(colorDeep ?? color).multiplyScalar(0.35) },
      uAtmo: { value: new THREE.Color(atmosphere ?? color) },
      uLightDir: { value: lightDir },
      uFreq: { value: freq },
    }
  }, [position, color, colorDeep, atmosphere, freq])

  const atmoUniforms = useMemo(
    () => ({ uAtmo: { value: new THREE.Color(atmosphere ?? color) } }),
    [atmosphere, color]
  )

  useFrame((_, dt) => {
    if (surface.current) surface.current.rotation.y += dt * spin
  })

  return (
    <group position={position}>
      <mesh ref={surface}>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial vertexShader={surfaceVert} fragmentShader={surfaceFrag} uniforms={surfaceUniforms} />
      </mesh>

      <mesh scale={1.22}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={surfaceVert}
          fragmentShader={atmoFrag}
          uniforms={atmoUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {label && (
        <Text
          position={[0, radius * 1.7, 0]}
          fontSize={radius * 0.42}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={radius * 0.012}
          outlineColor="#02030a"
        >
          {label}
        </Text>
      )}
    </group>
  )
}
