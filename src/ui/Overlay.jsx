import { useEffect } from 'react'
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
  // A slide with code is a "code-hero" slide: the code centers on screen and
  // the planet behind the frosted card becomes a backdrop glow, not the subject.
  const codeHero = Boolean(slide.code)

  // Fit the fixed 1920×1080 DOM stage to any viewport so the deck looks
  // identical at every projector resolution. The canvas stays full-bleed behind.
  useEffect(() => {
    const fit = () =>
      document.documentElement.style.setProperty(
        '--stage-scale',
        String(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
      )
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className={`overlay ${codeHero ? 'overlay--center' : ''}`}>
      <div
        key={slide.id}
        className={`card ${slide.id === 'title' ? 'card--title' : ''} ${
          codeHero ? 'card--code' : ''
        }`}
      >
        {slide.eyebrow && <p className="eyebrow">{slide.eyebrow}</p>}
        <h1>{slide.title}</h1>
        {slide.body && <p className="body">{slide.body}</p>}
        {slide.socials && (
          <div className="socials">
            {slide.socials.map((s) => (
              <span key={s} className="social">
                {s}
              </span>
            ))}
          </div>
        )}
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
