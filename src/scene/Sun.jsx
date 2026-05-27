import { useMemo } from 'react'
import * as THREE from 'three'
import { SUN_POSITION } from './layout.js'

/**
 * The local star at the heart of the solar system. A bright core sphere (bloom
 * turns it into a glowing disc) plus a soft camera-facing glow sprite for the
 * corona halo. Every planet is lit from this point.
 */
function useGlowTexture() {
  return useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0.0, 'rgba(255,244,214,0.9)')
    g.addColorStop(0.18, 'rgba(255,221,150,0.3)')
    g.addColorStop(0.45, 'rgba(255,180,90,0.06)')
    g.addColorStop(1.0, 'rgba(255,160,70,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  }, [])
}

export function Sun() {
  const glow = useGlowTexture()
  return (
    <group position={SUN_POSITION}>
      <mesh>
        <sphereGeometry args={[7, 48, 48]} />
        <meshBasicMaterial color="#ffe9bf" toneMapped={false} />
      </mesh>
      <sprite scale={[42, 42, 1]}>
        <spriteMaterial
          map={glow}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  )
}
