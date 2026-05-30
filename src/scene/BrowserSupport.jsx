import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { slides } from '../slides/index.js'
import { useStore } from '../state/useStore.js'

/**
 * The browser-support readout, living in the 3D scene. Three engine coins float
 * in the right margin (camera-anchored so they clear the centered cards and pick
 * up the bloom). Each coin has its browser's LOGO bump-mapped into the face —
 * the logo's luminance drives a relief normal, so it reads instantly as that
 * browser AND has real 3D emboss. Supported = the coin lights up and glows in
 * its brand color; unsupported = a dim, dark coin with the logo still embossed.
 * No emoji; the personality is the lit/dark contrast and the embossed relief.
 *
 * Driven per slide by a `support` field, e.g.
 *   support: { chrome: true, safari: false, firefox: 'partial' }
 * Slides without `support` hide the readout. Logos live in /public/logos/ (white
 * on transparent); brand colors are placeholders.
 */
const TEX = 256
const ENGINES = [
  { key: 'chrome', color: '#7aa2ff', src: '/logos/chrome.svg' },
  { key: 'safari', color: '#37c2ff', src: '/logos/safari.svg' },
  { key: 'firefox', color: '#ff8a4c', src: '/logos/firefox.svg' },
]
const LEVEL = { true: 1, partial: 0.45, false: 0, undefined: 0 }

const OFFSET = new THREE.Vector3(3.5, 0, -6) // camera-local: right margin, centered
const SPACING = 0.95

const discVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Object-space lit (the coin faces the camera). The logo texture is a height
// field: its gradient becomes a bump normal so the logo embosses and catches a
// key light. A radial mask makes the circular coin; uLit fades dark→glowing.
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

    // bump normal from the logo's height gradient
    float hx = H(uv + vec2(uTexel, 0.0)) - H(uv - vec2(uTexel, 0.0));
    float hy = H(uv + vec2(0.0, uTexel)) - H(uv - vec2(0.0, uTexel));
    vec3 n = normalize(vec3(-hx * 9.5, hy * 9.5, 1.0));

    vec3 L = normalize(vec3(0.5, 0.6, 0.62));
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 Hh = normalize(L + V);
    float diff = clamp(dot(n, L), 0.0, 1.0);
    float spec = pow(max(dot(n, Hh), 0.0), 26.0);

    // circular coin: soft edge + a brighter rim ring
    float r = length(uv - 0.5) * 2.0;
    float disc = smoothstep(1.0, 0.93, r);
    float rim = smoothstep(0.80, 0.97, r) * smoothstep(1.0, 0.9, r);

    vec3 body = uColor * mix(0.16, 0.07, r); // dark brand coin, brighter center
    body += uColor * rim * 0.6;

    vec3 logoTint = mix(uColor, vec3(1.0), 0.35);
    vec3 col = body;
    col += logoTint * h * (0.35 + diff * 0.85); // embossed logo, lit
    col += vec3(1.0) * spec * h * 0.9;           // glint on the relief

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
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, TEX, TEX)
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
  const group = useRef()
  const level = useRef(ENGINES.map(() => 0))
  const shown = useRef(0)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    let cancelled = false
    Promise.all(ENGINES.map((e) => rasterize(e.src))).then((t) => {
      if (!cancelled) setTextures(t)
    })
    return () => {
      cancelled = true
    }
  }, [])

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
      const target = support ? LEVEL[String(support[e.key])] : 0
      level.current[i] = THREE.MathUtils.damp(level.current[i], target, 5, dt)
      materials[i].uniforms.uLit.value = level.current[i]
      materials[i].uniforms.uShown.value = shown.current
      const mesh = g.children[i]
      if (mesh) mesh.position.y = (1 - i) * SPACING + Math.sin(clock.elapsedTime * 0.8 + i * 1.3) * 0.05
    })
  })

  if (!materials) return null
  return (
    <group ref={group} visible={false}>
      {ENGINES.map((e, i) => (
        <mesh key={e.key} position={[0, (1 - i) * SPACING, 0]} material={materials[i]}>
          <planeGeometry args={[0.62, 0.62]} />
        </mesh>
      ))}
    </group>
  )
}
