import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { snoise } from '../shaders/snoise.js'
import { SUN_POSITION } from './layout.js'

/**
 * A planet that looks like a planet:
 *  - surface: fbm continents + a finer detail octave for texture, with the
 *    normal perturbed by the noise gradient (bump mapping) so the terminator
 *    and surface catch the sunlight with real relief
 *  - atmosphere: a THIN shell (1.05x) with a high-power fresnel, so it's a
 *    crisp limb halo, not a fat glowing circle
 *  Lit from the sun at the system center.
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
    vec3 dir = normalize(vPos);
    float e = fbm(dir * uFreq);

    // Bump mapping: perturb the normal by the noise gradient for real relief.
    float eps = 0.02;
    vec3 t1 = normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + vec3(0.0001));
    vec3 t2 = cross(dir, t1);
    float e1 = fbm((dir + t1 * eps) * uFreq);
    float e2 = fbm((dir + t2 * eps) * uFreq);
    vec3 grad = (t1 * (e1 - e) + t2 * (e2 - e)) / eps;
    vec3 n = normalize(normalize(vNormalW) - grad * 0.45);

    // Fine mottling so the surface reads as textured, not flat paint.
    float detail = fbm(dir * uFreq * 4.0) * 0.5 + 0.5;

    vec3 base = mix(uColorDeep, uColor, smoothstep(-0.4, 0.5, e));
    base *= (0.8 + 0.35 * detail);

    float diff = clamp(dot(n, normalize(uLightDir)), 0.0, 1.0);
    float ambient = 0.16;
    vec3 lit = base * (ambient + diff * 1.25);

    // Subtle limb light tinted by the atmosphere.
    float fres = pow(1.0 - max(dot(normalize(vNormalW), vViewDir), 0.0), 4.0);
    lit += uAtmo * fres * 0.35;

    gl_FragColor = vec4(lit, 1.0);
  }
`

const atmoFrag = /* glsl */ `
  uniform vec3 uAtmo;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    // High-power fresnel => energy concentrated right at the limb (a thin rim),
    // so it's an atmosphere, not a filled disc.
    float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 5.0);
    gl_FragColor = vec4(uAtmo, fres * 0.55);
  }
`

export function Planet({
  position = [0, 0, 0],
  radius = 3,
  color = '#3b82f6',
  colorDeep,
  atmosphere,
  freq = 2.4,
  spin = 0.01,
}) {
  const surface = useRef()

  const surfaceUniforms = useMemo(() => {
    const lightDir = new THREE.Vector3(...SUN_POSITION)
      .sub(new THREE.Vector3(...position))
      .normalize()
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

      <mesh scale={1.05}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={surfaceVert}
          fragmentShader={atmoFrag}
          uniforms={atmoUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
