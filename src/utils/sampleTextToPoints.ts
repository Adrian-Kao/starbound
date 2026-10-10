import { seededRandom } from './seededRandom'

export type Point3 = { x: number; y: number; z: number }

export const STAR_FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif'

type SampleOptions = {
  worldWidth: number
  worldHeight: number
  maxPoints: number
  seed: string
  canvasWidth?: number
  canvasHeight?: number
  lineHeight?: number
  alphaThreshold?: number
}

export function sampleTextToPoints(text: string | string[], options: SampleOptions): Point3[] {
  const lines = (Array.isArray(text) ? text : [text]).map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0 || typeof document === 'undefined') return []

  const width = options.canvasWidth ?? 1200
  const height = options.canvasHeight ?? 680
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return []

  const lineHeight = options.lineHeight ?? 1.28
  const maxTextWidth = width * 0.84
  const maxTextHeight = height * 0.78
  let fontSize = Math.min(lines.length === 1 ? 420 : 280, maxTextHeight / (lines.length * lineHeight))
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `700 ${fontSize}px ${STAR_FONT}`
  const widest = () => Math.max(...lines.map((line) => context.measureText(line).width))
  while (fontSize > 28 && widest() > maxTextWidth) {
    fontSize -= 4
    context.font = `700 ${fontSize}px ${STAR_FONT}`
  }

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#fff'
  const blockHeight = (lines.length - 1) * fontSize * lineHeight
  lines.forEach((line, index) => {
    context.fillText(line, width / 2, height / 2 - blockHeight / 2 + index * fontSize * lineHeight)
  })

  const pixels = context.getImageData(0, 0, width, height).data
  const candidates: Array<{ x: number; y: number; alpha: number }> = []
  const step = fontSize > 100 ? 3 : 2
  const threshold = options.alphaThreshold ?? 92
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = pixels[(y * width + x) * 4 + 3]
      if (alpha >= threshold) candidates.push({ x, y, alpha })
    }
  }

  const random = seededRandom(options.seed)
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[candidates[index], candidates[target]] = [candidates[target], candidates[index]]
  }

  const selected = candidates.slice(0, options.maxPoints)
  return selected.map((point) => ({
    x: ((point.x / width) - 0.5) * options.worldWidth,
    y: (0.5 - point.y / height) * options.worldHeight,
    z: (random() - 0.5) * 0.055,
  }))
}

export function samplePolylineToPoints(
  lines: Array<[[number, number], [number, number]]>,
  spacing: number,
  seed: string,
): Point3[] {
  const random = seededRandom(seed)
  return lines.flatMap(([from, to]) => {
    const distance = Math.hypot(to[0] - from[0], to[1] - from[1])
    const count = Math.max(2, Math.ceil(distance / spacing))
    return Array.from({ length: count }, (_, index) => {
      const t = index / (count - 1)
      return {
        x: from[0] + (to[0] - from[0]) * t + (random() - 0.5) * spacing * 0.22,
        y: from[1] + (to[1] - from[1]) * t + (random() - 0.5) * spacing * 0.22,
        z: (random() - 0.5) * 0.04,
      }
    })
  })
}
