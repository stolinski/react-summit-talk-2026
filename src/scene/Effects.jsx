import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

/**
 * Restrained post pipeline. Bloom is dialed back with a high luminance
 * threshold so only genuinely bright things (the core, star highlights) glow —
 * planets stay as planets instead of blowing out to white. No film grain:
 * it was a major source of the constant per-frame flicker.
 */
export function Effects() {
  return (
    <EffectComposer disableNormalPass>
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.5}
        mipmapBlur
        radius={0.7}
      />
      <Vignette offset={0.25} darkness={0.7} eskil={false} />
    </EffectComposer>
  )
}
