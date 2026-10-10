import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import type { Point3 } from '../utils/sampleTextToPoints'
import { samplePolylineToPoints, sampleTextLineGroups } from '../utils/sampleTextToPoints'
import { ParticleCloud } from './ParticleCloud'

type Props = {
  lines: string[]
  lineProgressRefs: React.MutableRefObject<number>[]
  menuProgressRef: React.MutableRefObject<number>
  flashProgressRef: React.MutableRefObject<number>
}

export function FinaleParticles({ lines, lineProgressRefs, menuProgressRef, flashProgressRef }: Props) {
  const { size, viewport } = useThree()
  const [lineTargets, setLineTargets] = useState<Point3[][]>([])

  useEffect(() => {
    let active = true
    const create = async () => {
      await document.fonts?.ready
      if (!active) return
      const mobile = size.width < 700
      setLineTargets(sampleTextLineGroups(lines, {
        worldWidth: Math.min(viewport.width * (mobile ? 0.91 : 0.78), mobile ? 4.25 : 7.6),
        worldHeight: Math.min(viewport.height * (mobile ? 0.55 : 0.53), mobile ? 3.35 : 4.25),
        maxPoints: mobile ? 4000 : 8200,
        seed: 'closing-message-glyph',
        mobile,
        lineWidthRatios: lines.length === 4 ? [0.52, 0.93, 0.74, 0.82] : undefined,
        lineOffsetRatios: lines.length === 4 ? [0, 0, -0.12, -0.62] : undefined,
      }))
    }
    void create()
    return () => { active = false }
  }, [lines, size.height, size.width, viewport.height, viewport.width])

  const menuTargets = useMemo(() => {
    const centerX = viewport.width / 2 - (size.width < 700 ? 0.58 : 0.82)
    const centerY = viewport.height / 2 - (size.width < 700 ? 0.68 : 0.75)
    const half = size.width < 700 ? 0.28 : 0.38
    return samplePolylineToPoints([
      [[centerX - half, centerY + 0.2], [centerX + half, centerY + 0.2]],
      [[centerX - half, centerY], [centerX + half, centerY]],
      [[centerX - half, centerY - 0.2], [centerX + half, centerY - 0.2]],
    ], 0.025, 'star-menu-lines')
  }, [size.width, viewport.height, viewport.width])

  return (
    <>
      {lineTargets.map((targets, index) => lineProgressRefs[index] && (
        <ParticleCloud key={`${index}-${lines[index]}`} targets={targets} seed={`closing-scatter-${index}`}
          progressRef={lineProgressRefs[index]} scatterWidth={viewport.width * 1.12}
          flashProgressRef={flashProgressRef}
          scatterHeight={viewport.height * 1.08} color={index >= 2 ? '#eefaff' : '#adddff'}
          coreColor="#ffffff"
          scale={index >= 2 ? (size.width < 700 ? 1.28 : 1.42) : (size.width < 700 ? 1.05 : 1.12)}
          blending="normal" />
      ))}
      <ParticleCloud
        targets={menuTargets}
        seed="menu-scatter"
        progressRef={menuProgressRef}
        scatterWidth={2.2}
        scatterHeight={2.2}
        color="#f1d6a6"
        coreColor="#ffffff"
        scale={1.05}
        blending="normal"
      />
    </>
  )
}
