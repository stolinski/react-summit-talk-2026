import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DissolveCard } from './DissolveCard.jsx'
import {
  HTML_IN_CANVAS_SUPPORTED,
  paintElement,
  drawTalkCardFallback,
} from '../lib/htmlInCanvas.js'

/**
 * THE html-in-canvas FINALE — the talk's own card, pulled INTO the universe and
 * then handed to the GPU.
 *
 * `ctx.drawElementImage()` rasterizes a live DOM card into a <canvas>; that
 * canvas is a THREE.CanvasTexture. But drawing DOM that looks like the DOM isn't
 * the point — the point is what's possible ONCE it's a texture. So the card
 * forms as a crisp panel, then every pixel becomes a star that swirls out into
 * the galaxy and reforms (DissolveCard), orbiting the bleeding-edge planet that
 * eclipses it, blooming via Effects. The overlay this whole talk floats over
 * could do none of this.
 *
 * Real API ships in Chrome 148 behind a flag (see htmlInCanvas.js); with it off
 * we hand-draw a faithful copy of the card, so the reveal is identical bar the
 * rasterizer. Calm motion per the house rule — smooth transforms only.
 */

const TEX_W = 1024
const TEX_H = 640
const CARD_W = 9.2
const CARD_H = CARD_W * (TEX_H / TEX_W)
const LOOP = 15 // seconds: forms, holds readable, scatters into stars, repeats

function buildSourceCard(accent) {
  const card = document.createElement('div')
  card.style.cssText = `
    position: absolute; inset: 0; width: ${TEX_W}px; height: ${TEX_H}px;
    box-sizing: border-box; padding: 72px;
    display: flex; flex-direction: column; gap: 26px;
    border-radius: 46px;
    background: linear-gradient(180deg, rgba(20,24,40,0.96), rgba(8,11,20,0.96) 42%, rgba(6,8,16,0.97));
    border: 4px solid ${accent}80;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: #f8fafc;`
  card.innerHTML = `
    <div style="font:700 27px ui-sans-serif,system-ui,sans-serif; letter-spacing:.34em; color:${accent}">BLEEDING&nbsp;&nbsp;EDGE</div>
    <h1 style="margin:0; font:800 74px 'Newake',ui-sans-serif,system-ui,sans-serif; line-height:1.04; color:#f8fafc">This Component Could Have Been A Div</h1>
    <div style="flex:1"></div>
    <label style="display:flex; align-items:center; gap:18px; height:94px; padding:0 30px; border-radius:26px; background:rgba(255,255,255,.05); border:2px solid rgba(255,255,255,.14)">
      <span style="font:500 41px ui-sans-serif,system-ui,sans-serif; color:#e8eefc">Hello from the DOM</span>
      <span class="hc-caret" style="width:4px; height:44px; background:${accent}"></span>
    </label>
    <div style="display:flex; align-items:center; gap:18px">
      <div style="flex:1; height:12px; border-radius:99px; background:rgba(255,255,255,.12); position:relative">
        <div style="position:absolute; inset:0 38% 0 0; border-radius:99px; background:${accent}"></div>
        <div style="position:absolute; left:62%; top:50%; transform:translate(-50%,-50%); width:42px; height:42px; border-radius:50%; background:#f8fafc; box-shadow:0 0 26px ${accent}"></div>
      </div>
    </div>`
  const style = document.createElement('style')
  style.textContent =
    '@keyframes hc-blink{50%{opacity:0}} .hc-caret{animation:hc-blink 1s steps(1) infinite}'
  card.appendChild(style)
  return card
}

function makeGlowTexture(accent) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128)
  const col = new THREE.Color(accent)
  const rgb = `${(col.r * 255) | 0}, ${(col.g * 255) | 0}, ${(col.b * 255) | 0}`
  g.addColorStop(0, `rgba(${rgb}, 0.5)`)
  g.addColorStop(0.4, `rgba(${rgb}, 0.2)`)
  g.addColorStop(1, `rgba(${rgb}, 0)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function HtmlPanel({
  position = [132, 14, 44], // orbit center = the bleeding-edge planet
  orbitRadius = 5.4,
  accent = '#f5d0fe',
  show = false,
}) {
  const root = useRef() // orbits + billboards toward the camera
  const tilt = useRef() // gentle 3D rock so it never reads as a flat sticker
  const glowMat = useRef()
  const amp = useRef(0)
  const time = useRef(0)
  const dissolveRef = useRef(0)
  const opacityRef = useRef(0)
  const { camera, gl } = useThree()

  const { canvas, ctx, sourceCard, texture, glowTexture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = TEX_W
    canvas.height = TEX_H
    let sourceCard = null
    if (HTML_IN_CANVAS_SUPPORTED) {
      canvas.setAttribute('layoutsubtree', '')
      // CRITICAL: the global `canvas { position: fixed; inset: 0 }` rule (for the
      // full-bleed WebGL canvas) would otherwise rip this offscreen host canvas
      // out of its parent and pin it over the whole viewport — drawing the card
      // bitmap on top of every slide forever. Inline styles override it so it
      // stays offscreen (it only needs to be laid out, not visible).
      canvas.style.cssText =
        'position:absolute; inset:auto; left:0; top:0; pointer-events:none;'
      const host = document.createElement('div')
      host.setAttribute('data-html-in-canvas', '')
      host.setAttribute('aria-hidden', 'true')
      // Offscreen but NOT opacity:0 — drawElementImage rasterizes the painted
      // appearance, so a transparent host would draw nothing.
      host.style.cssText =
        'position:fixed; left:-20000px; top:0; width:' + TEX_W + 'px; height:' + TEX_H + 'px; pointer-events:none; overflow:hidden; z-index:-1;'
      sourceCard = buildSourceCard(accent)
      canvas.appendChild(sourceCard)
      host.appendChild(canvas)
      document.body.appendChild(host)
    }
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    // LinearFilter / no mipmaps: the points shader fetches this in the vertex
    // stage, and the texture is non-power-of-two.
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.anisotropy = gl.capabilities.getMaxAnisotropy?.() ?? 1
    const glowTexture = makeGlowTexture(accent)
    return { canvas, ctx, sourceCard, texture, glowTexture }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      texture.dispose()
      glowTexture.dispose()
      const host = canvas.parentElement
      if (host?.parentElement) host.parentElement.removeChild(host)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const center = useMemo(() => new THREE.Vector3(...position), [position])

  useFrame((_, dt) => {
    const g = root.current
    if (!g) return
    amp.current = THREE.MathUtils.damp(amp.current, show ? 1 : 0, 2.4, dt)
    const a = amp.current
    opacityRef.current = a
    g.visible = a > 0.01
    if (!g.visible) return

    time.current += dt
    const t = time.current

    // Repaint the texture every frame: real DOM via drawElementImage, else card.
    if (!paintElement(ctx, sourceCard, TEX_W, TEX_H)) {
      drawTalkCardFallback(ctx, TEX_W, TEX_H, { accent, time: t })
    }
    texture.needsUpdate = true

    // Breathe: form from stars → hold readable → scatter into the galaxy → repeat.
    const u = (t % LOOP) / LOOP
    let d
    if (u < 0.13) d = 1 - THREE.MathUtils.smootherstep(u / 0.13, 0, 1)
    else if (u < 0.6) d = 0
    else if (u < 0.82) d = THREE.MathUtils.smootherstep((u - 0.6) / 0.22, 0, 1)
    else d = 1
    dissolveRef.current = d

    // Orbit the planet in world X–Z (camera looks roughly +X, so the +X arc tucks
    // behind the planet → it eclipses the card), with a small Y bob.
    const ang = t * 0.34
    g.position.set(
      center.x + Math.cos(ang) * orbitRadius,
      center.y + Math.sin(ang) * orbitRadius * 0.34,
      center.z + Math.sin(ang) * orbitRadius
    )
    g.lookAt(camera.position) // billboard so the formed card stays readable
    if (tilt.current) {
      tilt.current.rotation.y = 0.3 * Math.sin(t * 0.5)
      tilt.current.rotation.x = 0.15 * Math.sin(t * 0.62)
      tilt.current.scale.setScalar(0.82 + 0.18 * a)
    }
    if (glowMat.current) glowMat.current.opacity = a * (1 - 0.7 * d)
  })

  return (
    <group ref={root} visible={false}>
      <group ref={tilt}>
        <DissolveCard
          texture={texture}
          width={CARD_W}
          height={CARD_H}
          cols={184}
          rows={115}
          spread={7}
          size={2.2}
          intensity={0.7}
          dissolveRef={dissolveRef}
          opacityRef={opacityRef}
        />
        {/* soft accent halo behind it → bloom + "glowing object" read */}
        <mesh position={[0, 0, -0.06]} renderOrder={-1}>
          <planeGeometry args={[CARD_W * 1.5, CARD_H * 1.7]} />
          <meshBasicMaterial
            ref={glowMat}
            map={glowTexture}
            transparent
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}
