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

// Persist the current slide in the URL (?slide=<id>) so a refresh or an HMR
// reload restores the beat you were on instead of snapping back to slide 0.
// Read once at store creation; write (via replaceState — no history spam) on
// every index change. The id is preferred (readable, survives reordering); a
// bare integer is accepted as an index fallback.
const SLIDE_PARAM = 'slide'

const indexFromUrl = () => {
  if (typeof window === 'undefined') return 0
  const raw = new URLSearchParams(window.location.search).get(SLIDE_PARAM)
  if (!raw) return 0
  const byId = slides.findIndex((s) => s.id === raw)
  if (byId !== -1) return byId
  const n = Number(raw)
  return Number.isInteger(n) ? clamp(n) : 0
}

const syncUrl = (index) => {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set(SLIDE_PARAM, slides[index]?.id ?? String(index))
  window.history.replaceState(null, '', url)
}

export const useStore = create((set, get) => ({
  index: indexFromUrl(),
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

// Keep ?slide= in sync with the active slide (only when the index actually
// changes — the store also bumps lastNavAt on every nav).
useStore.subscribe((s, prev) => {
  if (s.index !== prev.index) syncUrl(s.index)
})

// Dev-only: reach any slide from the console (the 0–9 keys only cover the first
// ten) — handy for rehearsing a single beat or driving screenshots.
//   __deck.gotoId('html-canvas-reveal')   ·   __deck.goto(33)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__deck = {
    store: useStore,
    goto: (i) => useStore.getState().goto(i),
    gotoId: (id) => useStore.getState().goto(slides.findIndex((s) => s.id === id)),
    ids: () => slides.map((s) => s.id),
  }
}
