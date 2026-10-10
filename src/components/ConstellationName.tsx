import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import type { Point3 } from '../utils/sampleTextToPoints'
import { sampleTextToPoints } from '../utils/sampleTextToPoints'
import { ParticleCloud } from './ParticleCloud'

type Props = {
  text: string
  seed: string
  progressRef: React.MutableRefObject<number>
  offsetRef: React.MutableRefObject<{ x: number; y: number }>
}

export function ConstellationName({ text, seed, progressRef, offsetRef }: Props) {
  const { size } = useThree()
  const [targets, setTargets] = useState<Point3[]>([])

  useEffect(() => {
    let active = true
    const create = async () => {
      await document.fonts?.ready
      if (!active) return
      const isMobile = size.width < 700
      setTargets(sampleTextToPoints(text, {
        worldWidth: isMobile ? 3.5 : 3.9,
        worldHeight: isMobile ? 2.15 : 2.35,
        maxPoints: isMobile ? 900 : 1550,
        seed: `${seed}-glyph`,
      }))
    }
    void create()
    return () => { active = false }
  }, [seed, size.height, size.width, text])

  if (targets.length === 0) return null
  return (
    <ParticleCloud
      targets={targets}
      seed={`${seed}-scatter`}
      progressRef={progressRef}
      offsetRef={offsetRef}
      scatterWidth={4.7}
      scatterHeight={4.7}
      scale={1.08}
    />
  )
}
