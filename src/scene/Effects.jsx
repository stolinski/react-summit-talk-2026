import { useMemo } from 'react'
import { Vector2 } from 'three'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { Effect } from 'postprocessing'

/**
 * Cinematic post pipeline. Bloom keeps a high luminance threshold so only
 * genuinely bright things (the core, star highlights) glow — planets stay as
 * planets instead of blowing out — but the radius runs a touch wide for a
 * dreamier, more premium falloff. A whisper of *radial* chromatic aberration
 * adds a lens quality at the frame edges (the overlay text is DOM, so it's never
 * touched). No film grain: it was the main source of per-frame flicker.
 */

/**
 * Final-output dither: the composer runs in 16-bit float, but the canvas is
 * 8-bit, and the deck lives in ultra-dark gradients (nebula clouds span ~12 of
 * 255 levels) — they quantize into visible banding that reads as "compression",
 * worst in the sun's glow falloff. ±1 LSB of STATIC triangular noise (hashed
 * from pixel coords, no time term — so no flicker, per the house rule) breaks
 * the steps up below the threshold of vision. Must stay the LAST effect.
 */
const ditherFrag = /* glsl */ `
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 p = uv * resolution;
    float r1 = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    float r2 = fract(sin(dot(p + 0.5, vec2(26.651, 21.134))) * 28001.8384);
    float tri = (r1 + r2 - 1.0) / 255.0;
    outputColor = vec4(inputColor.rgb + tri, inputColor.a);
  }
`

class DitherEffect extends Effect {
  constructor() {
    super('DitherEffect', ditherFrag)
  }
}
export function Effects() {
  // Barely-there at center, a hair of color fringing at the edges.
  const caOffset = useMemo(() => new Vector2(0.0006, 0.0006), [])
  const dither = useMemo(() => new DitherEffect(), [])

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
      <primitive object={dither} />
    </EffectComposer>
  )
}
