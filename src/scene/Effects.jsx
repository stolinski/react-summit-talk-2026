import { useMemo } from 'react'
import { Vector2 } from 'three'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing'

/**
 * Cinematic post pipeline. Bloom keeps a high luminance threshold so only
 * genuinely bright things (the core, star highlights) glow — planets stay as
 * planets instead of blowing out — but the radius runs a touch wide for a
 * dreamier, more premium falloff. A whisper of *radial* chromatic aberration
 * adds a lens quality at the frame edges (the overlay text is DOM, so it's never
 * touched). No film grain: it was the main source of per-frame flicker.
 */
export function Effects() {
  // Barely-there at center, a hair of color fringing at the edges.
  const caOffset = useMemo(() => new Vector2(0.0006, 0.0006), [])

  return (
    <EffectComposer disableNormalPass>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.55}
        mipmapBlur
        radius={0.85}
      />
      <ChromaticAberration
        offset={caOffset}
        radialModulation
        modulationOffset={0.35}
      />
      <Vignette offset={0.22} darkness={0.78} eskil={false} />
    </EffectComposer>
  )
}
