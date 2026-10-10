import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

type TrailPoint = { x: number; y: number; createdAt: number }

export type StarTrailHandle = {
  push: (x: number, y: number) => void
  clear: () => void
}

export const StarTrail = forwardRef<StarTrailHandle>(function StarTrail(_, forwardedRef) {
  const pointsRef = useRef<TrailPoint[]>([])
  const [points, setPoints] = useState<TrailPoint[]>([])

  useImperativeHandle(forwardedRef, () => ({
    push(x, y) {
      const last = pointsRef.current.at(-1)
      if (last && Math.hypot(last.x - x, last.y - y) < 1.7) return
      pointsRef.current = [...pointsRef.current.slice(-18), { x, y, createdAt: performance.now() }]
    },
    clear() {
      pointsRef.current = []
      setPoints([])
    },
  }), [])

  useEffect(() => {
    let frame = 0
    const tick = () => {
      const cutoff = performance.now() - 900
      pointsRef.current = pointsRef.current.filter((point) => point.createdAt > cutoff)
      setPoints([...pointsRef.current])
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  if (points.length < 2) return null
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')

  return (
    <svg className="star-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} pathLength="1" />
      {points.slice(-7).map((point, index) => (
        <circle key={point.createdAt} cx={point.x} cy={point.y} r={0.18 + index * 0.035} />
      ))}
    </svg>
  )
})
