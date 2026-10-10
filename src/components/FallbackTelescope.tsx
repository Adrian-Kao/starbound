import { useEffect, useRef } from 'react'
import { seededRandom } from '../utils/seededRandom'

export function FallbackTelescope() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const stars = Array.from({ length: 180 }, () => {
      const random = seededRandom(Math.random() * 100000)
      return { x: random(), y: random(), size: random() * 1.8 + 0.3, phase: random() * Math.PI * 2 }
    })
    let frame = 0
    let animation = 0
    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio, 2)
      if (canvas.width !== rect.width * ratio || canvas.height !== rect.height * ratio) {
        canvas.width = rect.width * ratio
        canvas.height = rect.height * ratio
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, rect.width, rect.height)
      const gradient = context.createRadialGradient(rect.width / 2, rect.height * 0.42, 0, rect.width / 2, rect.height * 0.42, rect.width * 0.55)
      gradient.addColorStop(0, '#0b2745')
      gradient.addColorStop(1, '#040713')
      context.fillStyle = gradient
      context.fillRect(0, 0, rect.width, rect.height)
      for (const star of stars) {
        context.globalAlpha = 0.35 + Math.sin(frame * 0.02 + star.phase) * 0.25
        context.fillStyle = '#dff4ff'
        context.beginPath()
        context.arc(star.x * rect.width, star.y * rect.height, star.size, 0, Math.PI * 2)
        context.fill()
      }
      context.globalAlpha = 1
      const cx = rect.width / 2
      const cy = rect.height * 0.48 + Math.sin(frame * 0.015) * 3
      context.save()
      context.translate(cx, cy)
      context.rotate(-0.14)
      const metal = context.createLinearGradient(-150, -45, 150, 45)
      metal.addColorStop(0, '#202938')
      metal.addColorStop(0.52, '#94a0af')
      metal.addColorStop(1, '#182131')
      context.fillStyle = metal
      context.roundRect(-150, -42, 300, 84, 28)
      context.fill()
      context.fillStyle = '#8fd9ff'
      context.beginPath()
      context.ellipse(150, 0, 26, 41, 0, 0, Math.PI * 2)
      context.fill()
      context.restore()
      context.strokeStyle = '#7f8997'
      context.lineWidth = 8
      context.beginPath()
      context.moveTo(cx, cy + 35)
      context.lineTo(cx - 85, cy + 185)
      context.moveTo(cx, cy + 35)
      context.lineTo(cx + 85, cy + 185)
      context.moveTo(cx, cy + 35)
      context.lineTo(cx, cy + 190)
      context.stroke()
      frame += 1
      animation = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animation)
  }, [])

  return <canvas ref={canvasRef} className="fallback-canvas" aria-hidden="true" />
}
