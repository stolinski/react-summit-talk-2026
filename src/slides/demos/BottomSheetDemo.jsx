import { useRef } from 'react'

/**
 * The multi-detent bottom sheet people reach for `vaul` to get: it rests at
 * three positions — peek, half, full — and drags smoothly between them with
 * real momentum. The trick is that those rest positions are just CSS
 * `scroll-snap` points, so the browser's native scrolling IS the gesture. No
 * drag handler, no spring physics library, no open/half/full state in JS. The
 * backdrop even dims on its own via a scroll-driven animation.
 *
 * The geometry below is derived from one rule: visible sheet height
 *   = deviceHeight − panelTop + scrollTop.
 * Pick the three heights you want to rest at (PEEK/HALF/FULL) and the snap
 * offsets fall out, so the CSS and the (optional) click-to-hop stay in sync.
 */
const W = 360 // device width  (1080p design px — the overlay is a scaled stage)
const H = 460 // device height
const PEEK = 96 //  sheet visible when closed
const HALF = 250 // sheet visible at the middle detent
const FULL = 430 // sheet visible when open

const PANEL_TOP = H - PEEK //            364 — panel offset so "closed" == scrollTop 0
const T_HALF = HALF - H + PANEL_TOP //   154 — scroll offset of the half detent
const T_FULL = FULL - H + PANEL_TOP //   334 — scroll offset of the full detent (== max scroll)
const DETENTS = [0, T_HALF, T_FULL]
// The three transparent "rungs" stacked above the panel; each one's top edge is
// a snap point, so their heights are the gaps between detents.
const ZONES = [T_HALF, T_FULL - T_HALF, PANEL_TOP - T_FULL] // [154, 180, 30]

const SHARE = ['Syntax', 'Sentry', 'Notes', 'Mail', 'More']
const ACTIONS = ['Copy link', 'Add to favorites', 'Edit details']

export function BottomSheetDemo() {
  const ref = useRef(null)

  // Optional stage convenience: click the grip to hop to the next detent.
  // The snapping itself is pure CSS — this just spares a trackpad drag on stage.
  const hop = () => {
    const el = ref.current
    if (!el) return
    const next = DETENTS.find((t) => t > el.scrollTop + 8) ?? 0
    el.scrollTo({ top: next, behavior: 'smooth' })
  }

  return (
    <div className="bs-device" style={{ '--bs-w': `${W}px`, '--bs-h': `${H}px` }}>
      {/* Decorative app sitting behind the sheet. */}
      <div className="bs-app">
        <div className="bs-app-bar">
          <span>9:41</span>
          <span>Library</span>
          <span>＋</span>
        </div>
        <div className="bs-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div className="bs-tile" style={{ '--i': n }} key={n} />
          ))}
        </div>
      </div>

      {/* The sheet: a scroll-snap container whose rungs are the rest positions. */}
      <div className="bs-scroller" ref={ref}>
        <div className="bs-dim" />
        {ZONES.map((h, i) => (
          <div className="bs-zone" style={{ height: `${h}px` }} key={i} />
        ))}
        <div className="bs-panel" style={{ height: `${FULL}px` }}>
          <button className="bs-grip" onClick={hop} aria-label="Expand sheet" />
          <h4>Share to…</h4>
          <div className="bs-share">
            {SHARE.map((name, i) => (
              <span className="bs-app-icon" style={{ '--i': i + 1 }} key={name}>
                <b>{name[0]}</b>
                {name}
              </span>
            ))}
          </div>
          <ul className="bs-list">
            {ACTIONS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
