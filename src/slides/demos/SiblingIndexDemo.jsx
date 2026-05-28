/**
 * A bar chart where every bar's height, hue, and animation delay come from
 * sibling-index() — no inline style="--i", no JS. Each element simply knows its
 * own position among its siblings, so it staggers in on its own.
 */
const BARS = Array.from({ length: 12 })

export function SiblingIndexDemo() {
  return (
    <div className="siblings">
      {BARS.map((_, i) => (
        <div className="sib" key={i} />
      ))}
    </div>
  )
}
