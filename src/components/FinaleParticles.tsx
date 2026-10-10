import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import type { Point3 } from '../utils/sampleTextToPoints'
import { samplePolylineToPoints, sampleTextToPoints } from '../utils/sampleTextToPoints'
import { ParticleCloud } from './ParticleCloud'

type Props = {
  lines: string[]
  textProgressRef: React.MutableRefObject<number>
  menuProgressRef: React.MutableRefObject<number>
}

export function FinaleParticles({ lines, textProgressRef, menuProgressRef }: Props) {
  const { size, viewport } = useThree()
  const [textTargets, setTextTargets] = useState<Point3[]>([])

  useEffect(() => {
    let active = true
    const create = async () => {
      await document.fonts?.ready
      if (!active) return
      const mobile = size.width < 700
      setTextTargets(sampleTextToPoints(lines, {
        worldWidth: Math.min(viewport.width * (mobile ? 0.9 : 0.72), mobile ? 4.2 : 7.4),
        worldHeight: Math.min(viewport.height * 0.58, 4.1),
        maxPoints: mobile ? 1600 : 2800,
        seed: 'closing-message-glyph',
        lineHeight: 1.42,
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
      {textTargets.length > 0 && (
        <ParticleCloud
          targets={textTargets}
          seed="closing-scatter"
          progressRef={textProgressRef}
          scatterWidth={viewport.width * 1.15}
          scatterHeight={viewport.height * 1.15}
          color="#bfeaff"
          coreColor="#ffffff"
          scale={size.width < 700 ? 1.35 : 1.55}
        />
      )}
      <ParticleCloud
        targets={menuTargets}
        seed="menu-scatter"
        progressRef={menuProgressRef}
        scatterWidth={2.2}
        scatterHeight={2.2}
        color="#f1d6a6"
        coreColor="#ffffff"
        scale={1.15}
      />
    </>
  )
}
