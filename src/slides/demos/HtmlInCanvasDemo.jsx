import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CodeBlock } from '../../ui/CodeBlock.jsx'
import { DissolveCard } from '../../scene/DissolveCard.jsx'
import {
  HTML_IN_CANVAS_SUPPORTED,
  drawTalkCardFallback,
} from '../../lib/htmlInCanvas.js'

/**
 * html-in-canvas, on the flat card — the SETUP, now with the actual payoff.
 *
 * LEFT: a real, live, interactive component — type in it, pick a theme.
 * RIGHT: that component drawn into a <canvas> via `drawElementImage`, then handed
 * to the GPU. Drag the slider and every pixel becomes a star that scatters into
 * space (DissolveCard). Drawing DOM that looks like DOM is a parlor trick; the
 * point is that once it's a texture, the whole GPU is yours. The 3D reveal next
 * does it in the universe itself.
 *
 * The texture is hand-drawn here (like StreamDemo simulates) so it works with the
 * flag off and authors locally; the CODE is the genuine API, and the 3D reveal
 * (HtmlPanel) uses the real drawElementImage when the flag is on.
 */
const THEMES = ['Aurora', 'Sentry', 'Syntax', 'Graffiti']

const CODE = `<canvas layoutsubtree>
  <MyComponent />   <!-- live, interactive -->
</canvas>

canvas.onpaint = () =>
  ctx.drawElementImage(component, 0, 0)

// it's a texture now — feed it to the GPU
material.map = new CanvasTexture(canvas)`

const TEX_W = 1024
const TEX_H = 640
const CARD_W = 9.2
const CARD_H = CARD_W * (TEX_H / TEX_W)

function readAccent(el) {
  const v = getComputedStyle(el).getPropertyValue('--accent').trim()
  return v.startsWith('#') ? v : '#f5d0fe'
}

export function HtmlInCanvasDemo() {
  const [text, setText] = useState('Hello from the DOM')
  const [theme, setTheme] = useState('Aurora')
  const [dissolve, setDissolve] = useState(0)
  const wrapRef = useRef(null)
  const dissolveRef = useRef(0)
  const live = useRef({ text, theme })
  live.current = { text, theme }
  dissolveRef.current = dissolve / 100

  // One CanvasTexture, backed by an offscreen 2D canvas we redraw from state.
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = TEX_W
    c.height = TEX_H
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
    return t
  }, [])

  useEffect(() => {
    const canvas = texture.image
    const ctx = canvas.getContext('2d')
    const accent = readAccent(wrapRef.current)
    let raf = 0
    const t0 = performance.now()
    const tick = (now) => {
      drawTalkCardFallback(ctx, TEX_W, TEX_H, {
        accent,
        text: live.current.text || ' ',
        theme: live.current.theme,
        time: (now - t0) / 1000,
      })
      texture.needsUpdate = true
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      texture.dispose()
    }
  }, [texture])

  return (
    <div className="hic" ref={wrapRef}>
      {/* LEFT — the real, interactive component */}
      <section className="hic-live">
        <span className="hic-eyebrow">Bleeding edge</span>
        <div className="hic-title">This Component Could Have Been A Div</div>
        <label className="hic-field">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Card text"
            spellCheck={false}
          />
        </label>
        <select
          className="hic-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          aria-label="Theme"
        >
          {THEMES.map((th) => (
            <option key={th} value={th}>
              {th}
            </option>
          ))}
        </select>
      </section>

      {/* RIGHT — the same component, now a GPU texture made of stars */}
      <section className="hic-stage">
        <div className="hic-canvas3d">
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0, 10.5], fov: 50 }}
            gl={{ antialias: true }}
          >
            <color attach="background" args={['#050710']} />
            <DissolveCard
              texture={texture}
              width={CARD_W}
              height={CARD_H}
              cols={176}
              rows={110}
              spread={9}
              size={2.2}
              intensity={0.7}
              dissolveRef={dissolveRef}
            />
            <EffectComposer>
              <Bloom
                intensity={0.5}
                luminanceThreshold={0.6}
                luminanceSmoothing={0.7}
                mipmapBlur
                radius={0.6}
              />
            </EffectComposer>
          </Canvas>
        </div>
        <div className="hic-scrub">
          <span>Solid</span>
          <input
            className="hic-range"
            type="range"
            min="0"
            max="100"
            value={dissolve}
            onChange={(e) => setDissolve(+e.target.value)}
            aria-label="Dissolve into space"
          />
          <span>Scatter&nbsp;into&nbsp;space</span>
        </div>
        <CodeBlock>{CODE}</CodeBlock>
        <p className="hic-compat">
          {HTML_IN_CANVAS_SUPPORTED
            ? 'Live · Chrome 148 · drawElementImage'
            : 'Chrome 148 · drawElementImage · experimental flag'}
        </p>
      </section>
    </div>
  )
}
