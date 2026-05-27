# Logo artwork for the intro constellations

Drop your real logos here and the intro slides will render them as star clusters:

- `syntax.png` — the Syntax.fm logo
- `sentry.png` — the Sentry logo

Tips for the best-looking constellation:

- **White (or light) shape on a transparent background.** The sampler scatters
  stars across opaque pixels; the per-star color comes from the slide, not the
  image, so a solid white silhouette works best.
- Roughly square or 2:1 artwork, a few hundred px on the long edge is plenty.
- Bolder, chunkier shapes read better as a constellation than thin line art.

Until these files exist, the slides fall back to text ("Syntax" / "Sentry").
Swap them in `src/slides/index.js` via the `LogoConstellation` `src` prop, or by
keeping these filenames.
