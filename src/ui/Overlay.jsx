import { useStore } from '../state/useStore.js'
import { slides } from '../slides/index.js'
import { CodeBlock } from './CodeBlock.jsx'

/**
 * The readable layer. Everything legible — titles, code, live demos — is real
 * DOM floating over the WebGL canvas (crisp on any projector, accessible,
 * and itself a quiet proof of the talk's thesis: it's all just the platform).
 *
 * A slide renders whatever fields it declares. Add a demo by adding `demo: X`
 * to a slide in src/slides/index.js — no wiring required.
 */
export function Overlay() {
  const index = useStore((s) => s.index)
  const count = useStore((s) => s.count)
  const slide = slides[index]
  const Demo = slide.demo

  return (
    <div className="overlay">
      <div className={`card ${slide.id === 'title' ? 'card--title' : ''}`}>
        {slide.eyebrow && <p className="eyebrow">{slide.eyebrow}</p>}
        <h1>{slide.title}</h1>
        {slide.body && <p className="body">{slide.body}</p>}
        {slide.code && <CodeBlock>{slide.code}</CodeBlock>}
        {Demo && (
          <div className="demo">
            <Demo />
          </div>
        )}
      </div>

      <footer className="hud">
        <span>{slide.kicker ?? 'Outside React'}</span>
        <span>
          {index + 1} / {count}
        </span>
      </footer>
    </div>
  )
}
