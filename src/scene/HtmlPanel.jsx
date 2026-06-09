import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  HTML_IN_CANVAS_SUPPORTED,
  paintElement,
  drawTalkCardFallback,
} from '../lib/htmlInCanvas.js'

/**
 * THE html-in-canvas FINALE — the talk's own card, pulled INTO the universe.
 *
 * For the whole talk the readable DOM has floated *over* the WebGL (a drei
 * <Html> sticker on the glass): it can't bloom, and a planet can't pass in front
 * of it. Here we invert that. `ctx.drawElementImage()` rasterizes a live DOM
 * card into a 2D <canvas>; that canvas is a THREE.CanvasTexture on a real mesh —
 * so the card now blooms (Effects.jsx) and the bleeding-edge planet genuinely
 * ECLIPSES it as the panel orbits behind. The DOM stopped being an overlay and
 * became a citizen of the 3D world.
 *
 * The real API ships in Chrome 148 behind a flag (see htmlInCanvas.js). With the
 * flag OFF — local dev, or a stage projector that didn't flip it — we hand-draw
 * a faithful copy of the card with plain Canvas 2D, so the reveal still lands
 * (the motion, bloom and eclipse are identical; only the rasterizer differs).
 *
 * Gated by the `html-canvas-reveal` slide via Universe (`show`); materializes,
 * billboards toward the camera with a gentle 3D rock, and slowly orbits the
 * planet so it rises out of and sets behind the limb. Calm motion per the house
 * rule — smooth transforms only, no per-frame noise.
 */

const TEX_W = 1024
const TEX_H = 640
const CARD_W = 9.2 // world units (matches the 1.6 texture aspect)
const CARD_H = CARD_W * (TEX_H / TEX_W)

// Build the live source card (real DOM) that drawElementImage rasterizes. It
// must be a child of the <canvas layoutsubtree>; it's laid out but never painted
// to screen (the canvas bitmap is what shows). Only built when the API exists.
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
  // a real blinking caret, so the rasterized texture visibly lives
  const style = document.createElement('style')
  style.textContent =
    '@keyframes hc-blink{50%{opacity:0}} .hc-caret{animation:hc-blink 1s steps(1) infinite}'
  card.appendChild(style)
  return card
}

// Soft radial halo behind the panel so the whole card reads as a glowing object
// (gives the bloom something to grab even where the card itself is dark).
function makeGlowTexture(accent) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128)
  const col = new THREE.Color(accent)
  const rgb = `${(col.r * 255) | 0}, ${(col.g * 255) | 0}, ${(col.b * 255) | 0}`
  g.addColorStop(0, `rgba(${rgb}, 0.55)`)
  g.addColorStop(0.4, `rgba(${rgb}, 0.22)`)
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
  const cardMat = useRef()
  const glowMat = useRef()
  const amp = useRef(0)
  const time = useRef(0)
  const { camera, gl } = useThree()

  // The drawing surface (CanvasTexture source) + the live source card.
  const { canvas, ctx, sourceCard, texture, glowTexture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = TEX_W
    canvas.height = TEX_H
    let sourceCard = null
    if (HTML_IN_CANVAS_SUPPORTED) {
      // The canvas must opt its children into layout; the card lives inside it.
      canvas.setAttribute('layoutsubtree', '')
      const host = document.createElement('div')
      host.setAttribute('data-html-in-canvas', '')
      host.style.cssText =
        'position:fixed; left:-20000px; top:0; width:' + TEX_W + 'px; height:' + TEX_H + 'px; pointer-events:none; opacity:0;'
      sourceCard = buildSourceCard(accent)
      canvas.appendChild(sourceCard)
      host.appendChild(canvas)
      document.body.appendChild(host)
    }
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = gl.capabilities.getMaxAnisotropy?.() ?? 1
    const glowTexture = makeGlowTexture(accent)
    return { canvas, ctx, sourceCard, texture, glowTexture }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tear down the offscreen DOM + GPU resources on unmount.
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
    g.visible = a > 0.01
    if (!g.visible) return

    time.current += dt
    const t = time.current

    // Repaint the texture: real DOM via drawElementImage, else hand-drawn card.
    if (!paintElement(ctx, sourceCard, TEX_W, TEX_H)) {
      drawTalkCardFallback(ctx, TEX_W, TEX_H, { accent, time: t })
    }
    texture.needsUpdate = true

    // Orbit the planet in world X–Z (camera looks roughly +X, so the +X arc of
    // the orbit passes BEHIND the planet → it eclipses the card), with a small
    // Y bob so it rises and sets rather than circling flat.
    const ang = t * 0.34
    g.position.set(
      center.x + Math.cos(ang) * orbitRadius,
      center.y + Math.sin(ang) * orbitRadius * 0.34,
      center.z + Math.sin(ang) * orbitRadius
    )
    // Billboard toward the camera so the card stays readable through the orbit…
    g.lookAt(camera.position)
    // …then a gentle rock on the inner group proves it's a real 3D surface.
    if (tilt.current) {
      tilt.current.rotation.y = 0.32 * Math.sin(t * 0.5)
      tilt.current.rotation.x = 0.16 * Math.sin(t * 0.62)
      const s = 0.78 + 0.22 * a
      tilt.current.scale.setScalar(s)
    }
    if (cardMat.current) cardMat.current.opacity = a
    if (glowMat.current) glowMat.current.opacity = a * 0.9
  })

  return (
    <group ref={root} visible={false}>
      <group ref={tilt}>
        {/* the card itself — DoubleSide so a deep rock never shows a black back */}
        <mesh renderOrder={2}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshBasicMaterial
            ref={cardMat}
            map={texture}
            transparent
            toneMapped={false}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* soft accent halo behind it → bloom + "glowing object" read */}
        <mesh position={[0, 0, -0.05]} renderOrder={1}>
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
