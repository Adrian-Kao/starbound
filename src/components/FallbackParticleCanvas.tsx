import { useEffect, useRef } from 'react'
import { sampleTextToPoints } from '../utils/sampleTextToPoints'
import { seededRandom } from '../utils/seededRandom'

type Props = {
  text: string | string[]
  seed: string
  progressRef: React.MutableRefObject<number>
  offsetRef: React.MutableRefObject<{ x: number; y: number }>
}

export function FallbackParticleCanvas({ text, seed, progressRef, offsetRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    let animation = 0
    let lastWidth = 0
    let lastHeight = 0
    let targets: ReturnType<typeof sampleTextToPoints> = []
    let starts: Array<{ x: number; y: number; size: number; phase: number }> = []
    let background: Array<{ x: number; y: number; size: number; phase: number }> = []
    const random = seededRandom(seed)

    const rebuild = async (width: number, height: number) => {
      await document.fonts?.ready
      targets = sampleTextToPoints(text, {
        worldWidth: 3.8,
        worldHeight: 2.3,
        maxPoints: width < 700 ? 700 : 1200,
        seed: `${seed}-fallback-glyph`,
      })
      starts = targets.map(() => {
        const angle = random() * Math.PI * 2
        const radius = Math.sqrt(random()) * Math.min(width, height) * 0.44
        return {
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          size: 0.7 + random() * 1.5,
          phase: random() * Math.PI * 2,
        }
      })
      background = Array.from({ length: width < 700 ? 180 : 330 }, () => ({
        x: random() * width,
        y: random() * height,
        size: 0.25 + random() * 1.25,
        phase: random() * Math.PI * 2,
      }))
    }

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      if (lastWidth !== Math.round(rect.width) || lastHeight !== Math.round(rect.height)) {
        lastWidth = Math.round(rect.width)
        lastHeight = Math.round(rect.height)
        canvas.width = Math.max(1, lastWidth * ratio)
        canvas.height = Math.max(1, lastHeight * ratio)
        void rebuild(lastWidth, lastHeight)
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const gradient = context.createRadialGradient(lastWidth * 0.5, lastHeight * 0.44, 0, lastWidth * 0.5, lastHeight * 0.5, lastWidth * 0.58)
      gradient.addColorStop(0, '#0e2947')
      gradient.addColorStop(0.55, '#071427')
      gradient.addColorStop(1, '#02040b')
      context.fillStyle = gradient
      context.fillRect(0, 0, lastWidth, lastHeight)
      for (const star of background) {
        context.globalAlpha = 0.28 + (Math.sin(time * 0.001 + star.phase) + 1) * 0.22
        context.fillStyle = '#cdeaff'
        context.fillRect(star.x, star.y, star.size, star.size)
      }

      const raw = Math.max(0, Math.min(1, progressRef.current))
      const eased = raw * raw * (3 - 2 * raw)
      const curve = Math.sin(raw * Math.PI)
      const scaleX = lastWidth / 5.1
      const scaleY = lastHeight / 5.1
      targets.forEach((target, index) => {
        const start = starts[index]
        if (!start) return
        const tx = lastWidth / 2 + target.x * scaleX + offsetRef.current.x * scaleX
        const ty = lastHeight / 2 - target.y * scaleY - offsetRef.current.y * scaleY
        const x = start.x + (tx - start.x) * eased + Math.sin(index * 1.7) * 22 * curve
        const y = start.y + (ty - start.y) * eased + Math.cos(index * 1.13) * 22 * curve
        const pulse = 0.72 + Math.sin(time * 0.002 + start.phase) * 0.25
        context.globalAlpha = pulse
        context.fillStyle = index % 9 === 0 ? '#f1d6a6' : '#dff6ff'
        context.beginPath()
        context.arc(x, y, start.size * (raw > 0.98 ? 1.15 : 1), 0, Math.PI * 2)
        context.fill()
      })
      context.globalAlpha = 1
      animation = requestAnimationFrame(draw)
    }
    animation = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animation)
  }, [offsetRef, progressRef, seed, text])

  return <canvas ref={canvasRef} className="fallback-canvas" aria-hidden="true" />
}
