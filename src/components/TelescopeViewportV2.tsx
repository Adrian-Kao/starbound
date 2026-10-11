import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { Suspense, useCallback, useEffect, useRef, type Dispatch, type KeyboardEvent, type PointerEvent } from 'react'
import { REDUCED_MOTION_TIMING, STARBOUND_TIMING } from '../config/animationConfig'
import { mapAssemblyProgress, stepPrimeProgress, type AppState, type FlowAction } from '../state/revealFlow'
import type { PointerField } from '../utils/pointerField'
import { ConstellationName } from './ConstellationName'
import { FallbackParticleCanvas } from './FallbackParticleCanvas'
import { LensStarfield } from './LensStarfield'
import { OuterStarfield } from './OuterStarfield'
import { StarTrail, type StarTrailHandle } from './StarTrail'
import { StellarResonance } from './StellarResonance'

type Props = {
  state: AppState
  dispatch: Dispatch<FlowAction>
  webgl: boolean
  reducedMotion: boolean
}

export function TelescopeViewportV2({ state, dispatch, webgl, reducedMotion }: Props) {
  const member = state.revealMembers[state.pageIndex]
  const progressRef = useRef(state.revealProgress)
  const primeProgressRef = useRef(0)
  const holdingRef = useRef(false)
  const assemblingRef = useRef(false)
  const assemblyStartRef = useRef(0)
  const completedRef = useRef(state.completedPages[state.pageIndex])
  const pointerRef = useRef<PointerField>({ x: 20, y: 20, strength: 0 })
  const resonanceProgressRef = useRef(0)
  const progressRingRef = useRef<HTMLDivElement>(null)
  const progressLabelRef = useRef<HTMLSpanElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<StarTrailHandle>(null)
  const lastDispatchRef = useRef(0)
  const phaseRef = useRef(state.revealPhase)
  const timing = reducedMotion ? REDUCED_MOTION_TIMING : STARBOUND_TIMING

  useEffect(() => {
    phaseRef.current = state.revealPhase
  }, [state.revealPhase])

  const paintPrime = useCallback((value: number) => {
    progressRingRef.current?.style.setProperty('--hold-progress', `${Math.round(value * 360)}deg`)
    if (progressLabelRef.current) progressLabelRef.current.textContent = `${Math.round(value * 100)}%`
  }, [])

  const finishReveal = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    holdingRef.current = false
    assemblingRef.current = false
    progressRef.current = 1
    dispatch({ type: 'COMPLETE_REVEAL' })
    if (stageRef.current) {
      gsap.fromTo(stageRef.current, { filter: 'brightness(1.55)' }, {
        filter: 'brightness(1)', duration: timing.settleSeconds, ease: 'power2.out',
      })
    }
  }, [dispatch, timing.settleSeconds])

  const startAssembly = useCallback((now: number) => {
    if (assemblingRef.current || completedRef.current) return
    holdingRef.current = false
    assemblingRef.current = true
    assemblyStartRef.current = now
    progressRef.current = 0
    dispatch({ type: 'START_FORMING' })
  }, [dispatch])

  useEffect(() => {
    progressRef.current = state.revealProgress
    primeProgressRef.current = 0
    holdingRef.current = false
    assemblingRef.current = false
    completedRef.current = state.completedPages[state.pageIndex]
    pointerRef.current = { x: 20, y: 20, strength: 0 }
    resonanceProgressRef.current = 0
    trailRef.current?.clear()
    paintPrime(0)
  }, [paintPrime, state.pageIndex])

  useEffect(() => {
    let animation = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000)
      previous = now
      if (!completedRef.current && phaseRef.current !== 'transitioning') {
        if (assemblingRef.current) {
          const progress = mapAssemblyProgress((now - assemblyStartRef.current) / 1000, timing.assembleSeconds)
          progressRef.current = progress
          if (progress >= 1) {
            finishReveal()
          } else if (now - lastDispatchRef.current > 110) {
            lastDispatchRef.current = now
            dispatch({ type: 'SET_REVEAL_PROGRESS', progress })
          }
        } else {
          const previousPrime = primeProgressRef.current
          const prime = stepPrimeProgress(previousPrime, delta, holdingRef.current, timing.holdToStartSeconds)
          primeProgressRef.current = prime
          paintPrime(prime)
          if (prime >= 1) startAssembly(now)
          else if (prime === 0 && previousPrime > 0 && !holdingRef.current) dispatch({ type: 'CANCEL_PRIME' })
        }
      }
      animation = requestAnimationFrame(tick)
    }
    animation = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animation)
  }, [dispatch, finishReveal, paintPrime, startAssembly, timing.assembleSeconds, timing.holdToStartSeconds])

  const updatePointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width)))
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / Math.max(1, bounds.height)))
    pointerRef.current = { x: (x * 2 - 1) * 2.15, y: (1 - y * 2) * 2.15, strength: completedRef.current ? 1 : 0 }
    if (completedRef.current) trailRef.current?.push(x * 100, y * 100)
  }

  const startInteraction = (event: PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current === 'transitioning') return
    updatePointer(event)
    if (completedRef.current || assemblingRef.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    holdingRef.current = true
    dispatch({ type: 'PRIME_REVEAL' })
  }

  const endInteraction = (event?: PointerEvent<HTMLDivElement>) => {
    holdingRef.current = false
    if (event?.pointerType !== 'mouse') pointerRef.current.strength = 0
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === ' ' || event.key === 'Enter') && !completedRef.current && !assemblingRef.current) {
      event.preventDefault()
      if (!event.repeat) dispatch({ type: 'PRIME_REVEAL' })
      holdingRef.current = true
    }
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      holdingRef.current = false
    }
  }

  const advance = () => {
    const pageComplete = state.completedPages[state.pageIndex]
    if (!pageComplete || !completedRef.current || phaseRef.current === 'transitioning') return
    if (state.pageIndex === 2) {
      dispatch({ type: 'START_RETURN' })
      return
    }
    dispatch({ type: 'START_PAGE_TRANSITION' })
    if (stageRef.current) {
      gsap.to(stageRef.current, {
        opacity: 0, rotate: state.pageIndex % 2 === 0 ? 1.2 : -1.2,
        duration: timing.pageTransitionSeconds, ease: 'power2.in',
        onComplete: () => {
          progressRef.current = 0
          dispatch({ type: 'NEXT_PAGE' })
          gsap.set(stageRef.current, { rotate: 0 })
          gsap.to(stageRef.current, { opacity: 1, duration: timing.pageTransitionSeconds * 0.85, ease: 'power2.out' })
        },
      })
    }
  }

  if (!member) return <div className="configuration-error">找不到本頁組員資料，請檢查 TEAM_DATA.md。</div>
  const complete = state.completedPages[state.pageIndex]
  const canAdvance = complete && state.revealPhase !== 'transitioning'
  const seed = `${member.id}-${state.pageIndex}-star-region`
  const forming = state.revealPhase === 'forming'

  return (
    <main className="telescope-scene">
      <OuterStarfield seed={`${seed}-outer`} />
      <header className="telescope-header">
        <span className="eyebrow">OBSERVATION</span>
        <strong>{String(state.pageIndex + 1).padStart(2, '0')} <i /> 03</strong>
      </header>
      <div className="lens-layout">
        <div ref={stageRef} className="lens-shell">
          <div className="lens-notches" aria-hidden="true" />
          <div className="lens-viewport">
            {webgl ? (
              <Canvas camera={{ position: [0, 0, 6], fov: 43 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
                <color attach="background" args={['#03101f']} />
                <Suspense fallback={null}>
                  <LensStarfield seed={seed} pageIndex={state.pageIndex} pointerRef={pointerRef} interactive={complete} />
                  <ConstellationName text={member.fullName} seed={seed} progressRef={progressRef} pointerRef={pointerRef} resonanceProgressRef={resonanceProgressRef} />
                </Suspense>
              </Canvas>
            ) : (
              <FallbackParticleCanvas text={member.fullName} seed={seed} progressRef={progressRef} pointerRef={pointerRef} resonanceProgressRef={resonanceProgressRef} />
            )}
            <StarTrail ref={trailRef} />
            <div
              className={`interaction-surface ${complete ? 'is-resonant' : 'is-forming'}`}
              role={complete || forming ? undefined : 'button'} tabIndex={complete || forming ? -1 : 0}
              aria-label={complete ? `在 ${member.fullName} 的星圖上移動，擾動周圍星塵` : forming ? '星粒正在自動排列' : '長按以啟動姓名星粒聚合'}
              onPointerDown={startInteraction} onPointerMove={updatePointer} onPointerEnter={updatePointer}
              onPointerLeave={() => { pointerRef.current.strength = 0 }} onPointerUp={endInteraction}
              onPointerCancel={endInteraction} onLostPointerCapture={endInteraction}
              onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}
            />
            {!complete && !forming && (
              <div className={`hold-guidance ${state.revealPhase === 'priming' ? 'is-priming' : ''}`} aria-hidden="true">
                <div ref={progressRingRef} className="hold-progress"><span ref={progressLabelRef}>0%</span></div>
                <p>長按</p>
              </div>
            )}
            {forming && (
              <div className="assembly-status" aria-live="polite">
                <span>組員揭曉...</span><strong>{Math.round(state.revealProgress * 100)}%</strong>
                <i><b style={{ width: `${state.revealProgress * 100}%` }} /></i>
              </div>
            )}
            {complete && (
              <StellarResonance key={state.pageIndex} pageIndex={state.pageIndex} reducedMotion={reducedMotion}
                progressRef={resonanceProgressRef} onStart={() => dispatch({ type: 'START_RESONANCE' })}
                onComplete={() => dispatch({ type: 'END_RESONANCE' })} />
            )}
            <div className="lens-coordinate" aria-hidden="true">RA {12 + state.pageIndex * 3}h · DEC +{18 + state.pageIndex * 7}°</div>
          </div>
        </div>
        <button className={`scene-advance ${complete ? 'is-ready' : ''} ${state.revealPhase === 'resonating' ? 'is-resonating' : ''} ${state.pageIndex === 2 ? 'is-return' : ''}`}
          type="button" onClick={advance} disabled={!canAdvance} aria-disabled={!canAdvance}
          aria-label={state.pageIndex === 2 ? '返回完整星空' : '前往下一片星空'}>
          <span>{state.pageIndex === 2 ? '返回星空' : '下一片星空'}</span><i aria-hidden="true" />
        </button>
      </div>
      <button className="accessible-reveal" type="button" onClick={() => { progressRef.current = 1; finishReveal() }} disabled={complete || forming}>
        {complete ? '姓名星座已完成' : forming ? '正在排列' : '無法長按？按這裡完成聚星'}
      </button>
      <p className="sr-only" aria-live="polite">{complete ? `星星已排列出 ${member.fullName}，可點亮核心星` : ''}</p>
    </main>
  )
}
