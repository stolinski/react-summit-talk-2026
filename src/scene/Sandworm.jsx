import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { snoise } from '../shaders/snoise.js'

/**
 * A Shai-Hulud that ORBITS the React planet and burrows in and out of it during
 * the supply-chain beat ("deps burrowing through your project").
 *
 * The geometry is a straight canonical worm (per-vertex: length param `aU`, ring
 * offset `aOff`, angle `aTheta`); the VERTEX SHADER bends it onto an animated
 * path that spirals around the planet at an oscillating radius — so it weaves
 * above and below the surface (the opaque planet occludes the buried stretches)
 * and SWIMS forward over time (head leads, body follows). The FRAGMENT SHADER
 * gives it life: fbm bump relief + geometric ring-plate shading + specular +
 * rim, so it reads as a textured, segmented creature, not a flat tube. It has a
 * tapered tail and a flared, toothed maw on the leading end (dark gullet). It
 * rises out as `show` ramps (uAmp grows the breach + radius from inside).
 */
const T = 260 // length samples
const RING = 110 // cross-section resolution (high → smooth tube + cleanly-sampled teeth)
const RIDGE_FREQ = 26 // geometric ring segments (armor bands)
const TEETH = 28 // fangs per row around the maw (well below RING so they never alias)

function buildWorm(R) {
  // Radial profile along the body (u: 0 = tail tip, 1 = mouth). A heavy, even
  // body swells into a broad rounded lip, then the throat folds back to a dark
  // point — no thin neck, no trumpet. The lip is wide so the maw reads as a big
  // open mouth, the way a Shai-Hulud should.
  const profile = (u) => {
    let r
    if (u < 0.05) r = THREE.MathUtils.lerp(0.0, 0.26, THREE.MathUtils.smootherstep(u, 0.0, 0.05)) // tail tip
    else if (u < 0.64) r = THREE.MathUtils.lerp(0.26, 0.3, THREE.MathUtils.smootherstep(u, 0.05, 0.64)) // body, gently thickening toward the head
    else if (u < 0.86)
      r = THREE.MathUtils.lerp(0.3, 0.46, THREE.MathUtils.smootherstep(u, 0.64, 0.86)) // swell into the lip
    else r = THREE.MathUtils.lerp(0.46, 0.05, THREE.MathUtils.smootherstep(u, 0.86, 1.0)) // throat folds in
    // subtle geometric segmentation on the body (most of the armor look is shaded
    // in the fragment shader); faded out before the lip so the rim stays clean
    const ridge =
      THREE.MathUtils.smoothstep(u, 0.05, 0.12) * (1 - THREE.MathUtils.smoothstep(u, 0.58, 0.7))
    r += 0.014 * ridge * Math.sin(u * RIDGE_FREQ * Math.PI * 2)
    return r * R
  }

  // The vertex shader bends this onto the orbit path; here we build it as a
  // STRAIGHT tube in local (x, y = cross-section; z = along-length) space so we
  // can compute true surface normals from neighbouring vertices. `AX` is the
  // straight length (≈ the rendered centerline length) — it only sets how steep
  // the taper/lip/teeth read to the normals, so an approximation is fine.
  const AX = 2.7 * R
  const ROWS = T + 1
  const COLS = RING + 1
  // sp[i][j] = [x, y, z, theta, radius, axialOffset, toothStrength] per grid vertex
  const sp = []
  for (let i = 0; i < ROWS; i++) {
    const u = i / T
    const baseR = profile(u)
    // Two concentric rows of fangs ring the maw: a prominent outer row at the lip
    // and a smaller inner row set deeper in (staggered half a tooth), so it reads
    // as the layered crystalline teeth of a sandworm rather than one spiky ring.
    const outer = THREE.MathUtils.smoothstep(u, 0.79, 0.84) * (1 - THREE.MathUtils.smoothstep(u, 0.86, 0.9))
    const inner = THREE.MathUtils.smoothstep(u, 0.9, 0.925) * (1 - THREE.MathUtils.smoothstep(u, 0.945, 0.975))
    const isInner = inner > outer
    const teethBand = Math.max(outer, inner)
    const phase = isInner ? Math.PI / 2 : 0 // half-tooth stagger between the rows
    // throat recedes into a deep dark gullet
    const gullet = THREE.MathUtils.smoothstep(u, 0.84, 1.0) * -0.95 * R
    const row = []
    for (let j = 0; j < COLS; j++) {
      const th = (j / RING) * Math.PI * 2
      const fang = Math.pow(Math.abs(Math.sin(th * (TEETH / 2) + phase)), 6) * teethBand
      const rr = baseR - fang * 0.05 * R // fang tips lean inward, toward the throat…
      const axial = gullet + fang * 0.26 * R // …and jut forward, ringing the opening
      row.push([rr * Math.cos(th), rr * Math.sin(th), u * AX + axial, th, rr, axial, fang])
    }
    sp.push(row)
  }
  // wrap in theta, clamp at the ends
  const at = (i, j) => sp[Math.max(0, Math.min(ROWS - 1, i))][((j % RING) + RING) % RING]

  const position = []
  const aU = []
  const aOff = []
  const aTheta = []
  const aAxial = []
  const aNormal = []
  const aTooth = []
  for (let i = 0; i < ROWS; i++) {
    const u = i / T
    for (let j = 0; j < COLS; j++) {
      const cur = sp[i][j]
      // analytic normal: cross of the along-length and around-ring tangents
      const a = at(i, j - 1)
      const b = at(i, j + 1)
      const c = at(i - 1, j)
      const d = at(i + 1, j)
      const dux = d[0] - c[0]
      const duy = d[1] - c[1]
      const duz = d[2] - c[2]
      const dvx = b[0] - a[0]
      const dvy = b[1] - a[1]
      const dvz = b[2] - a[2]
      let nx = dvy * duz - dvz * duy
      let ny = dvz * dux - dvx * duz
      let nz = dvx * duy - dvy * dux
      const nl = Math.hypot(nx, ny, nz) || 1
      nx /= nl
      ny /= nl
      nz /= nl
      if (nx * cur[0] + ny * cur[1] < 0) {
        nx = -nx // keep normals pointing out of the tube
        ny = -ny
        nz = -nz
      }
      position.push(0, 0, u) // placeholder; real position computed in the shader
      aU.push(u)
      aOff.push(cur[0], cur[1])
      aTheta.push(cur[3])
      aAxial.push(cur[5]) // axial offset only (gullet + fang); centerline comes from the path
      aNormal.push(nx, ny, nz)
      aTooth.push(cur[6]) // tooth strength (0 body … 1 fang tip) for shading
    }
  }
  const index = []
  for (let i = 0; i < T; i++) {
    for (let j = 0; j < RING; j++) {
      const a = i * (RING + 1) + j
      const b = a + 1
      const c = a + (RING + 1)
      const d = c + 1
      // wound so the OUTER tube surface is front-facing (the shader paints
      // front = sand body, back = dark gullet seen through the maw)
      index.push(a, b, c, b, d, c)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('aU', new THREE.Float32BufferAttribute(aU, 1))
  g.setAttribute('aOff', new THREE.Float32BufferAttribute(aOff, 2))
  g.setAttribute('aTheta', new THREE.Float32BufferAttribute(aTheta, 1))
  g.setAttribute('aAxial', new THREE.Float32BufferAttribute(aAxial, 1))
  g.setAttribute('aNormal', new THREE.Float32BufferAttribute(aNormal, 3))
  g.setAttribute('aTooth', new THREE.Float32BufferAttribute(aTooth, 1))
  g.setIndex(index)
  return g
}

const vert = /* glsl */ `
  attribute float aU;
  attribute vec2 aOff;
  attribute float aTheta;
  attribute float aAxial;
  attribute vec3 aNormal;
  attribute float aTooth;
  uniform float uTime;
  uniform float uAmp;
  uniform float uR;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vU;
  varying float vTheta;
  varying float vTooth;

  vec3 pathPos(float s) {
    float a = s;                          // azimuth → orbits the planet
    float l = 0.5 * sin(s * 1.4 + 0.3);   // latitude wander (wavy band)
    vec3 d = vec3(cos(l) * cos(a), sin(l), cos(l) * sin(a));
    // gentler, lower-frequency breach: keeps the path curvature radius well above
    // the tube radius so the bent tube never folds through itself (no clipping)
    float hump = max(0.0, sin(s * 1.9));  // breach humps
    float base = mix(0.55, 0.82, uAmp) * uR;
    float br = pow(hump, 1.5) * 0.55 * uR * uAmp;
    return d * (base + br);
  }

  void main() {
    float ARC = 3.6;                      // how much of the path the worm spans
    float head = uTime * 0.42;            // swims forward + orbits over time
    float s = head - (1.0 - aU) * ARC;    // tail trails behind the head
    float e = 0.01;
    vec3 P  = pathPos(s);
    vec3 T  = normalize(pathPos(s + e) - pathPos(s - e)); // centered tangent

    // Stable orthonormal frame. The cross-section is a circle, so the frame's
    // ROLL is free — we only need it orthonormal and smoothly varying. The old
    // frame keyed off normalize(P) (the planet-radial), which goes parallel to T
    // every time the worm breaches → cross() collapsed → NaNs → torn polygons.
    // Instead, Gram-Schmidt a world reference onto the plane ⟂ T, swapping the
    // reference smoothly before it can ever align with T.
    vec3 ref = mix(vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0), smoothstep(0.55, 0.9, abs(T.y)));
    vec3 up   = normalize(ref - T * dot(T, ref));
    vec3 side = cross(T, up);

    vec3 local = P + T * aAxial + aOff.x * up + aOff.y * side;
    vec4 wp = modelMatrix * vec4(local, 1.0);
    vWorldPos = wp.xyz;
    // rotate the baked tube-space normal into the same frame (real surface normal)
    vec3 nrm = aNormal.x * up + aNormal.y * side + aNormal.z * T;
    vNormal = normalize(mat3(modelMatrix) * nrm);
    vU = aU;
    vTheta = aTheta;
    vTooth = aTooth;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const frag = /* glsl */ `
  uniform float uR;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vU;
  varying float vTheta;
  varying float vTooth;
  ${snoise}

  void main() {
    bool front = gl_FrontFacing;
    vec3 N = normalize(vNormal);
    if (!front) N = -N;

    vec3 L = normalize(vec3(0.5, 0.78, 0.42));        // fixed key light, above-front
    vec3 V = normalize(cameraPosition - vWorldPos);

    // --- dark wet gullet (interior backfaces, seen down the throat) ---
    if (!front) {
      float depth = smoothstep(0.84, 1.0, vU);        // deeper in the throat → darker
      float d = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
      vec3 flesh = mix(vec3(0.22, 0.07, 0.06), vec3(0.015, 0.004, 0.006), depth);
      gl_FragColor = vec4(flesh * (0.25 + 0.75 * d), 1.0);
      return;
    }

    // --- fine sand grain: gently perturb the normal (texture, not lumps) ---
    float g0 = fbm(vec3(vU * 60.0, vTheta * 6.0, 0.0));
    float gu = fbm(vec3(vU * 60.0 + 0.5, vTheta * 6.0, 0.0));
    float gt = fbm(vec3(vU * 60.0, vTheta * 6.0 + 0.5, 0.0));
    vec3 tang = normalize(cross(N, vec3(0.0, 1.0, 0.0)) + 1e-4);
    vec3 bitan = cross(N, tang);
    N = normalize(N - (tang * (gu - g0) + bitan * (gt - g0)) * 0.6);

    // --- overlapping armor ring plates: broad plate, sharp dark groove (AO) ---
    float ring = fract(vU * 26.0);
    float plate = smoothstep(0.04, 0.16, ring) * smoothstep(0.98, 0.84, ring);
    float bodyMask = 1.0 - smoothstep(vU, 0.78, 0.86); // no plate banding across the maw
    float groove = mix(1.0, mix(0.42, 1.0, plate), bodyMask);

    // --- matte, dusty lighting ---
    float diff = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0); // soft half-lambert
    float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);

    // sand palette — near-NEUTRAL grey-taupe on purpose: the scene's ACES tone
    // mapping strongly re-saturates and warms mid-tones ("ACES orange"), so a warm
    // tan input renders terracotta. These greyed values land on dusty Dune-sand.
    vec3 sandLo = vec3(0.21, 0.18, 0.15);
    vec3 sand   = vec3(0.60, 0.53, 0.43);
    vec3 sandHi = vec3(0.82, 0.75, 0.63);
    vec3 albedo = mix(sandLo, sand, 0.4 + 0.6 * g0);
    albedo *= groove;

    // crystalline teeth: pale cream — override the sand at the fangs
    float toothMask = smoothstep(0.12, 0.6, vTooth);
    albedo = mix(albedo, vec3(0.86, 0.84, 0.78), toothMask);

    // light desaturation keeps it dusty (not candy) without going grey
    float lum = dot(albedo, vec3(0.299, 0.587, 0.114));
    albedo = mix(vec3(lum), albedo, 0.85);

    // dusty ambient so the shadow side reads as sand, not black
    vec3 amb = sandLo * 0.7 + vec3(0.06, 0.07, 0.09) * 0.5;
    vec3 col = amb + albedo * diff * 0.95;
    col += sandHi * fres * 0.10 * diff;                 // subtle dusty rim (cool, low)

    // only the teeth get a sharp glint; the body stays matte sand
    vec3 H = normalize(L + V);
    col += pow(max(dot(N, H), 0.0), 40.0) * toothMask * 0.5;

    gl_FragColor = vec4(col, 1.0);
  }
`

export function Sandworm({ position = [0, 0, 0], radius = 2.4, show = true }) {
  const group = useRef()
  const amp = useRef(0)
  const geometry = useMemo(() => buildWorm(radius), [radius])
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAmp: { value: 0 }, uR: { value: radius } }),
    [radius]
  )

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    amp.current = THREE.MathUtils.damp(amp.current, show ? 1 : 0, 2.0, dt)
    uniforms.uAmp.value = amp.current
    uniforms.uTime.value += dt
    g.visible = amp.current > 0.01
  })

  return (
    <group ref={group} position={position} visible={false}>
      <mesh geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
