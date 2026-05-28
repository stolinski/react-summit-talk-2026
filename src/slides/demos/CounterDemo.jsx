/**
 * A stat counting up 0 → 1,000,000 with ZERO JavaScript. An @property-typed
 * <integer> is animated by keyframes; counter() prints it. No timer, no rAF.
 * (Re-runs every time you land on the slide, since the card remounts.)
 */
export function CounterDemo() {
  return <div className="counter" />
}
