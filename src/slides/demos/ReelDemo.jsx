/**
 * The plainest possible scroll-snap: a vertical, Instagram-reel feed. Each post
 * is one viewport tall and the page snaps to it as you flick — the full
 * full-screen-feed gesture with no carousel library, no JS, no state. Two CSS
 * rules carry it: the feed snaps on the y axis, every post is a snap target.
 */
const POSTS = [
  { handle: 'syntax', caption: 'this could have been a div' },
  { handle: 'sentry', caption: 'no library, just scroll-snap' },
  { handle: 'graffiti', caption: 'the platform already does this' },
  { handle: 'scott', caption: 'flick up — it snaps every time' },
]

export function ReelDemo() {
  return (
    <div className="reel">
      {POSTS.map((p, i) => (
        <div className="reel-post" style={{ '--i': i + 1 }} key={p.handle}>
          <span className="reel-play">▶</span>
          <div className="reel-meta">
            <b>@{p.handle}</b>
            <span>{p.caption}</span>
          </div>
          <div className="reel-rail">
            <span>♥</span>
            <span>💬</span>
            <span>↗</span>
          </div>
        </div>
      ))}
    </div>
  )
}
