import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { Suspense, useCallback, useEffect, useRef, type Dispatch, type KeyboardEvent, type PointerEvent } from 'react'
import { stepRevealProgress, type AppState, type FlowAction } from '../state/revealFlow'
import { BackgroundStars } from './BackgroundStars'
import { ConstellationName } from './ConstellationName'
import { FallbackParticleCanvas } from './FallbackParticleCanvas'

type Props = {
  state: AppState
  dispatch: Dispatch<FlowAction>
  webgl: boolean
  reducedMotion: boolean
}

export function TelescopeViewport({ state, dispatch, webgl, reducedMotion }: Props) {
  const member = state.revealMembers[state.pageIndex]
  const progressRef = useRef(state.revealProgress)
  const offsetRef = useRef({ x: 0, y: 0 })
  const holdingRef = useRef(false)
  const draggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const completedRef = useRef(state.revealPhase === 'completed' || state.revealPhase === 'dragging')
  const progressRingRef = useRef<HTMLDivElement>(null)
  const progressLabelRef = useRef<HTMLSpanElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const lastDispatchRef = useRef(0)

  const paintProgress = useCallback((value: number) => {
    progressRingRef.current?.style.setProperty('--hold-progress', `${Math.round(value * 360)}deg`)
    if (progressLabelRef.current) progressLabelRef.current.textContent = `${Math.round(value * 100)}%`
  }, [])

  const finishReveal = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    holdingRef.current = false
    progressRef.current = 1
    paintProgress(1)
    dispatch({ type: 'COMPLETE_REVEAL' })
    if (stageRef.current) {
      gsap.fromTo(stageRef.current, { filter: 'brightness(1.7)' }, { filter: 'brightness(1)', duration: 0.72, ease: 'power2.out' })
    }
  }, [dispatch, paintProgress])

  useEffect(() => {
    progressRef.current = state.revealProgress
    offsetRef.current = { x: 0, y: 0 }
    completedRef.current = false
    holdingRef.current = false
    draggingRef.current = false
    paintProgress(state.revealProgress)
  }, [paintProgress, state.pageIndex])

  useEffect(() => {
    let animation = 0
    let previous = performance.now()
    const duration = reducedMotion ? 1.2 : 2.8
    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000)
      previous = now
      if (!completedRef.current && state.revealPhase !== 'transitioning') {
        progressRef.current = stepRevealProgress(progressRef.current, delta, holdingRef.current, duration)
        paintProgress(progressRef.current)
        if (progressRef.current >= 0.999) finishReveal()
        else if (now - lastDispatchRef.current > 110) {
          lastDispatchRef.current = now
          dispatch({ type: 'SET_REVEAL_PROGRESS', progress: progressRef.current, forming: holdingRef.current })
        }
      }
      animation = requestAnimationFrame(tick)
    }
    animation = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animation)
  }, [dispatch, finishReveal, paintProgress, reducedMotion, state.revealPhase])

  const startInteraction = (event: PointerEvent<HTMLDivElement>) => {
    if (state.revealPhase === 'transitioning') return
    event.currentTarget.setPointerCapture(event.pointerId)
    if (completedRef.current) {
      draggingRef.current = true
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
      }
      dispatch({ type: 'START_DRAG' })
    } else {
      holdingRef.current = true
    }
  }

  const moveInteraction = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const worldPerPixel = 5.05 / Math.max(1, bounds.width)
    const x = dragStartRef.current.offsetX + (event.clientX - dragStartRef.current.x) * worldPerPixel
    const y = dragStartRef.current.offsetY - (event.clientY - dragStartRef.current.y) * worldPerPixel
    const radius = Math.hypot(x, y)
    const maxOffset = 0.58
    const factor = radius > maxOffset ? maxOffset / radius : 1
    offsetRef.current = { x: x * factor, y: y * factor }
  }

  const endInteraction = (event?: PointerEvent<HTMLDivElement>) => {
    holdingRef.current = false
    if (draggingRef.current) {
      draggingRef.current = false
      dispatch({ type: 'END_DRAG' })
    }
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === ' ' || event.key === 'Enter') && !completedRef.current) {
      event.preventDefault()
      holdingRef.current = true
    }
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      holdingRef.current = false
    }
  }

  const accessibleComplete = () => {
    if (completedRef.current) return
    progressRef.current = 1
    paintProgress(1)
    finishReveal()
  }

  const advance = () => {
    if (!completedRef.current || state.revealPhase === 'transitioning') return
    if (state.pageIndex === 2) {
      dispatch({ type: 'START_RETURN' })
      return
    }
    dispatch({ type: 'START_PAGE_TRANSITION' })
    if (stageRef.current) {
      gsap.to(stageRef.current, {
        opacity: 0,
        rotate: state.pageIndex % 2 === 0 ? 1.2 : -1.2,
        duration: reducedMotion ? 0.2 : 0.64,
        ease: 'power2.in',
        onComplete: () => {
          progressRef.current = 0
          dispatch({ type: 'NEXT_PAGE' })
          gsap.set(stageRef.current, { rotate: 0 })
          gsap.to(stageRef.current, { opacity: 1, duration: reducedMotion ? 0.2 : 0.6, ease: 'power2.out' })
        },
      })
    }
  }

  if (!member) return <div className="configuration-error">找不到本頁組員資料，請檢查 TEAM_DATA.md。</div>
  const complete = state.completedPages[state.pageIndex]
  const seed = `${member.id}-${state.pageIndex}-star-region`

  return (
    <main className="telescope-scene">
      <header className="telescope-header">
        <span className="eyebrow">DEEP SKY OBSERVATION</span>
        <strong>{String(state.pageIndex + 1).padStart(2, '0')} <i /> 03</strong>
      </header>

      <div className="lens-layout">
        <div ref={stageRef} className="lens-shell">
          <div className="lens-notches" aria-hidden="true" />
          <div className="lens-viewport">
            {webgl ? (
              <Canvas camera={{ position: [0, 0, 6], fov: 43 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
                <color attach="background" args={['#03101f']} />
                <fog attach="fog" args={['#03101f', 5.6, 13]} />
                <Suspense fallback={null}>
                  <BackgroundStars seed={`${seed}-back`} count={1050} radius={8} color={state.pageIndex === 1 ? '#d6deff' : '#bfeaff'} drift={0.018 + state.pageIndex * 0.004} />
                  <ConstellationName text={member.fullName} seed={seed} progressRef={progressRef} offsetRef={offsetRef} />
                </Suspense>
              </Canvas>
            ) : (
              <FallbackParticleCanvas text={member.fullName} seed={seed} progressRef={progressRef} offsetRef={offsetRef} />
            )}

            <div
              className={`interaction-surface ${complete ? 'is-draggable' : 'is-forming'}`}
              role="button"
              tabIndex={0}
              aria-label={complete ? `拖曳 ${member.fullName} 的星座` : '長按以讓星星排列成組員姓名'}
              onPointerDown={startInteraction}
              onPointerMove={moveInteraction}
              onPointerUp={endInteraction}
              onPointerCancel={endInteraction}
              onLostPointerCapture={endInteraction}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
            />

            {!complete ? (
              <div className="hold-guidance" aria-hidden="true">
                <div ref={progressRingRef} className="hold-progress"><span ref={progressLabelRef}>0%</span></div>
                <p>長按星空</p>
                <small>讓星星找到彼此</small>
              </div>
            ) : (
              <div className="drag-guidance" aria-hidden="true"><span>↕</span> 拖曳星座，探索星空</div>
            )}
            <div className="lens-coordinate" aria-hidden="true">RA {12 + state.pageIndex * 3}h · DEC +{18 + state.pageIndex * 7}°</div>
          </div>
        </div>

        <button
          className={`scene-advance ${complete ? 'is-ready' : ''} ${state.pageIndex === 2 ? 'is-return' : ''}`}
          type="button"
          onClick={advance}
          disabled={!complete || state.revealPhase === 'transitioning'}
          aria-label={state.pageIndex === 2 ? '返回完整星空' : '前往下一片星空'}
        >
          <span>{state.pageIndex === 2 ? '返回星空' : '下一片星空'}</span>
          <i aria-hidden="true" />
        </button>
      </div>

      <button className="accessible-reveal" type="button" onClick={accessibleComplete} disabled={complete}>
        {complete ? '姓名星座已完成' : '無法長按？按這裡完成聚星'}
      </button>
      <p className="sr-only" aria-live="polite">{complete ? `星星已排列出 ${member.fullName}` : ''}</p>
    </main>
  )
}
