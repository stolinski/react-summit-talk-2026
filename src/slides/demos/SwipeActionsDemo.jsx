import { useLayoutEffect, useRef, useState } from 'react'

/**
 * The iOS swipe-to-reveal row everyone reaches for a gesture library to build
 * (`react-swipeable`, a swipeable-list, framer-motion drag) — pan handlers,
 * drag state, velocity, spring-back physics. Here there is none of it. This is
 * Graffiti's `.swipe`: each row is a horizontal `scroll-snap` container laid out
 * `auto 1fr auto`, and the MIDDLE cell is sized `100cqw` — exactly the row's
 * width — so the two action buttons sit just offscreen on either side. The
 * browser's native horizontal scroll IS the swipe; `scroll-snap-align` springs
 * it back to center or holds an action open. No JS gesture code at all.
 *
 * The only JS here is stage convenience: a click toggles the delete action open
 * (you can't trackpad-swipe each row in front of a room), plus a layout pass
 * that rests each row centered — without it a row loads snapped to its leftmost
 * point (showing the pin) because initial scrollLeft is 0. The snapping itself,
 * and the real swipe gesture, stay 100% CSS.
 */
const SEED = [
  { id: 1, from: 'Syntax', subject: 'New episode just dropped', time: '9:41', hue: 45 },
  { id: 2, from: 'Sentry', subject: 'Issue resolved in production', time: '8:12', hue: 265 },
  { id: 3, from: 'Vercel', subject: 'Deployment is ready', time: 'Tue', hue: 200 },
  { id: 4, from: 'GitHub', subject: 'Review requested on #482', time: 'Mon', hue: 150 },
]

export function SwipeActionsDemo() {
  const [rows, setRows] = useState(SEED)
  const [pinned, setPinned] = useState(() => new Set())
  const refs = useRef(new Map())

  // Rest each row at its centered snap point so both actions start hidden.
  // (Mandatory snap would otherwise land scrollLeft 0 = the pin showing.)
  useLayoutEffect(() => {
    for (const el of refs.current.values()) {
      if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    }
  }, [rows])

  const toggle = (id) => {
    const el = refs.current.get(id)
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const center = max / 2
    const centered = Math.abs(el.scrollLeft - center) < 8
    el.scrollTo({ left: centered ? max : center, behavior: 'smooth' })
  }

  const remove = (id) => setRows((r) => r.filter((m) => m.id !== id))
  const pin = (id) =>
    setPinned((p) => {
      const next = new Set(p)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="swipe-inbox">
      <div className="swipe-bar">
        <span>Inbox</span>
        <span className="swipe-hint">‹ swipe ›</span>
      </div>
      <ul className="swipe-list">
        {rows.map((m) => (
          <li
            className="swipe"
            key={m.id}
            ref={(el) => {
              if (el) refs.current.set(m.id, el)
              else refs.current.delete(m.id)
            }}
          >
            {/* first child = left action */}
            <button className="swipe-act pin" onClick={() => pin(m.id)}>
              {pinned.has(m.id) ? 'Unpin' : 'Pin'}
            </button>

            {/* second child = the visible row, sized to 100cqw */}
            <button className="swipe-row" type="button" onClick={() => toggle(m.id)}>
              <span className="swipe-avatar" style={{ '--h': m.hue }}>
                {m.from[0]}
              </span>
              <span className="swipe-text">
                <b>
                  {pinned.has(m.id) && <i className="swipe-star">★</i>}
                  {m.from}
                </b>
                <span>{m.subject}</span>
              </span>
              <span className="swipe-time">{m.time}</span>
            </button>

            {/* third child = right action */}
            <button className="swipe-act del" onClick={() => remove(m.id)}>
              Delete
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="swipe-empty">Inbox zero ✦</li>}
      </ul>
    </div>
  )
}
