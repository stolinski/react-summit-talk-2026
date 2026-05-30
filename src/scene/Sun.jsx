import { useMemo } from 'react'
import * as THREE from 'three'
import { SUN_POSITION } from './layout.js'

/**
 * The local star at the heart of the solar system. A bright core sphere (bloom
 * turns it into a glowing disc), a two-layer corona for a richer falloff, and an
 * anamorphic horizontal lens streak for a cinematic, "shot through a real lens"
 * look. Everything is a camera-facing sprite at the sun's position, so the flare
 * only shows when the sun is actually on screen — no global wash. Every planet
 * is lit from this point.
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

// A horizontal anamorphic streak: bright center fading to the ends, with a thin
// vertical gaussian so it's a crisp line of light, not a blob.
function useStreakTexture() {
  return useMemo(() => {
    const w = 512
    const h = 128
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const img = ctx.createImageData(w, h)
    for (let y = 0; y < h; y++) {
      const ny = (y / (h - 1)) * 2 - 1
      const vy = Math.exp(-ny * ny * 20) // thin vertical falloff
      for (let x = 0; x < w; x++) {
        const nx = (x / (w - 1)) * 2 - 1
        const hx = Math.pow(Math.max(0, 1 - Math.abs(nx)), 2.4) // bright center → ends
        const a = Math.min(1, hx * vy)
        const i = (y * w + x) * 4
        img.data[i] = 255
        img.data[i + 1] = 240
        img.data[i + 2] = 212
        img.data[i + 3] = a * 255
      }
    }
    ctx.putImageData(img, 0, 0)
    return new THREE.CanvasTexture(canvas)
  }, [])
}

export function Sun() {
  const glow = useGlowTexture()
  const streak = useStreakTexture()
  return (
    <group position={SUN_POSITION}>
      <mesh>
        <sphereGeometry args={[7, 48, 48]} />
        <meshBasicMaterial color="#ffe9bf" toneMapped={false} />
      </mesh>

      {/* inner corona */}
      <sprite scale={[42, 42, 1]}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      {/* wide, faint outer corona for a softer, more premium falloff */}
      <sprite scale={[105, 105, 1]}>
        <spriteMaterial
          map={glow}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          opacity={0.45}
        />
      </sprite>

      {/* anamorphic lens streak */}
      <sprite scale={[210, 20, 1]}>
        <spriteMaterial
          map={streak}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          opacity={0.8}
        />
      </sprite>
    </group>
  )
}
