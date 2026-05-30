/**
 * Two ways to get the same dropdown — framed as two supply chains.
 *
 * Left: the install. One package drags in its dependency tree; all of it is
 * code you didn't write, shipped to every user, with its own update churn and
 * attack surface. Right: the platform. The anchor-positioning CSS we already
 * use elsewhere in this deck — zero packages, nothing to trust, nothing to pin.
 *
 * Placeholder copy — Scott will rewrite. The package tree is real (Floating UI
 * pulls react-dom → dom → core → utils); the figures are illustrative.
 */
const TREE = [
  ['@floating-ui/react', 0],
  ['@floating-ui/react-dom', 1],
  ['@floating-ui/dom', 2],
  ['@floating-ui/core', 3],
  ['@floating-ui/utils', 4],
]

export function DependencyContrastDemo() {
  return (
    <div className="dep">
      <section className="dep-col dep-col--lib">
        <h3 className="dep-head">The usual way</h3>
        <code className="dep-cmd">$ npm i @floating-ui/react</code>
        <ul className="dep-tree">
          {TREE.map(([name, depth]) => (
            <li key={name} style={{ '--depth': depth }}>
              {name}
            </li>
          ))}
        </ul>
        <p className="dep-foot dep-foot--bad">
          5 packages you didn’t write — shipped to every user, forever yours to
          patch
        </p>
      </section>

      <div className="dep-vs">vs</div>

      <section className="dep-col dep-col--web">
        <h3 className="dep-head">The platform</h3>
        <pre className="dep-code">{`.menu {
  position-anchor: --btn;
  position-try-fallbacks: flip-block;
}`}</pre>
        <p className="dep-foot dep-foot--good">
          0 packages · 0 kB shipped · audited by the browser vendors
        </p>
      </section>
    </div>
  )
}
