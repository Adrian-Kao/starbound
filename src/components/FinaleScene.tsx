import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { Suspense, useEffect, useRef } from 'react'
import type { TeamConfig } from '../config/teamTypes'
import { BackgroundStars } from './BackgroundStars'
import { FinaleParticles } from './FinaleParticles'
import { FallbackParticleCanvas } from './FallbackParticleCanvas'
import { LinkPanel } from './LinkPanel'

type Props = {
  config: TeamConfig
  webgl: boolean
  reducedMotion: boolean
  menuOpen: boolean
  onMenuChange: (open: boolean) => void
  onReset: () => void
}

export function FinaleScene({ config, webgl, reducedMotion, menuOpen, onMenuChange, onReset }: Props) {
  const lineProgressRefs = useRef([{ current: 0 }, { current: 0 }, { current: 0 }]).current
  const fallbackProgressRef = useRef(0)
  const menuProgressRef = useRef(0)

  useEffect(() => {
    lineProgressRefs.forEach((line) => { line.current = 0 })
    fallbackProgressRef.current = 0
    menuProgressRef.current = 0
    const timeline = gsap.timeline()
    const duration = reducedMotion ? 0.42 : 2.55
    lineProgressRefs.forEach((line, index) => {
      timeline.to(line, { current: 1, duration, ease: 'power3.inOut' }, reducedMotion ? index * 0.08 : index * 0.46)
    })
    timeline.to(fallbackProgressRef, { current: 1, duration: reducedMotion ? 0.5 : 3.4, ease: 'power3.inOut' }, 0)
    timeline.to(menuProgressRef, { current: 1, duration: reducedMotion ? 0.25 : 0.85, ease: 'power2.out' }, reducedMotion ? 0.18 : 2.05)
    return () => { timeline.kill() }
  }, [lineProgressRefs, reducedMotion])

  return (
    <main className="finale-scene">
      <div className="finale-canvas" aria-hidden="true">
        {webgl ? (
          <Canvas camera={{ position: [0, 0, 6], fov: 46 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
            <color attach="background" args={['#030611']} />
            <fog attach="fog" args={['#030611', 6, 16]} />
            <Suspense fallback={null}>
              <BackgroundStars seed="finale-deep-field" count={1650} radius={11} drift={0.008} />
              <FinaleParticles lines={config.closingMessage} lineProgressRefs={lineProgressRefs} menuProgressRef={menuProgressRef} />
            </Suspense>
          </Canvas>
        ) : (
          <FallbackParticleCanvas text={config.closingMessage} seed="finale-fallback" progressRef={fallbackProgressRef} />
        )}
      </div>
      <div className="finale-vignette" aria-hidden="true" />
      <header className="finale-header">
        <div>
          <span className="eyebrow">STARBOUND · FINAL COORDINATE</span>
          <strong>{config.teamName}</strong>
        </div>
      </header>
      <button className="star-menu-button" type="button" onClick={() => onMenuChange(true)} aria-label="開啟星光連結選單" aria-expanded={menuOpen}>
      </button>
      <div className="sr-only" aria-live="polite">{config.closingMessage.join('，')}</div>
      {menuOpen && <LinkPanel links={config.links} onClose={() => onMenuChange(false)} onReset={onReset} />}
    </main>
  )
}
