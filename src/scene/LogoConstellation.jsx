import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Turns a logo into a constellation of stars. It rasterizes an image (or, as a
 * fallback, text) to a canvas, then scatters soft additive points across the
 * opaque pixels — same glowing-star look as the galaxy, so it reads premium
 * under bloom. Each point gets slight hue/brightness variation for life.
 *
 * Drop real artwork at /public/logos/<name>.png (white shape on transparent)
 * and it'll sample that; until then it renders `fallbackText`.
 */
const vertexShader = /* glsl */ `
  uniform float uSize;
  attribute float aScale;
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * (1.0 / sqrt(-mv.z));
    vColor = aColor;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.5);
    gl_FragColor = vec4(vColor, a);
  }
`

function sampleToPoints({ image, text, size, color, density = 0.4 }) {
  const SAMPLE = 260
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  let w, h
  if (image) {
    const s = SAMPLE / Math.max(image.width, image.height)
    w = Math.max(1, Math.round(image.width * s))
    h = Math.max(1, Math.round(image.height * s))
    canvas.width = w
    canvas.height = h
    ctx.drawImage(image, 0, 0, w, h)
  } else {
    w = SAMPLE
    h = Math.round(SAMPLE / 2)
    canvas.width = w
    canvas.height = h
    ctx.fillStyle = '#fff'
    ctx.font = `700 ${Math.round(h * 0.62)}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2)
  }

  const px = ctx.getImageData(0, 0, w, h).data
  const maxDim = Math.max(w, h)
  const jitter = size / maxDim
  const positions = []
  const scales = []
  const colors = []
  const base = new THREE.Color(color)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] < 110) continue
      if (Math.random() > density) continue
      // Flip x so text/logo reads correctly when the camera looks along +z.
      positions.push(
        -(x - w / 2) / maxDim * size + (Math.random() - 0.5) * jitter,
        -(y - h / 2) / maxDim * size + (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * size * 0.05
      )
      scales.push(Math.random() * 1.0 + 0.5)
      const c = base.clone().offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.28)
      colors.push(c.r, c.g, c.b)
    }
  }

  return {
    positions: new Float32Array(positions),
    scales: new Float32Array(scales),
    colors: new Float32Array(colors),
  }
}

export function LogoConstellation({
  src,
  fallbackText = 'Logo',
  color = '#ffd23f',
  position = [0, 0, 0],
  size = 200,
  pointSize = 95,
  density = 0.4,
}) {
  const [geom, setGeom] = useState(null)

  useEffect(() => {
    let cancelled = false
    const finish = (data) => !cancelled && setGeom(data)

    if (src) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => finish(sampleToPoints({ image: img, size, color, density }))
      img.onerror = () => finish(sampleToPoints({ text: fallbackText, size, color, density }))
      img.src = src
    } else {
      finish(sampleToPoints({ text: fallbackText, size, color, density }))
    }
    return () => {
      cancelled = true
    }
  }, [src, fallbackText, size, color, density])

  const uniforms = useMemo(() => ({ uSize: { value: pointSize } }), [pointSize])

  // Extremely slow float so the constellation feels alive without distracting.
  const group = useRef()
  const seed = useMemo(() => Math.random() * 100, [])
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime + seed
    group.current.position.y = position[1] + Math.sin(t * 0.12) * 3
    group.current.rotation.x = Math.sin(t * 0.08) * 0.025
    group.current.rotation.y = Math.cos(t * 0.06) * 0.03
  })

  if (!geom) return null
  return (
    <group ref={group} position={position}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geom.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[geom.colors, 3]} />
          <bufferAttribute attach="attributes-aScale" args={[geom.scales, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          transparent
        />
      </points>
    </group>
  )
}
