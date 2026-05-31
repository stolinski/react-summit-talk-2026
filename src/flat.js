// Battery-saver mode. Add `?flat` to the URL to drop the entire WebGL universe
// (the R3F <Canvas>: planets, galaxy, bloom, custom shaders) and render just the
// DOM deck over a flat background — for editing content without the GPU/battery
// hit. All slides, demos, code blocks and keyboard nav work unchanged; what you
// lose is scene-only: the camera fly-throughs and the 3D browser-support coins.
export const FLAT = new URLSearchParams(location.search).has('flat')
