import { create } from 'zustand'
import { slides } from '../slides/index.js'

/**
 * Single source of truth for which slide we're on.
 * Lives in zustand so state can be shared across the <Canvas> boundary —
 * the CameraRig (inside the canvas) and the Overlay (DOM, outside it) both read it.
 *
 * next/prev are throttled: a single key intent should never advance two slides,
 * even if the keydown double-fires (OS auto-repeat, or duplicate listeners that
 * accrue during HMR). That was causing the Sentry slide to get skipped.
 */
const NAV_THROTTLE_MS = 300
const clamp = (i) => Math.max(0, Math.min(i, slides.length - 1))

export const useStore = create((set, get) => ({
  index: 0,
  count: slides.length,
  lastNavAt: 0,
  next: () => {
    const t = performance.now()
    if (t - get().lastNavAt < NAV_THROTTLE_MS) return
    set((s) => ({ index: clamp(s.index + 1), lastNavAt: t }))
  },
  prev: () => {
    const t = performance.now()
    if (t - get().lastNavAt < NAV_THROTTLE_MS) return
    set((s) => ({ index: clamp(s.index - 1), lastNavAt: t }))
  },
  goto: (i) => set({ index: clamp(i), lastNavAt: performance.now() }),
}))
