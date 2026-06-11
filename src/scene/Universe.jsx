import { Stars } from '@react-three/drei'
import { Galaxy } from './Galaxy.jsx'
import { Nebula } from './Nebula.jsx'
import { Sun } from './Sun.jsx'
import { Planet } from './Planet.jsx'
import { LogoConstellation } from './LogoConstellation.jsx'
import { BrowserSupport } from './BrowserSupport.jsx'
import { Sandworm } from './Sandworm.jsx'
import { ReactAtom } from './ReactAtom.jsx'
import { HtmlPanel } from './HtmlPanel.jsx'
import { GALAXY } from './layout.js'
import { slides } from '../slides/index.js'
import { useStore } from '../state/useStore.js'

/**
 * The Syntax.fm + Sentry logo constellations live in clean deep space above the
 * solar system. They're only shown on the intro slides (index < 2) so they
 * don't clutter the talk proper.
 */
function IntroConstellations() {
  const index = useStore((s) => s.index)
  const id = slides[index]?.id
  // The QR constellation returns for the ai-close beat (Syntax/Sentry are far
  // off-frame from its camera, so showing the whole group there is harmless).
  const show =
    id === 'intro-syntax' ||
    id === 'intro-sentry' ||
    id === 'intro-qr' ||
    id === 'ai-close' ||
    id === 'outro-syntax'
  return (
    <group>
      <LogoConstellation
        src="/logos/syntax.svg"
        fallbackText="Syntax"
        color="#ffd23f"
        position={[-360, 420, 520]}
        size={170}
        density={0.32}
        show={show}
      />
      <LogoConstellation
        src="/logos/sentry.svg"
        fallbackText="Sentry"
        color="#8c5cff"
        position={[360, 420, 520]}
        size={170}
        density={0.7}
        show={show}
      />
      {/* QR code as a star field — white stars, dense enough that the modules
          stay scannable. Continues the leftward→rightward intro pan. */}
      <LogoConstellation
        src="/logos/qr.svg"
        fallbackText="QR"
        color="#ffffff"
        position={[1080, 420, 520]}
        size={180}
        density={0.85}
        show={show}
      />
    </group>
  )
}

export function Universe() {
  const index = useStore((s) => s.index)
  const wormShow = Boolean(slides[index]?.worm)
  const atomShow = slides[index]?.id === 'system'
  // Mount the panel only around its slide: while mounted it keeps an offscreen
  // DOM host + repaintable canvas alive (real cost with the drawElementImage
  // flag on), so the rest of the deck shouldn't carry it. ±1 slide keeps the
  // fade-out playing as you step away instead of popping.
  const htmlPanelIndex = slides.findIndex((s) => s.id === 'html-canvas-reveal')
  const htmlPanelNear = Math.abs(index - htmlPanelIndex) <= 1
  const htmlPanelShow = index === htmlPanelIndex
  return (
    <>
      <ambientLight intensity={0.15} />

      <Nebula />

      {/* Static distant stars filling the volume between system and galaxy. */}
      <Stars radius={120000} depth={20000} count={5000} factor={150} saturation={0} fade speed={0} />

      {/* The far, enormous galaxy — "the web." */}
      <Galaxy center={GALAXY.center} radius={GALAXY.radius} />

      {/* The local solar system. */}
      <Sun />
      {slides.map((s) => (s.planet ? <Planet key={s.id} {...s.planet} /> : null))}

      <IntroConstellations />

      {/* Shai-Hulud breaching the React planet during the supply-chain beat
          (deps burrowing through your project). Shown on slides with `worm`. */}
      <Sandworm position={[34, 1, 22]} radius={2.4} show={wormShow} />

      {/* The React logo AS a planet — a glowing cyan atom, shown alone on the
          "React is one planet" beat. Isolated at +z so framing it never catches
          the sun or the other planets. */}
      <ReactAtom position={[0, 12, 120]} show={atomShow} />

      {/* html-in-canvas FINALE: the talk's own card as a live CanvasTexture on a
          3D panel that the bleeding-edge planet eclipses (the world outside React,
          made literal). Shown on the `html-canvas-reveal` slide. */}
      {htmlPanelNear && (
        <HtmlPanel position={[132, 14, 44]} accent="#f5d0fe" show={htmlPanelShow} />
      )}

      {/* 3D browser-support readout (per-slide `support` field). */}
      <BrowserSupport />
    </>
  )
}
