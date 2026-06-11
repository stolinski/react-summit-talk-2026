import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The jaw-drop: a live HTML-in-canvas texture, then the GPU. The card renders as
 * a crisp plane and, as `dissolve` (0→1) rises, a burn front sweeps across it —
 * the plane ERODES pixel by pixel (a shader discards burned texels) and exactly
 * where it vanishes a star is born: points sample the texture for color and fly
 * outward into space, reforming when dissolve falls back. The plane and the
 * points share ONE spatial burn threshold, so it reads as a real disintegration,
 * not a cross-fade. Once your component is a texture, the whole GPU is available.
 *
 * `dissolveRef` / `opacityRef` are refs the parent updates each frame (a slider
 * on the flat slide, an auto-breathe loop in the 3D scene) so driving the effect
 * never re-renders React. Points are additive + small so bloom makes them stars.
 */

// Shared burn field: returns the dissolve value at which a given uv ignites — a
// directional sweep plus per-cell jitter, so the edge is organic, not a wipe.
// Cells are aligned 1:1 to the points grid (uCells = cols×rows), so each dying
// chunk of the plane corresponds to exactly one star.
const burnGLSL = /* glsl */ `
  uniform vec2 uCells;
  float hash12(vec2 p){
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float burnThreshold(vec2 uv){
    // a directional sweep (reads as a dissolve front) with heavy per-cell jitter
    // so neighbours don't all ignite at once and clump into bright blobs
    float sweep = uv.x * 0.38 + (1.0 - uv.y) * 0.16;
    float n = hash12(floor(uv * uCells));
    return 0.05 + sweep * 0.42 + n * 0.5;
  }
`

const planeVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const planeFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform float uDissolve;
  uniform float uOpacity;
  varying vec2 vUv;
  ${burnGLSL}
  void main() {
    vec4 t = texture2D(uMap, vUv);
    float thr = burnThreshold(vUv);
    float burned = smoothstep(thr, thr + 0.035, uDissolve);
    // each cell flashes white-hot just before it goes — the pixel IGNITES into
    // the star born at the same spot (>1 color so bloom catches the flash)
    float ember = smoothstep(thr - 0.05, thr + 0.01, uDissolve) * (1.0 - burned);
    vec3 col = t.rgb + ember * (t.rgb * 2.2 + vec3(0.55, 0.55, 0.7));
    float a = t.a * (1.0 - burned) * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`

const pointsVert = /* glsl */ `
  attribute vec2 aUv;
  attribute vec3 aRand;
  attribute float aSeed;
  uniform sampler2D uMap;
  uniform float uDissolve;
  uniform float uW;
  uniform float uH;
  uniform float uSpread;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uTime;
  varying vec3 vColor;
  varying float vBurn;
  ${burnGLSL}

  void main() {
    vec4 tex = texture2D(uMap, aUv);
    // stars must be luminous even where the card is dark — lift dim texels
    // toward their own hue so EVERY pixel becomes a visible star, not just the
    // bright text/accent ones (near-black additive points are invisible)
    float lum = max(dot(tex.rgb, vec3(0.299, 0.587, 0.114)), 1e-3);
    vec3 starCol = tex.rgb * clamp(0.4 / lum, 1.0, 3.0);
    vec3 flatPos = vec3((aUv.x - 0.5) * uW, (aUv.y - 0.5) * uH, 0.0);

    // SAME burn field as the plane. born matches the plane's burn band, so the
    // star hits full brightness IN PLACE in the same instant its texel dies —
    // the pixel visibly TURNS INTO the star. Only then does fly carry it off.
    float thr = burnThreshold(aUv);
    float born = smoothstep(thr, thr + 0.035, uDissolve);
    float local = smoothstep(thr, thr + 0.30, uDissolve);
    // leave almost immediately after birth — lingering born stars stack up
    // additively at the plane and white out the whole card
    float fly = smoothstep(0.04, 1.0, local);
    // white-hot flash at birth that cools as the star leaves
    float hot = born * (1.0 - smoothstep(0.06, 0.3, local));
    vBurn = born;
    vColor = mix(starCol, vec3(1.35, 1.28, 1.15), hot * 0.7);

    // swirl around the card center as it lifts off, then scatter hard into depth
    float r = length(flatPos.xy);
    float ang = fly * (1.0 + r * 0.12) * (0.5 + aSeed * 0.9);
    float s = sin(ang), c = cos(ang);
    vec2 sw = vec2(flatPos.x * c - flatPos.y * s, flatPos.x * s + flatPos.y * c);
    vec3 pos = vec3(sw * (1.0 + fly * 1.9), flatPos.z);
    vec3 drift = aRand;
    drift.z += 0.55; // bias toward the camera so the burst reads in 3D
    drift.x += 0.25 * sin(uTime * 0.6 + aSeed * 9.0);
    drift.y += 0.25 * cos(uTime * 0.5 + aSeed * 7.0);
    pos += drift * fly * uSpread;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float vis = step(0.12, tex.a) * step(0.001, born);
    float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + aSeed * 30.0);
    float size = uSize * (0.85 + hot * 1.5 + fly * 1.1) * twinkle * vis;
    gl_PointSize = size * uPixelRatio * (11.0 / max(-mv.z, 0.1));
    if (vis < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`
const pointsFrag = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  uniform float uIntensity;
  varying vec3 vColor;
  varying float vBurn;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float dd = dot(q, q);
    if (dd > 0.25) discard;
    float soft = smoothstep(0.25, 0.0, dd);
    gl_FragColor = vec4(vColor, soft * uOpacity * uIntensity * vBurn);
  }
`

export function DissolveCard({
  texture,
  width,
  height,
  cols = 200,
  rows = 125,
  spread = 14,
  size = 2.4,
  intensity = 0.95,
  dissolveRef,
  opacityRef,
}) {
  const { gl } = useThree()

  const geometry = useMemo(() => {
    const n = cols * rows
    const position = new Float32Array(n * 3)
    const aUv = new Float32Array(n * 2)
    const aRand = new Float32Array(n * 3)
    const aSeed = new Float32Array(n)
    let p = 0
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const u = (i + 0.5) / cols
        const v = (j + 0.5) / rows
        position[p * 3] = (u - 0.5) * width
        position[p * 3 + 1] = (v - 0.5) * height
        position[p * 3 + 2] = 0
        aUv[p * 2] = u
        aUv[p * 2 + 1] = v
        aRand[p * 3] = (Math.random() * 2 - 1) * 1.2
        aRand[p * 3 + 1] = (Math.random() * 2 - 1) * 1.2
        aRand[p * 3 + 2] = (Math.random() * 2 - 1) * 0.9
        aSeed[p] = Math.random()
        p++
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
    g.setAttribute('aUv', new THREE.Float32BufferAttribute(aUv, 2))
    g.setAttribute('aRand', new THREE.Float32BufferAttribute(aRand, 3))
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(aSeed, 1))
    return g
  }, [cols, rows, width, height])

  const planeUniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uDissolve: { value: 0 },
      uOpacity: { value: 1 },
      uCells: { value: new THREE.Vector2(cols, rows) },
    }),
    [texture, cols, rows]
  )

  const pointsUniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uDissolve: { value: 0 },
      uCells: { value: new THREE.Vector2(cols, rows) },
      uW: { value: width },
      uH: { value: height },
      uSpread: { value: spread },
      uSize: { value: size },
      uPixelRatio: { value: Math.min(gl.getPixelRatio?.() ?? 1, 2) },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uIntensity: { value: intensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texture, width, height, spread, size, intensity, cols, rows]
  )

  useFrame((_, dt) => {
    const d = dissolveRef?.current ?? 0
    const o = opacityRef?.current ?? 1
    planeUniforms.uDissolve.value = d
    planeUniforms.uOpacity.value = o
    pointsUniforms.uDissolve.value = d
    pointsUniforms.uOpacity.value = o
    pointsUniforms.uTime.value += dt
  })

  return (
    <group>
      <mesh frustumCulled={false}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          vertexShader={planeVert}
          fragmentShader={planeFrag}
          uniforms={planeUniforms}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          vertexShader={pointsVert}
          fragmentShader={pointsFrag}
          uniforms={pointsUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
