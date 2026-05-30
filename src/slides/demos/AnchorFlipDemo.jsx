import { useRef, useState } from 'react'

/**
 * The job people install Floating UI / Popper.js / Tippy for: a menu anchored
 * to a trigger that FLIPS to the other side when it would run off-screen. Here
 * the positioning is pure CSS — `position-anchor` ties the menu to the button,
 * `position-area` puts it below, and `position-try-fallbacks` flips it above /
 * to the side when there's no room. Zero positioning JS.
 *
 * The only JavaScript is the drag (pointer events moving the button) — and
 * that's honest: dragging IS interactive. As you drag, the browser recomputes
 * the menu's side every frame. We never touch the menu.
 */
const STAGE_W = 560 // 1080p design px — the overlay is a scaled stage
const STAGE_H = 360 // tall enough that the menu has real room to flip above/below
const CHIP_W = 132
const CHIP_H = 46
const PAD = 8 // keep the trigger off the very edge so the flipped menu fits

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

export function AnchorFlipDemo() {
  const stageRef = useRef(null)
  const grab = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState({
    x: STAGE_W / 2 - CHIP_W / 2,
    y: STAGE_H / 2 - CHIP_H / 2,
  })

  // Map a pointer event to stage-local DESIGN px (the stage is CSS-scaled, so
  // we divide out the scale via the rendered vs. design width).
  const toLocal = (e) => {
    const r = stageRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * STAGE_W,
      y: ((e.clientY - r.top) / r.height) * STAGE_H,
    }
  }

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toLocal(e)
    grab.current = { x: p.x - pos.x, y: p.y - pos.y }
  }

  const onPointerMove = (e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const p = toLocal(e)
    setPos({
      x: clamp(p.x - grab.current.x, PAD, STAGE_W - CHIP_W - PAD),
      y: clamp(p.y - grab.current.y, PAD, STAGE_H - CHIP_H - PAD),
    })
  }

  return (
    <div className="anchor-stage" ref={stageRef}>
      <button
        className="anchor-chip"
        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        ⠿ Drag me
      </button>

      <menu className="anchor-pop">
        <li>Profile</li>
        <li>Settings</li>
        <li className="anchor-sep">Sign out</li>
      </menu>
    </div>
  )
}
