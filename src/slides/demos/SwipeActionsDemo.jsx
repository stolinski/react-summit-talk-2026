/**
 * Graffiti's `.swipe`, with ZERO JavaScript. Each row is a horizontal
 * `scroll-snap` container laid out `auto 1fr auto`, and the MIDDLE cell is sized
 * `100cqw` — exactly the row's width — so the two action buttons sit just
 * offscreen on either side. The browser's native horizontal scroll IS the swipe.
 *
 * This is the "swipe-back" version (Graffiti's default `.swipe`, not its `.stop`
 * modifier): the centered cell is the ONLY snap point, so a released swipe
 * always springs straight back to center. No drag handlers, no state, no spring
 * physics — and nothing to reset between runs. Swipe a row with a two-finger
 * trackpad gesture and the action peeks out, then snaps home on release.
 */
const ROWS = [
  { from: 'Syntax', subject: 'New episode just dropped', time: '9:41', hue: 45 },
  { from: 'Sentry', subject: 'Issue resolved in production', time: '8:12', hue: 265 },
  { from: 'Vercel', subject: 'Deployment is ready', time: 'Tue', hue: 200 },
  { from: 'GitHub', subject: 'Review requested on #482', time: 'Mon', hue: 150 },
]

export function SwipeActionsDemo() {
  return (
    <div className="swipe-inbox">
      <div className="swipe-bar">
        <span>Inbox</span>
        <span className="swipe-hint">‹ swipe ›</span>
      </div>
      <ul className="swipe-list">
        {ROWS.map((m) => (
          <li className="swipe" key={m.from}>
            {/* first child = left action */}
            <button className="swipe-act pin">Pin</button>

            {/* second child = the visible row, sized to 100cqw */}
            <div className="swipe-row">
              <span className="swipe-avatar" style={{ '--h': m.hue }}>
                {m.from[0]}
              </span>
              <span className="swipe-text">
                <b>{m.from}</b>
                <span>{m.subject}</span>
              </span>
              <span className="swipe-time">{m.time}</span>
            </div>

            {/* third child = right action */}
            <button className="swipe-act del">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
