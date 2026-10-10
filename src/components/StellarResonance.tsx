import gsap from 'gsap'
import { useEffect, useMemo, useRef, useState } from 'react'
import { STARBOUND_TIMING, REDUCED_MOTION_TIMING } from '../config/animationConfig'

type Props = {
  pageIndex: number
  reducedMotion: boolean
  progressRef: React.MutableRefObject<number>
  onStart: () => void
  onComplete: () => void
}

const paths = [
  'M17 71 C28 55 30 31 48 26 S72 40 82 23 M47 27 C53 52 70 57 84 72 M30 56 L70 57',
  'M16 30 C30 44 36 66 54 70 S76 58 85 39 M29 44 C47 37 61 24 78 31 M54 70 L61 24',
  'M15 63 C31 69 39 46 48 31 S70 21 83 36 M31 66 C48 75 66 64 82 76 M48 31 L66 64',
]

const anchors = [
  [[17, 71], [30, 56], [48, 26], [70, 57], [82, 23], [84, 72]],
  [[16, 30], [29, 44], [54, 70], [61, 24], [78, 31], [85, 39]],
  [[15, 63], [31, 66], [48, 31], [66, 64], [83, 36], [82, 76]],
]

export function StellarResonance({ pageIndex, reducedMotion, progressRef, onStart, onComplete }: Props) {
  const [visualProgress, setVisualProgress] = useState(0)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const constellationPath = paths[pageIndex % paths.length]
  const constellationAnchors = useMemo(() => anchors[pageIndex % anchors.length], [pageIndex])

  useEffect(() => () => { tweenRef.current?.kill() }, [])

  const resonate = () => {
    if (tweenRef.current?.isActive()) return
    tweenRef.current?.kill()
    progressRef.current = 0
    setVisualProgress(0)
    onStart()
    const timing = reducedMotion ? REDUCED_MOTION_TIMING : STARBOUND_TIMING
    tweenRef.current = gsap.to(progressRef, {
      current: 1,
      duration: timing.resonanceSeconds,
      ease: 'power2.inOut',
      onUpdate: () => setVisualProgress(progressRef.current),
      onComplete: () => {
        setVisualProgress(1)
        onComplete()
      },
    })
  }

  return (
    <div className={`resonance-layer ${visualProgress > 0 ? 'is-active' : ''}`}>
      <svg className="resonance-svg" viewBox="0 0 100 100" aria-hidden="true">
        <path className="resonance-path resonance-path-glow" d={constellationPath} pathLength="1" style={{ strokeDashoffset: 1 - visualProgress }} />
        <path className="resonance-path" d={constellationPath} pathLength="1" style={{ strokeDashoffset: 1 - visualProgress }} />
        {constellationAnchors.map(([x, y], index) => (
          <circle
            className="resonance-anchor"
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={0.42 + index * 0.035}
            style={{ opacity: Math.max(0, Math.min(1, visualProgress * 7 - index * 0.66)) }}
          />
        ))}
      </svg>
      <button className="core-star-button" type="button" onClick={resonate} aria-label="點亮核心星，啟動星軌共鳴">
        <span className="core-star" aria-hidden="true" />
        <span className="resonance-hint">{visualProgress >= 1 ? '共鳴完成 · 可再次點亮' : '點亮核心星'}</span>
      </button>
    </div>
  )
}
