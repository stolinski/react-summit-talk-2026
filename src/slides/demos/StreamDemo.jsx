import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '../../ui/CodeBlock.jsx'

/**
 * Out-of-order streaming — https://developer.chrome.com/blog/declarative-partial-updates
 *
 * LEFT (live, simulated): a results list whose SLOTS are reserved up front, in
 * document order (1–5), but whose CONTENT streams in OUT OF ORDER and still
 * lands in the right slot. That's the whole trick: a `<?start name>…<?end>`
 * placeholder holds the spot, and each `<template for="…">` chunk fills its
 * marker whenever it arrives — no fetch, no innerHTML, no hydration step.
 *
 * RIGHT: the real declarative source (Chrome 148, experimental flag).
 *
 * The fill order is FIXED (3,1,5,2,4) so it reads as deliberately out-of-order
 * on every loop — no random churn, calm motion. The mock is JS-simulated only
 * because the real API needs the flag + an actually-streamed response; the code
 * shown is the genuine platform syntax.
 */
const RESULTS = [
  'react.dev',
  'web.dev',
  'developer.mozilla.org',
  'caniuse.com',
  'html.spec.whatwg.org',
]
// Slots fill in THIS order — deliberately scrambled so "out of order" is obvious.
const ARRIVAL = [2, 0, 4, 1, 3]
const STEP = 720 // ms between arrivals
const LEAD = 650 // ms before the first one lands
const HOLD = 1800 // ms to admire the full list before it replays

const CODE = `<ul id="results">
  <?start name="results"> Loading… <?end>
</ul>

<!-- each chunk fills the slot the moment
     it arrives — in any order, no JS -->
<template for="results">
  <li>web.dev</li>
  <?marker name="results">
</template>`

export function StreamDemo() {
  const [filled, setFilled] = useState(() => RESULTS.map(() => false))
  const timers = useRef([])

  useEffect(() => {
    let cancelled = false
    const run = () => {
      setFilled(RESULTS.map(() => false))
      ARRIVAL.forEach((slot, i) => {
        const t = setTimeout(() => {
          if (cancelled) return
          setFilled((f) => f.map((v, j) => (j === slot ? true : v)))
        }, LEAD + i * STEP)
        timers.current.push(t)
      })
      const loop = setTimeout(run, LEAD + ARRIVAL.length * STEP + HOLD)
      timers.current.push(loop)
    }
    run()
    return () => {
      cancelled = true
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [])

  return (
    <div className="stream">
      <section className="stream-panel">
        <div className="stream-bar">
          <span className="stream-dot" /> streaming response…
        </div>
        <ul className="stream-list">
          {RESULTS.map((r, i) => (
            <li key={i} className={`stream-row ${filled[i] ? 'is-filled' : ''}`}>
              <span className="stream-idx">{i + 1}</span>
              {filled[i] ? (
                <span className="stream-hit">
                  <span className="stream-url">{r}</span>
                  <span className="stream-check">✓</span>
                </span>
              ) : (
                <span className="stream-skel" />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="stream-code-col">
        <CodeBlock>{CODE}</CodeBlock>
        <p className="stream-compat">Chrome 148 · experimental flag</p>
      </section>
    </div>
  )
}
