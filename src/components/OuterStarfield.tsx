import { useEffect, useRef } from 'react'
import { seededRandom } from '../utils/seededRandom'

type Star = {
  x: number
  y: number
  depth: number
  size: number
  phase: number
  speed: number
  hue: number
}

export function OuterStarfield({ seed }: { seed: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const random = seededRandom(seed)
    let frame = 0
    let width = 0
    let height = 0
    let stars: Star[] = []

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const nextWidth = Math.max(1, Math.round(rect.width))
      const nextHeight = Math.max(1, Math.round(rect.height))
      if (nextWidth === width && nextHeight === height) return
      width = nextWidth
      height = nextHeight
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const count = Math.round(Math.min(width * height / 2500, width < 700 ? 250 : 620))
      stars = Array.from({ length: count }, () => ({
        x: random() * width,
        y: random() * height,
        depth: 0.18 + random() * 0.82,
        size: 0.35 + random() * 1.45,
        phase: random() * Math.PI * 2,
        speed: 0.6 + random() * 1.25,
        hue: random(),
      }))
    }

    const draw = (time: number) => {
      resize()
      context.clearRect(0, 0, width, height)

      const nebula = context.createRadialGradient(width * 0.22, height * 0.68, 0, width * 0.22, height * 0.68, width * 0.46)
      nebula.addColorStop(0, 'rgba(29, 74, 120, .09)')
      nebula.addColorStop(1, 'rgba(2, 6, 17, 0)')
      context.fillStyle = nebula
      context.fillRect(0, 0, width, height)

      for (const star of stars) {
        const drift = time * 0.000003 * star.speed * (0.3 + star.depth)
        const x = (star.x + Math.sin(star.phase + drift * 13) * 12 * star.depth + width) % width
        const y = (star.y + drift * height * star.depth) % height
        const alpha = (0.12 + star.depth * 0.52) * (0.7 + Math.sin(time * 0.0012 * star.speed + star.phase) * 0.3)
        const radius = star.size * (0.45 + star.depth * 0.8)
        context.globalAlpha = alpha
        context.fillStyle = star.hue > 0.86 ? '#f1d6a6' : star.hue < 0.14 ? '#dce4ff' : '#aee5ff'
        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fill()
      }
      context.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [seed])

  return <canvas ref={canvasRef} className="outer-starfield" aria-hidden="true" />
}
