import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useStore } from '../state/useStore.js'
import { slides } from '../slides/index.js'

/**
 * Flies the camera to the active slide's waypoint whenever the index changes.
 * CameraControls.setLookAt(...pos, ...target, true) smooth-damps over `smoothTime`,
 * so navigation feels like *travelling* between planets rather than cutting.
 *
 * Mouse drag is left enabled (nice for live exploration); every nav re-frames,
 * so you can never get lost.
 */
export function CameraRig() {
  const controls = useRef(null)
  const index = useStore((s) => s.index)

  useEffect(() => {
    const cam = slides[index].camera
    if (!controls.current) return
    // Per-slide pacing: the galaxy reveal sets a long smoothTime for a slow,
    // majestic pull-back; planet hops stay quicker.
    controls.current.smoothTime = cam.smoothTime ?? 1.6
    controls.current.setLookAt(...cam.pos, ...cam.target, true)
  }, [index])

  return <CameraControls ref={controls} makeDefault smoothTime={1.6} />
}
