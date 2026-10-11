import { Canvas, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { Suspense, useEffect, useRef } from 'react'
import type { TeamMember } from '../config/teamTypes'
import { BackgroundStars } from './BackgroundStars'
import { ConstellationName } from './ConstellationName'
import { FallbackParticleCanvas } from './FallbackParticleCanvas'

function PullBackCamera({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera } = useThree()
  useEffect(() => {
    const tween = gsap.to(camera.position, {
      z: 12,
      y: 1.2,
      duration: reducedMotion ? 0.4 : 2.45,
      ease: 'power3.inOut',
      onUpdate: () => camera.lookAt(0, 0, 0),
    })
    return () => { tween.kill() }
  }, [camera, reducedMotion])
  return null
}

type Props = {
  member: TeamMember
  webgl: boolean
  reducedMotion: boolean
  onComplete: () => void
}

export function ReturnSequence({ member, webgl, reducedMotion, onComplete }: Props) {
  const circleRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(1)
  const offsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!circleRef.current) return
    const timeline = gsap.timeline({ onComplete })
    timeline.to(circleRef.current, {
      scale: 0.62,
      y: '8vh',
      duration: reducedMotion ? 0.25 : 1.35,
      ease: 'power2.inOut',
    })
    timeline.to(circleRef.current, {
      scale: 0.12,
      y: '34vh',
      opacity: 0,
      filter: 'blur(3px)',
      duration: reducedMotion ? 0.25 : 1.25,
      ease: 'power3.in',
    })
    return () => { timeline.kill() }
  }, [onComplete, reducedMotion])

  return (
    <main className="return-scene" aria-label="鏡頭正在拉回完整星空">
      <div className="return-background" aria-hidden="true">
        {webgl ? (
          <Canvas camera={{ position: [0, 0, 7], fov: 48 }} dpr={[1, 1.5]}>
            <color attach="background" args={['#030611']} />
            <BackgroundStars seed="return-wide-sky" count={1500} radius={12} drift={0.014} />
          </Canvas>
        ) : null}
      </div>
      <div ref={circleRef} className="returning-lens" aria-hidden="true">
        {webgl ? (
          <Canvas camera={{ position: [0, 0, 6], fov: 43 }} dpr={[1, 1.5]}>
            <color attach="background" args={['#03101f']} />
            <Suspense fallback={null}>
              <BackgroundStars seed="return-lens-field" count={900} radius={8} />
              <ConstellationName text={member.fullName} seed="return-name" progressRef={progressRef} offsetRef={offsetRef} />
              <PullBackCamera reducedMotion={reducedMotion} />
            </Suspense>
          </Canvas>
        ) : (
          <FallbackParticleCanvas text={member.fullName} seed="return-fallback" progressRef={progressRef} offsetRef={offsetRef} />
        )}
      </div>
      <div className="return-caption"><span>LEAVE</span><strong>返回完整星空</strong></div>
    </main>
  )
}
