import { useEffect } from 'react'
import { useStore } from './useStore.js'

/**
 * Keyboard-driven, deterministic navigation — the only safe way to drive a talk.
 *   →  / Space / PageDown : next slide
 *   ←  / PageUp           : previous slide
 *   0-9                   : jump straight to a slide (great for Q&A)
 *   f                     : fullscreen
 */
export function useKeyboardNav() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return // ignore held-key auto-repeat
      const { next, prev, goto } = useStore.getState()
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      } else if (/^[0-9]$/.test(e.key)) {
        goto(Number(e.key))
      } else if (e.key === 'f') {
        document.documentElement.requestFullscreen?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
