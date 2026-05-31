import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { slides } from '../slides/index.js'
import { useStore } from '../state/useStore.js'

/**
 * The browser-support readout, living in the 3D scene. Three engine coins float
 * in the right margin (camera-anchored so they clear the centered cards and pick
 * up the bloom). Each coin bump-maps its browser LOGO into the face — instant
 * recognition + real 3D emboss. Three visual tiers carry the state:
 *   shipped  → coin lights up, glows its brand color (level 1)
 *   flagged  → half-lit (level 0.45) — "behind a flag"
 *   missing  → dark, desaturated dead coin (level 0)
 * Hovering a coin reveals a tooltip with the version it landed / flag status.
 *
 * Driven per slide by a `support` field; each engine value is one of:
 *   true                         shipped (no version)
 *   false / omitted              not supported
 *   'partial'                    behind a flag
 *   { since: '125' }             shipped since v125
 *   { since: '121', flag: true } behind a flag (since v121)
 *
 * Logos live in /public/logos/ (white on transparent); brand colors are
 * placeholders. Tooltip wording is scaffold — Scott owns the language.
 */
const TEX = 256
const ENGINES = [
  { key: 'chrome', name: 'Chrome', color: '#7aa2ff', src: '/logos/chrome.svg' },
  { key: 'safari', name: 'Safari', color: '#37c2ff', src: '/logos/safari.svg' },
  { key: 'firefox', name: 'Firefox', color: '#ff8a4c', src: '/logos/firefox.svg' },
]

const OFFSET = new THREE.Vector3(3.5, 0, -6) // camera-local: right margin, centered
const SPACING = 0.95

// Normalize a support value → glow level + a tooltip label.
function parse(value) {
  if (value === true) return { level: 1, label: 'Supported' }
  if (value === 'partial') return { level: 0.45, label: 'Behind a flag' }
  if (value && typeof value === 'object') {
    if (value.flag)
      return { level: 0.45, label: value.since ? `v${value.since} · behind a flag` : 'Behind a flag' }
    return { level: 1, label: value.since ? `Since v${value.since}` : 'Supported' }
  }
  return { level: 0, label: 'Not supported yet' }
}

const discVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const discFrag = /* glsl */ `
  uniform sampler2D uLogo;
  uniform vec3 uColor;
  uniform float uLit;
  uniform float uShown;
  uniform float uTexel;
  varying vec2 vUv;
  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  float H(vec2 uv) { vec4 t = texture2D(uLogo, uv); return lum(t.rgb) * t.a; }
  void main() {
    vec2 uv = vUv;
    float h = H(uv);

    float hx = H(uv + vec2(uTexel, 0.0)) - H(uv - vec2(uTexel, 0.0));
    float hy = H(uv + vec2(0.0, uTexel)) - H(uv - vec2(0.0, uTexel));
    vec3 n = normalize(vec3(-hx * 9.5, hy * 9.5, 1.0));

    vec3 L = normalize(vec3(0.5, 0.6, 0.62));
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 Hh = normalize(L + V);
    float diff = clamp(dot(n, L), 0.0, 1.0);
    float spec = pow(max(dot(n, Hh), 0.0), 26.0);

    float r = length(uv - 0.5) * 2.0;
    float disc = smoothstep(1.0, 0.93, r);
    float rim = smoothstep(0.80, 0.97, r) * smoothstep(1.0, 0.9, r);

    vec3 body = uColor * mix(0.16, 0.07, r);
    body += uColor * rim * 0.6;

    vec3 logoTint = mix(uColor, vec3(1.0), 0.35);
    vec3 col = body;
    col += logoTint * h * (0.35 + diff * 0.85);
    col += vec3(1.0) * spec * h * 0.9;

    col += uColor * uLit * (h * 2.5 + 0.18);     // brighter glow when supported
    col *= mix(0.26, 1.0, uLit);                 // much darker when unsupported
    float g = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(g), col, 0.4 + 0.6 * uLit);   // off reads desaturated / dead

    gl_FragColor = vec4(col, disc * uShown);
  }
`

function rasterize(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = TEX
      c.getContext('2d').drawImage(img, 0, 0, TEX, TEX)
      const tex = new THREE.CanvasTexture(c)
      tex.needsUpdate = true
      resolve(tex)
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export function BrowserSupport() {
  const index = useStore((s) => s.index)
  const support = slides[index]?.support

  const [textures, setTextures] = useState(null)
  const [hovered, setHovered] = useState(null)
  const group = useRef()
  const level = useRef(ENGINES.map(() => 0))
  const scale = useRef(ENGINES.map(() => 1))
  const shown = useRef(0)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    let cancelled = false
    Promise.all(ENGINES.map((e) => rasterize(e.src))).then((t) => !cancelled && setTextures(t))
    return () => {
      cancelled = true
    }
  }, [])

  // Drop any stale hover when the slide changes.
  useEffect(() => setHovered(null), [index])

  const materials = useMemo(() => {
    if (!textures) return null
    return ENGINES.map(
      (e, i) =>
        new THREE.ShaderMaterial({
          vertexShader: discVert,
          fragmentShader: discFrag,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          uniforms: {
            uLogo: { value: textures[i] },
            uColor: { value: new THREE.Color(e.color) },
            uLit: { value: 0 },
            uShown: { value: 0 },
            uTexel: { value: 1 / TEX },
          },
        })
    )
  }, [textures])

  useFrame(({ camera, clock }, dt) => {
    const g = group.current
    if (!g || !materials) return

    tmp.copy(OFFSET).applyQuaternion(camera.quaternion)
    g.position.copy(camera.position).add(tmp)
    g.quaternion.copy(camera.quaternion)

    shown.current = THREE.MathUtils.damp(shown.current, support ? 1 : 0, 4, dt)
    g.visible = shown.current > 0.01

    ENGINES.forEach((e, i) => {
      const target = support ? parse(support[e.key]).level : 0
      level.current[i] = THREE.MathUtils.damp(level.current[i], target, 5, dt)
      materials[i].uniforms.uLit.value = level.current[i]
      materials[i].uniforms.uShown.value = shown.current

      const mesh = g.children[i]
      if (!mesh) return
      mesh.position.y = (1 - i) * SPACING + Math.sin(clock.elapsedTime * 0.8 + i * 1.3) * 0.05
      // gentle scale-up on hover for feedback
      scale.current[i] = THREE.MathUtils.damp(scale.current[i], hovered === i ? 1.18 : 1, 8, dt)
      mesh.scale.setScalar(scale.current[i])
    })
  })

  if (!materials) return null

  const hover = (i) => (e) => {
    e.stopPropagation()
    setHovered(i)
    document.body.style.cursor = 'pointer'
  }
  const unhover = (e) => {
    e.stopPropagation()
    setHovered((h) => (h === null ? h : null))
    document.body.style.cursor = ''
  }

  const tip = hovered != null && support ? parse(support[ENGINES[hovered].key]) : null

  return (
    <group ref={group} visible={false}>
      {ENGINES.map((e, i) => (
        <mesh
          key={e.key}
          position={[0, (1 - i) * SPACING, 0]}
          material={materials[i]}
          onPointerOver={hover(i)}
          onPointerOut={unhover}
        >
          <planeGeometry args={[0.62, 0.62]} />
        </mesh>
      ))}

      {tip && (
        <Html position={[0, (1 - hovered) * SPACING, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="support-tip" style={{ '--tip': ENGINES[hovered].color }}>
            <strong>{ENGINES[hovered].name}</strong>
            <span>{tip.label}</span>
          </div>
        </Html>
      )}
    </group>
  )
}
