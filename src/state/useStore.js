import { create } from 'zustand'
import { slides } from '../slides/index.js'

/**
 * Single source of truth for which slide we're on.
 * Lives in zustand so state can be shared across the <Canvas> boundary —
 * the CameraRig (inside the canvas) and the Overlay (DOM, outside it) both read it.
 */
export const useStore = create((set) => ({
  index: 0,
  count: slides.length,
  next: () => set((s) => ({ index: Math.min(s.index + 1, slides.length - 1) })),
  prev: () => set((s) => ({ index: Math.max(s.index - 1, 0) })),
  goto: (i) => set(() => ({ index: Math.max(0, Math.min(i, slides.length - 1)) })),
}))
