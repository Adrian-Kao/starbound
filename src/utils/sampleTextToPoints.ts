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

type LineGroupOptions = {
  worldWidth: number
  worldHeight: number
  maxPoints: number
  seed: string
  mobile?: boolean
  lineWidthRatios?: number[]
  lineOffsetRatios?: number[]
}

function stratifiedSelection(
  candidates: Array<{ x: number; y: number; alpha: number }>,
  maxPoints: number,
  seed: string,
): Array<{ x: number; y: number; alpha: number }> {
  if (candidates.length <= maxPoints) return candidates
  const random = seededRandom(seed)
  const cellSize = Math.max(4, Math.round(Math.sqrt(candidates.length / maxPoints) * 3.2))
  const buckets = new Map<string, Array<{ x: number; y: number; alpha: number }>>()
  candidates.forEach((point) => {
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`
    const bucket = buckets.get(key)
    if (bucket) bucket.push(point)
    else buckets.set(key, [point])
  })
  const groups = [...buckets.values()]
  for (let index = groups.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[groups[index], groups[target]] = [groups[target], groups[index]]
  }
  groups.forEach((group) => {
    for (let index = group.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1))
      ;[group[index], group[target]] = [group[target], group[index]]
    }
  })

  const selected: Array<{ x: number; y: number; alpha: number }> = []
  let round = 0
  while (selected.length < maxPoints) {
    let added = false
    for (const group of groups) {
      if (round < group.length) {
        selected.push(group[round])
        added = true
        if (selected.length === maxPoints) break
      }
    }
    if (!added) break
    round += 1
  }
  return selected
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
  const selected = stratifiedSelection(candidates, options.maxPoints, `${options.seed}-strata`)
  return selected.map((point) => ({
    x: ((point.x / width) - 0.5) * options.worldWidth,
    y: (0.5 - point.y / height) * options.worldHeight,
    z: (random() - 0.5) * 0.055,
  }))
}

export function sampleTextLineGroups(lines: string[], options: LineGroupOptions): Point3[][] {
  const sampleCanvasWidth = 1200
  const sampleCanvasHeight = 360
  const cleanLines = lines.map((line) => line.trim()).filter(Boolean)
  if (cleanLines.length === 0) return []
  const weights = cleanLines.map((line) => Math.sqrt(Math.max(1, [...line].length)))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const lineStep = options.worldHeight / (cleanLines.length + 0.45)
  const centerOffset = (cleanLines.length - 1) / 2

  return cleanLines.map((line, index) => {
    const isLast = index === cleanLines.length - 1
    const widthRatio = options.lineWidthRatios?.[index] ?? (isLast ? 0.98 : index === 0 ? 0.76 : 0.72)
    const budget = Math.max(420, Math.round(options.maxPoints * (weights[index] / totalWeight)))
    const customOffset = options.lineOffsetRatios?.[index] ?? 0
    const yOffset = (centerOffset - index + customOffset) * lineStep
    const lineWorldWidth = options.worldWidth * widthRatio
    // Keep the particle glyphs at the same X/Y aspect ratio as the sampling canvas.
    const lineWorldHeight = lineWorldWidth * (sampleCanvasHeight / sampleCanvasWidth)
    return sampleTextToPoints(line, {
      worldWidth: lineWorldWidth,
      worldHeight: lineWorldHeight,
      maxPoints: budget,
      seed: `${options.seed}-line-${index}`,
      canvasWidth: sampleCanvasWidth,
      canvasHeight: sampleCanvasHeight,
      alphaThreshold: 72,
    }).map((point) => ({ ...point, y: point.y + yOffset }))
  })
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
