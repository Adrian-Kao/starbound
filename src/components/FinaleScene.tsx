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
  const textProgressRef = useRef(0)
  const menuProgressRef = useRef(0)
  const emptyOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const timeline = gsap.timeline()
    timeline.to(textProgressRef, { current: 1, duration: reducedMotion ? 0.45 : 2.7, ease: 'power3.inOut' })
    timeline.to(menuProgressRef, { current: 1, duration: reducedMotion ? 0.25 : 0.85, ease: 'power2.out' }, reducedMotion ? 0.18 : 1.65)
    return () => { timeline.kill() }
  }, [reducedMotion])

  return (
    <main className="finale-scene">
      <div className="finale-canvas" aria-hidden="true">
        {webgl ? (
          <Canvas camera={{ position: [0, 0, 6], fov: 46 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
            <color attach="background" args={['#030611']} />
            <fog attach="fog" args={['#030611', 6, 16]} />
            <Suspense fallback={null}>
              <BackgroundStars seed="finale-deep-field" count={1650} radius={11} drift={0.008} />
              <FinaleParticles lines={config.closingMessage} textProgressRef={textProgressRef} menuProgressRef={menuProgressRef} />
            </Suspense>
          </Canvas>
        ) : (
          <FallbackParticleCanvas text={config.closingMessage} seed="finale-fallback" progressRef={textProgressRef} offsetRef={emptyOffsetRef} />
        )}
      </div>
      <div className="finale-glow-copy" aria-hidden="true">
        {config.closingMessage.map((line, index) => <span key={`${index}-${line}`}>{line}</span>)}
      </div>
      <div className="finale-vignette" aria-hidden="true" />
      <header className="finale-header">
        <div>
          <span className="eyebrow">STARBOUND · FINAL COORDINATE</span>
          <strong>{config.teamName}</strong>
        </div>
      </header>
      <button className="star-menu-button" type="button" onClick={() => onMenuChange(true)} aria-label="開啟星光連結選單" aria-expanded={menuOpen}>
        <span aria-hidden="true"><i /><i /><i /></span>
      </button>
      <p className="finale-caption">我們不只是找到彼此，<br />也從此共享同一片星空。</p>
      <div className="sr-only" aria-live="polite">{config.closingMessage.join('，')}</div>
      {menuOpen && <LinkPanel links={config.links} onClose={() => onMenuChange(false)} onReset={onReset} />}
    </main>
  )
}
