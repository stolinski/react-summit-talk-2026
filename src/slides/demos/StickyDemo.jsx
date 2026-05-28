/**
 * A sticky header that restyles itself the instant it sticks — pure CSS, via a
 * scroll-state() container query. Scroll the panel: the header compacts and
 * gains a shadow when stuck. No scroll listener anywhere.
 */
export function StickyDemo() {
  return (
    <div className="sticky-scroller">
      <div className="sticky-head">
        <span className="sticky-title">Scroll me ↓</span>
      </div>
      <div className="sticky-body">
        <p>Keep scrolling — watch the header above.</p>
        <p>
          The header is <code>position: sticky</code> and a
          <code> scroll-state</code> container. The moment it sticks to the top,
          a container query restyles it.
        </p>
        <p>No IntersectionObserver. No scroll handler. No JavaScript at all.</p>
        <p>Just CSS reacting to its own scroll position.</p>
        <p>That used to be a guaranteed reach for a library.</p>
        <p>Now it's a few lines of stylesheet.</p>
        <p>Keep going…</p>
        <p>…almost there…</p>
        <p>That's the whole trick.</p>
      </div>
    </div>
  )
}
