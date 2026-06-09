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
const burnGLSL = /* glsl */ `
  float hash12(vec2 p){
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float burnThreshold(vec2 uv){
    // a directional sweep (reads as a dissolve front) with heavy per-cell jitter
    // so neighbours don't all ignite at once and clump into bright blobs
    float sweep = uv.x * 0.38 + (1.0 - uv.y) * 0.16;
    float n = hash12(floor(uv * 130.0));
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
    float burned = smoothstep(thr, thr + 0.04, uDissolve);
    float a = t.a * (1.0 - burned) * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(t.rgb, a);
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
    vColor = tex.rgb;
    vec3 flatPos = vec3((aUv.x - 0.5) * uW, (aUv.y - 0.5) * uH, 0.0);

    // SAME burn field as the plane → a star is born exactly where a texel dies
    float thr = burnThreshold(aUv);
    // narrow ignition band → each star lights and LEAVES fast, so few are ever
    // lit-and-clustered at once (that clumping is what bloomed into blobs)
    float local = smoothstep(thr, thr + 0.12, uDissolve);
    vBurn = local;

    // swirl around the card center as it lifts off, then scatter hard into depth
    float r = length(flatPos.xy);
    float ang = local * (1.0 + r * 0.12) * (0.5 + aSeed * 0.9);
    float s = sin(ang), c = cos(ang);
    vec2 sw = vec2(flatPos.x * c - flatPos.y * s, flatPos.x * s + flatPos.y * c);
    vec3 pos = vec3(sw * (1.0 + local * 1.9), flatPos.z);
    vec3 drift = aRand;
    drift.z += 0.55; // bias toward the camera so the burst reads in 3D
    drift.x += 0.25 * sin(uTime * 0.6 + aSeed * 9.0);
    drift.y += 0.25 * cos(uTime * 0.5 + aSeed * 7.0);
    pos += drift * local * uSpread;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float vis = step(0.12, tex.a) * step(0.001, local);
    float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + aSeed * 30.0);
    float size = uSize * (0.8 + local * 1.3) * twinkle * vis;
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
    gl_FragColor = vec4(vColor * 1.3, soft * uOpacity * uIntensity * vBurn);
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
    }),
    [texture]
  )

  const pointsUniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uDissolve: { value: 0 },
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
    [texture, width, height, spread, size, intensity]
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
