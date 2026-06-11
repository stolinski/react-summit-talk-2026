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
 * `ctx.drawElementImage()` rasterizes a live DOM card into a <canvas>; that
 * canvas is a THREE.CanvasTexture on a plane floating beside the bleeding-edge
 * planet. Deliberately NO effects — the shock is the plain fact: that's real,
 * live DOM (blinking caret and all) sitting inside the WebGL universe. (The
 * star-scatter party trick lives on the flat `html-canvas` slide; an earlier
 * version repeated it here and it upstaged the point.)
 *
 * Real API ships in Chrome 148 behind a flag (see htmlInCanvas.js); with it off
 * we hand-draw a faithful copy of the card, so the slide is identical bar the
 * rasterizer. Calm motion per the house rule — a slow drift, nothing more.
 */

const TEX_W = 1024
const TEX_H = 640
const CARD_W = 9.2
const CARD_H = CARD_W * (TEX_H / TEX_W)

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

export function HtmlPanel({
  position = [132, 14, 44], // orbit center = the bleeding-edge planet
  orbitRadius = 5.4,
  accent = '#f5d0fe',
  show = false,
}) {
  const root = useRef() // floats + billboards toward the camera
  const tilt = useRef() // gentle 3D rock so it never reads as a flat sticker
  const mat = useRef()
  const amp = useRef(0)
  const time = useRef(0)
  const { camera, gl } = useThree()

  const { canvas, ctx, sourceCard, texture } = useMemo(() => {
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
    return { canvas, ctx, sourceCard, texture }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      texture.dispose()
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

    // Repaint the texture every frame: real DOM via drawElementImage, else card.
    if (!paintElement(ctx, sourceCard, TEX_W, TEX_H)) {
      drawTalkCardFallback(ctx, TEX_W, TEX_H, { accent, time: t })
    }
    texture.needsUpdate = true

    // Park on the camera side of the planet with a slow drift — readable the
    // whole time, never eclipsed.
    const front = Math.atan2(
      camera.position.z - center.z,
      camera.position.x - center.x
    )
    const ang = front + 0.1 * Math.sin(t * 0.2)
    g.position.set(
      center.x + Math.cos(ang) * orbitRadius,
      center.y + 0.3 * Math.sin(t * 0.27),
      center.z + Math.sin(ang) * orbitRadius
    )
    g.lookAt(camera.position) // billboard so the card stays readable
    if (tilt.current) {
      tilt.current.rotation.y = 0.18 * Math.sin(t * 0.5)
      tilt.current.rotation.x = 0.09 * Math.sin(t * 0.62)
      tilt.current.scale.setScalar(0.82 + 0.18 * a)
    }
    if (mat.current) mat.current.opacity = a
  })

  return (
    <group ref={root} visible={false}>
      <group ref={tilt}>
        <mesh>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshBasicMaterial
            ref={mat}
            map={texture}
            transparent
            toneMapped={false}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}
