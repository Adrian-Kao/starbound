import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
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
  const finaleLines = useMemo(() => [
    config.teamName,
    config.members.map((member) => member.fullName).join('　'),
    ...config.closingMessage.slice(0, 2),
  ], [config.closingMessage, config.members, config.teamName])
  const lineProgressRefs = useMemo(
    () => finaleLines.map(() => ({ current: 0 })),
    [finaleLines],
  )
  const fallbackProgressRef = useRef(0)
  const menuProgressRef = useRef(0)
  const flashProgressRef = useRef(0)
  const flashTweenRef = useRef<gsap.core.Tween | null>(null)

  const triggerTextFlash = useCallback(() => {
    if (menuOpen) return
    flashTweenRef.current?.kill()
    flashProgressRef.current = 0
    flashTweenRef.current = gsap.to(flashProgressRef, {
      current: 1,
      duration: reducedMotion ? 0.12 : 0.42,
      ease: 'power3.out',
      repeat: 1,
      repeatDelay: reducedMotion ? 0 : 0.06,
      yoyo: true,
    })
  }, [menuOpen, reducedMotion])

  useEffect(() => {
    lineProgressRefs.forEach((line) => { line.current = 0 })
    fallbackProgressRef.current = 0
    menuProgressRef.current = 0
    flashProgressRef.current = 0
    const timeline = gsap.timeline()
    const duration = reducedMotion ? 0.42 : 2.55
    lineProgressRefs.forEach((line, index) => {
      timeline.to(line, { current: 1, duration, ease: 'power3.inOut' }, reducedMotion ? index * 0.08 : index * 0.46)
    })
    timeline.to(fallbackProgressRef, { current: 1, duration: reducedMotion ? 0.58 : 4.1, ease: 'power3.inOut' }, 0)
    timeline.to(menuProgressRef, { current: 1, duration: reducedMotion ? 0.25 : 0.85, ease: 'power2.out' }, reducedMotion ? 0.26 : 2.75)
    return () => {
      timeline.kill()
      flashTweenRef.current?.kill()
    }
  }, [lineProgressRefs, reducedMotion])

  return (
    <main className="finale-scene" onClickCapture={triggerTextFlash}>
      <div className="finale-canvas" aria-hidden="true">
        {webgl ? (
          <Canvas camera={{ position: [0, 0, 6], fov: 46 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
            <color attach="background" args={['#030611']} />
            <fog attach="fog" args={['#030611', 6, 16]} />
            <Suspense fallback={null}>
              <BackgroundStars seed="finale-deep-field" count={1650} radius={11} drift={0.008} />
              <FinaleParticles lines={finaleLines} lineProgressRefs={lineProgressRefs} menuProgressRef={menuProgressRef} flashProgressRef={flashProgressRef} />
            </Suspense>
          </Canvas>
        ) : (
          <FallbackParticleCanvas text={finaleLines} seed="finale-fallback" progressRef={fallbackProgressRef} flashProgressRef={flashProgressRef} />
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
      <div className="sr-only" aria-live="polite">{finaleLines.join('，')}</div>
      {menuOpen && <LinkPanel links={config.links} onClose={() => onMenuChange(false)} onReset={onReset} />}
    </main>
  )
}
