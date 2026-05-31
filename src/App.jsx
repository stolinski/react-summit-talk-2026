import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Universe } from './scene/Universe.jsx'
import { CameraRig } from './scene/CameraRig.jsx'
import { Effects } from './scene/Effects.jsx'
import { Overlay } from './ui/Overlay.jsx'
import { useKeyboardNav } from './state/useKeyboardNav.js'
import { FLAT } from './flat.js'

export default function App() {
  useKeyboardNav()

  return (
    <>
      {/* `?flat` skips the WebGL universe entirely (no R3F mount = no GPU work)
          and shows a plain backdrop instead, for low-battery content editing. */}
      {FLAT ? (
        <div className="flat-bg" />
      ) : (
        /* logarithmicDepthBuffer lets us hold a single planet AND a 240-unit
           galaxy in the same scene without z-fighting across the huge zoom range. */
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, logarithmicDepthBuffer: true }}
          camera={{ position: [78, 16, 66], fov: 50, near: 0.1, far: 400000 }}
        >
          <color attach="background" args={['#02030a']} />
          <Suspense fallback={null}>
            <Universe />
          </Suspense>
          <CameraRig />
          <Effects />
        </Canvas>
      )}
      <Overlay />
    </>
  )
}
