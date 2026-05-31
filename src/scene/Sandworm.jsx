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
const T = 230 // length samples
const RING = 24 // cross-section resolution
const RIDGE_FREQ = 34 // geometric ring segments

function buildWorm(R) {
  const profile = (u) => {
    let r
    if (u < 0.1) r = THREE.MathUtils.lerp(0.02, 0.22, u / 0.1)
    else if (u < 0.68) r = 0.22
    else if (u < 0.83) r = THREE.MathUtils.lerp(0.22, 0.14, (u - 0.68) / 0.15) // neck pinch
    else r = THREE.MathUtils.lerp(0.14, 0.42, Math.pow((u - 0.83) / 0.17, 0.7)) // maw bell
    r += 0.03 * Math.sin(u * RIDGE_FREQ * Math.PI * 2) // geometric ring ridges
    return r * R
  }

  const position = []
  const aU = []
  const aOff = []
  const aTheta = []
  for (let i = 0; i <= T; i++) {
    const u = i / T
    const baseR = profile(u)
    const maw = THREE.MathUtils.smoothstep(u, 0.83, 1.0)
    for (let j = 0; j <= RING; j++) {
      const th = (j / RING) * Math.PI * 2
      const teeth = Math.pow(Math.abs(Math.sin(th * (RING / 2))), 6) * 0.16 * R * maw
      const rr = baseR + teeth
      position.push(0, 0, u) // placeholder; real position computed in the shader
      aU.push(u)
      aOff.push(rr * Math.cos(th), rr * Math.sin(th))
      aTheta.push(th)
    }
  }
  const index = []
  for (let i = 0; i < T; i++) {
    for (let j = 0; j < RING; j++) {
      const a = i * (RING + 1) + j
      const b = a + 1
      const c = a + (RING + 1)
      const d = c + 1
      index.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('aU', new THREE.Float32BufferAttribute(aU, 1))
  g.setAttribute('aOff', new THREE.Float32BufferAttribute(aOff, 2))
  g.setAttribute('aTheta', new THREE.Float32BufferAttribute(aTheta, 1))
  g.setIndex(index)
  return g
}

const vert = /* glsl */ `
  attribute float aU;
  attribute vec2 aOff;
  attribute float aTheta;
  uniform float uTime;
  uniform float uAmp;
  uniform float uR;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vU;
  varying float vTheta;

  vec3 pathPos(float s) {
    float a = s;                          // azimuth → orbits the planet
    float l = 0.5 * sin(s * 1.4 + 0.3);   // latitude wander (wavy band)
    vec3 d = vec3(cos(l) * cos(a), sin(l), cos(l) * sin(a));
    float hump = max(0.0, sin(s * 2.4));  // breach humps
    float base = mix(0.5, 0.78, uAmp) * uR;
    float br = pow(hump, 1.3) * 0.95 * uR * uAmp;
    return d * (base + br);
  }

  void main() {
    float ARC = 3.6;                      // how much of the path the worm spans
    float head = uTime * 0.42;            // swims forward + orbits over time
    float s = head - (1.0 - aU) * ARC;    // tail trails behind the head
    float e = 0.015;
    vec3 P  = pathPos(s);
    vec3 Pe = pathPos(s + e);
    vec3 T  = normalize(Pe - P);
    vec3 radial = normalize(P);
    vec3 side = normalize(cross(T, radial));
    vec3 up   = normalize(cross(side, T));

    vec3 local = P + aOff.x * up + aOff.y * side;
    vec4 wp = modelMatrix * vec4(local, 1.0);
    vWorldPos = wp.xyz;
    vNormal = normalize(mat3(modelMatrix) * (aOff.x * up + aOff.y * side));
    vU = aU;
    vTheta = aTheta;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const frag = /* glsl */ `
  uniform float uR;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vU;
  varying float vTheta;
  ${snoise}
  void main() {
    vec3 N = normalize(vNormal);
    if (!gl_FrontFacing) N = -N;

    // fbm bump relief — perturb the normal by the noise gradient
    float h0 = fbm(vec3(vU * 34.0, vTheta * 3.5, 0.0));
    float hu = fbm(vec3(vU * 34.0 + 0.6, vTheta * 3.5, 0.0));
    float ht = fbm(vec3(vU * 34.0, vTheta * 3.5 + 0.6, 0.0));
    vec3 tang = normalize(cross(N, vec3(0.0, 1.0, 0.0)) + 1e-4);
    vec3 bitan = cross(N, tang);
    N = normalize(N - (tang * (hu - h0) + bitan * (ht - h0)) * 2.2);

    // ring-segment plates (match the geometric ridge frequency)
    float seg = abs(fract(vU * 34.0) - 0.5);
    float plate = smoothstep(0.5, 0.12, seg);

    vec3 L = normalize(vec3(0.45, 0.8, 0.45)); // warm key from above-front
    float diff = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
    diff *= diff;
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 32.0) * plate;
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    if (!gl_FrontFacing) {
      // inside the maw — dark wet gullet
      gl_FragColor = vec4(mix(vec3(0.02, 0.0, 0.0), vec3(0.32, 0.06, 0.04), diff), 1.0);
      return;
    }

    vec3 sand = vec3(0.6, 0.43, 0.25);
    vec3 groove = vec3(0.09, 0.06, 0.04);
    float tone = plate * (0.55 + 0.45 * h0);
    vec3 base = mix(groove, sand, tone);
    vec3 col = base * (0.22 + diff * 1.15);
    col += vec3(1.0, 0.9, 0.7) * spec * 0.6;   // wet chitin glint
    col += vec3(0.85, 0.5, 0.28) * fres * 0.35; // rim
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
