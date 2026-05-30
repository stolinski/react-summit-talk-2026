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
  uniform float uSpecular;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vPos;
  ${snoise}
  void main() {
    vec3 dir = normalize(vPos);
    float e = fbm(dir * uFreq);

    // --- Bump mapping at two scales for real relief + crisp detail ---
    vec3 t1 = normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + vec3(0.0001));
    vec3 t2 = cross(dir, t1);

    float eps = 0.02;
    float e1 = fbm((dir + t1 * eps) * uFreq);
    float e2 = fbm((dir + t2 * eps) * uFreq);
    vec3 grad = (t1 * (e1 - e) + t2 * (e2 - e)) / eps;

    float fEps = 0.006;
    float f0 = fbm(dir * uFreq * 5.0);
    float f1 = fbm((dir + t1 * fEps) * uFreq * 5.0);
    float f2 = fbm((dir + t2 * fEps) * uFreq * 5.0);
    vec3 fgrad = (t1 * (f1 - f0) + t2 * (f2 - f0)) / fEps;

    vec3 geoN = normalize(vNormalW);
    vec3 n = normalize(geoN - grad * 0.6 - fgrad * 0.12);

    float detail = f0 * 0.5 + 0.5;
    vec3 base = mix(uColorDeep, uColor, smoothstep(-0.4, 0.5, e));
    base *= (0.8 + 0.35 * detail);

    vec3 L = normalize(uLightDir);
    vec3 V = normalize(vViewDir);
    vec3 H = normalize(L + V);
    vec3 sun = vec3(1.0, 0.94, 0.84); // warm sunlight

    // Half-Lambert: soft, wrapped day/night terminator instead of a hard line.
    float NdotL = dot(n, L);
    float diff = clamp((NdotL + 0.3) / 1.3, 0.0, 1.0);
    diff *= diff;

    // Dark, cool night fill (contrast = depth) with a hint of atmosphere bounce.
    vec3 ambient = uColorDeep * 0.18 + uAtmo * 0.05;
    vec3 lit = base * (ambient + sun * diff * 1.35);

    // Specular glint — broad on land, tight/strong on low "ocean" areas, lit side only.
    float ocean = smoothstep(0.08, -0.18, e);
    float spec = pow(max(dot(n, H), 0.0), mix(14.0, 60.0, ocean));
    spec *= uSpecular * mix(0.2, 1.0, ocean) * smoothstep(0.0, 0.18, NdotL);
    lit += sun * spec;

    // Atmospheric forward-scatter: a bright crescent on the sunlit limb.
    float limb = pow(1.0 - max(dot(geoN, V), 0.0), 3.0);
    float sunFacing = smoothstep(-0.25, 0.65, dot(geoN, L));
    lit += uAtmo * limb * sunFacing * 1.7;

    gl_FragColor = vec4(lit, 1.0);
  }
`

const atmoFrag = /* glsl */ `
  uniform vec3 uAtmo;
  uniform vec3 uLightDir;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    // High-power fresnel => energy concentrated right at the limb (a thin rim),
    // so it's an atmosphere, not a filled disc.
    vec3 n = normalize(vNormalW);
    float fres = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 5.0);
    // Forward scatter: the rim glows much brighter where the limb faces the sun
    // and fades into the night side — a real day/night atmosphere, not a ring.
    float sunFacing = smoothstep(-0.35, 0.7, dot(n, normalize(uLightDir)));
    gl_FragColor = vec4(uAtmo, fres * mix(0.18, 0.95, sunFacing));
  }
`

// A slow cloud deck — patchy fbm, lit by the same sun, fading on the night
// side. It rotates a touch faster than the surface for a parallax that reads as
// a living planet. (Mesh rotation only — no per-frame noise churn → no flicker.)
const cloudFrag = /* glsl */ `
  uniform vec3 uAtmo;
  uniform vec3 uLightDir;
  uniform float uFreq;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vPos;
  ${snoise}
  void main() {
    vec3 dir = normalize(vPos);
    // broad masses + finer wisps
    float c = fbm(dir * uFreq * 1.5) + 0.5 * fbm(dir * uFreq * 3.6);
    c /= 1.5;
    float cover = smoothstep(0.18, 0.62, c);
    if (cover < 0.002) discard;

    vec3 n = normalize(vNormalW);
    float NdotL = dot(n, normalize(uLightDir));
    float day = clamp((NdotL + 0.25) / 1.25, 0.0, 1.0);
    day *= day;

    vec3 col = mix(uAtmo * 0.35, vec3(1.0, 0.98, 0.94), day);
    // soften the silhouette edge so clouds don't hard-cut the limb
    float edge = smoothstep(0.0, 0.35, max(dot(n, normalize(vViewDir)), 0.0));
    float alpha = cover * (0.12 + 0.88 * day) * edge;
    gl_FragColor = vec4(col, alpha * 0.85);
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
  specular = 0.6,
}) {
  const surface = useRef()
  const clouds = useRef()

  const lightDir = useMemo(
    () =>
      new THREE.Vector3(...SUN_POSITION)
        .sub(new THREE.Vector3(...position))
        .normalize(),
    [position]
  )

  const surfaceUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uColorDeep: { value: new THREE.Color(colorDeep ?? color).multiplyScalar(0.35) },
      uAtmo: { value: new THREE.Color(atmosphere ?? color) },
      uLightDir: { value: lightDir },
      uFreq: { value: freq },
      uSpecular: { value: specular },
    }),
    [lightDir, color, colorDeep, atmosphere, freq, specular]
  )

  const atmoUniforms = useMemo(
    () => ({
      uAtmo: { value: new THREE.Color(atmosphere ?? color) },
      uLightDir: { value: lightDir },
    }),
    [lightDir, atmosphere, color]
  )

  const cloudUniforms = useMemo(
    () => ({
      uAtmo: { value: new THREE.Color(atmosphere ?? color) },
      uLightDir: { value: lightDir },
      uFreq: { value: freq },
    }),
    [lightDir, atmosphere, color, freq]
  )

  useFrame((_, dt) => {
    if (surface.current) surface.current.rotation.y += dt * spin
    // clouds drift a touch faster than the surface → subtle parallax
    if (clouds.current) clouds.current.rotation.y += dt * spin * 1.35
  })

  return (
    <group position={position}>
      <mesh ref={surface}>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial vertexShader={surfaceVert} fragmentShader={surfaceFrag} uniforms={surfaceUniforms} />
      </mesh>

      <mesh ref={clouds} scale={1.02}>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial
          vertexShader={surfaceVert}
          fragmentShader={cloudFrag}
          uniforms={cloudUniforms}
          transparent
          depthWrite={false}
        />
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
