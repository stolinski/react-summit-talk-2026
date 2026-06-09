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
 *
 * `variant` swaps the SURFACE STYLE so each world reads differently (all static
 * — no per-frame noise, so no flicker):
 *   terran   continents + ocean + clouds (the default / home base)
 *   ocean    mostly sea, strong specular glint, a few islands
 *   gas      swirling latitude bands + a storm spot, no ocean (smooth)
 *   cratered rugged rocky/dead-moon look, no ocean, no clouds
 *   ice      high albedo, polar caps, faint sea, cool specular
 *   molten   dark crust with lava basins that GLOW on the night side (emissive)
 * Optional `rings` (tilted banded ring system) and `moon` (slow orbiting body)
 * are silhouette-level differentiators — visible even when a card covers the
 * planet's center.
 */
const VARIANT = { terran: 0, ocean: 1, gas: 2, cratered: 3, ice: 4, molten: 5 }
const NO_CLOUDS = new Set(['gas', 'cratered', 'molten'])

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
  uniform int uVariant;
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

    // --- per-variant surface: base color, ocean mask, specular, emissive ---
    vec3 base;
    float ocean = 0.0;
    float specMul = uSpecular;
    vec3 emissive = vec3(0.0);

    if (uVariant == 2) {            // GAS GIANT — swirling latitude bands
      float warp = fbm(dir * uFreq * 0.7) * 0.25;
      float bands = sin((dir.y + warp) * 16.0);
      float tb = bands * 0.5 + 0.5;
      base = mix(uColorDeep, uColor, smoothstep(0.15, 0.85, tb));
      base = mix(base, uAtmo, smoothstep(0.82, 1.0, tb) * 0.6);
      float spot = smoothstep(0.16, 0.0, distance(dir, normalize(vec3(0.55, -0.3, 0.78))));
      base = mix(base, mix(uColor, uAtmo, 0.5) * 1.2, spot * 0.8);
      base *= (0.9 + 0.2 * detail);
      n = normalize(geoN - grad * 0.12);  // gaseous, near-smooth
      specMul = 0.0;
    } else if (uVariant == 3) {     // CRATERED ROCK — rugged dead world
      base = mix(uColorDeep, uColor, smoothstep(-0.5, 0.55, e));
      base *= (0.62 + 0.62 * detail);
      n = normalize(geoN - grad * 1.0 - fgrad * 0.25);
      specMul = uSpecular * 0.1;
    } else if (uVariant == 4) {     // ICE — bright, polar caps, cool glint
      vec3 ice = mix(uColor, vec3(0.9, 0.96, 1.0), 0.55);
      base = mix(uColorDeep, ice, smoothstep(-0.4, 0.5, e));
      float caps = smoothstep(0.62, 0.86, abs(dir.y));
      base = mix(base, vec3(0.95, 0.99, 1.0), caps);
      base *= (0.85 + 0.25 * detail);
      ocean = smoothstep(0.02, -0.22, e);
      specMul = uSpecular * 0.9;
    } else if (uVariant == 5) {     // MOLTEN — lava basins glow on night side
      vec3 crust = uColorDeep * 0.55;
      float lava = smoothstep(0.02, -0.28, e);
      vec3 ember = mix(uColor, uAtmo, 0.35);
      base = mix(crust, ember, lava);
      base *= (0.8 + 0.3 * detail);
      emissive = ember * lava * 1.6;    // self-lit — visible on the dark side
      n = normalize(geoN - grad * 0.7 - fgrad * 0.15);
      specMul = uSpecular * 0.15;
    } else if (uVariant == 1) {     // OCEAN — mostly sea, big specular
      base = mix(uColorDeep, uColor, smoothstep(-0.15, 0.65, e));
      base *= (0.85 + 0.25 * detail);
      ocean = smoothstep(0.28, -0.05, e);
      specMul = uSpecular * 1.7;
    } else {                        // TERRAN (0) — continents + ocean
      base = mix(uColorDeep, uColor, smoothstep(-0.4, 0.5, e));
      base *= (0.8 + 0.35 * detail);
      ocean = smoothstep(0.08, -0.18, e);
    }

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
    float spec = pow(max(dot(n, H), 0.0), mix(14.0, 60.0, ocean));
    spec *= specMul * mix(0.2, 1.0, ocean) * smoothstep(0.0, 0.18, NdotL);
    lit += sun * spec;

    // Molten worlds keep glowing where the sun doesn't reach.
    lit += emissive;

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

// Ring system — a flat annulus laid in the planet's equatorial plane (tilted
// with the planet's axis). Radial banding + a Cassini-style gap, fading at the
// inner/outer edges, dimmer on the night side. Lit softly; bloom does the rest.
const ringVert = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalW;
  void main() {
    vLocal = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFrag = /* glsl */ `
  uniform float uInner;
  uniform float uOuter;
  uniform vec3 uColor;
  uniform vec3 uAtmo;
  uniform vec3 uLightDir;
  varying vec3 vLocal;
  varying vec3 vNormalW;
  void main() {
    float r = length(vLocal.xy);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);

    // layered banding
    float bands = 0.55 + 0.45 * sin(t * 70.0);
    bands *= 0.6 + 0.4 * sin(t * 23.0 + 1.3);
    // a dark division ~62% out
    float gap = smoothstep(0.025, 0.0, abs(t - 0.62));
    bands *= 1.0 - 0.85 * gap;
    // fade the inner + outer edges so they don't hard-cut
    float edge = smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.9, t);

    // soft self-shadow: dimmer on the side facing away from the sun
    vec3 n = normalize(vNormalW);
    float lightish = 0.55 + 0.45 * clamp(abs(dot(n, normalize(uLightDir))) + 0.3, 0.0, 1.0);

    vec3 col = mix(uColor, uAtmo, t * 0.6 + 0.2);
    float alpha = bands * edge * 0.55 * lightish;
    gl_FragColor = vec4(col, alpha);
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
  variant = 'terran',
  tilt = 0,
  clouds,
  rings,
  moon,
}) {
  const surface = useRef()
  const cloudsRef = useRef()
  const moonOrbit = useRef()

  const lightDir = useMemo(
    () =>
      new THREE.Vector3(...SUN_POSITION)
        .sub(new THREE.Vector3(...position))
        .normalize(),
    [position]
  )

  const vId = VARIANT[variant] ?? 0
  const showClouds = clouds ?? !NO_CLOUDS.has(variant)

  const surfaceUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uColorDeep: { value: new THREE.Color(colorDeep ?? color).multiplyScalar(0.35) },
      uAtmo: { value: new THREE.Color(atmosphere ?? color) },
      uLightDir: { value: lightDir },
      uFreq: { value: freq },
      uSpecular: { value: specular },
      uVariant: { value: vId },
    }),
    [lightDir, color, colorDeep, atmosphere, freq, specular, vId]
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

  // --- rings ---
  const ringCfg = useMemo(() => {
    if (!rings) return null
    const r = rings === true ? {} : rings
    const inner = (r.inner ?? 1.4) * radius
    const outer = (r.outer ?? 2.4) * radius
    return { inner, outer }
  }, [rings, radius])

  const ringUniforms = useMemo(() => {
    if (!ringCfg) return null
    return {
      uInner: { value: ringCfg.inner },
      uOuter: { value: ringCfg.outer },
      uColor: { value: new THREE.Color(color) },
      uAtmo: { value: new THREE.Color(atmosphere ?? color) },
      uLightDir: { value: lightDir },
    }
  }, [ringCfg, color, atmosphere, lightDir])

  // --- moon ---
  const moonCfg = useMemo(() => {
    if (!moon) return null
    const m = moon === true ? {} : moon
    return {
      dist: (m.dist ?? 2.8) * radius,
      radius: (m.radius ?? 0.28) * radius,
      speed: m.speed ?? 0.15,
      tilt: m.tilt ?? 0.5,
      color: m.color ?? '#cbd0d6',
      colorDeep: m.colorDeep ?? '#3b3f46',
    }
  }, [moon, radius])

  const moonUniforms = useMemo(() => {
    if (!moonCfg) return null
    return {
      uColor: { value: new THREE.Color(moonCfg.color) },
      uColorDeep: { value: new THREE.Color(moonCfg.colorDeep).multiplyScalar(0.35) },
      uAtmo: { value: new THREE.Color(moonCfg.color) },
      uLightDir: { value: lightDir },
      uFreq: { value: 4.0 },
      uSpecular: { value: 0.12 },
      uVariant: { value: VARIANT.cratered },
    }
  }, [moonCfg, lightDir])

  useFrame((_, dt) => {
    if (surface.current) surface.current.rotation.y += dt * spin
    // clouds drift a touch faster than the surface → subtle parallax
    if (cloudsRef.current) cloudsRef.current.rotation.y += dt * spin * 1.35
    if (moonOrbit.current) moonOrbit.current.rotation.y += dt * (moonCfg?.speed ?? 0)
  })

  return (
    <group position={position}>
      {/* axial tilt: surface, clouds, atmosphere + rings all share the axis */}
      <group rotation={[tilt * 0.6, 0, tilt]}>
        <mesh ref={surface}>
          <sphereGeometry args={[radius, 128, 128]} />
          <shaderMaterial vertexShader={surfaceVert} fragmentShader={surfaceFrag} uniforms={surfaceUniforms} />
        </mesh>

        {showClouds && (
          <mesh ref={cloudsRef} scale={1.02}>
            <sphereGeometry args={[radius, 96, 96]} />
            <shaderMaterial
              vertexShader={surfaceVert}
              fragmentShader={cloudFrag}
              uniforms={cloudUniforms}
              transparent
              depthWrite={false}
            />
          </mesh>
        )}

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

        {ringCfg && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ringCfg.inner, ringCfg.outer, 160]} />
            <shaderMaterial
              vertexShader={ringVert}
              fragmentShader={ringFrag}
              uniforms={ringUniforms}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* moon orbits outside the axial tilt, on its own tilted plane */}
      {moonCfg && (
        <group rotation={[moonCfg.tilt, 0, 0]}>
          <group ref={moonOrbit}>
            <mesh position={[moonCfg.dist, 0, 0]}>
              <sphereGeometry args={[moonCfg.radius, 48, 48]} />
              <shaderMaterial vertexShader={surfaceVert} fragmentShader={surfaceFrag} uniforms={moonUniforms} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  )
}
