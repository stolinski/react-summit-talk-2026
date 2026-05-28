/**
 * A cover-flow gallery that scrubs as you scroll: each card scales up and turns
 * to face you as it passes center, then falls back as it leaves. The whole
 * effect is `animation-timeline: view()` — every card animates off its own
 * position in the scroller. No scroll listeners, no rAF, no library.
 */
const CARDS = [1, 2, 3, 4, 5, 6, 7]

export function ScrollScrubDemo() {
  return (
    <div className="scrubber">
      {CARDS.map((n) => (
        <div className="scrub-card" key={n} style={{ '--i': n }}>
          {n}
        </div>
      ))}
    </div>
  )
}
