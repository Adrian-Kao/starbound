import { describe, expect, it } from 'vitest'
import { initialAppState, mapAssemblyProgress, revealReducer, stepPrimeProgress, type AppState } from '../state/revealFlow'

describe('reveal state machine', () => {
  it('does not enter the telescope without three reveal members', () => {
    const state = revealReducer({ ...initialAppState, scene: 'entering-lens' }, { type: 'ENTER_TELESCOPE' })
    expect(state.scene).toBe('entering-lens')
  })

  it('does not change page before reveal completion', () => {
    const state = revealReducer({ ...initialAppState, scene: 'telescope' }, { type: 'START_PAGE_TRANSITION' })
    expect(state.pageIndex).toBe(0)
    expect(state.revealPhase).toBe('scattered')
  })

  it('does not allow the third page to return before its name has formed', () => {
    const state: AppState = {
      ...initialAppState,
      scene: 'telescope',
      pageIndex: 2,
      completedPages: [true, true, false],
    }
    const blocked = revealReducer(state, { type: 'START_RETURN' })
    expect(blocked.scene).toBe('telescope')
    expect(blocked.revealPhase).toBe('scattered')

    const completed = revealReducer(state, { type: 'COMPLETE_REVEAL' })
    const returning = revealReducer(completed, { type: 'START_RETURN' })
    expect(returning.scene).toBe('returning')
  })

  it('allows a completed first page to transition and resets its progress', () => {
    let state: AppState = { ...initialAppState, scene: 'telescope' }
    state = revealReducer(state, { type: 'COMPLETE_REVEAL' })
    state = revealReducer(state, { type: 'START_PAGE_TRANSITION' })
    state = revealReducer(state, { type: 'NEXT_PAGE' })
    expect(state.pageIndex).toBe(1)
    expect(state.revealProgress).toBe(0)
    expect(state.completedPages[0]).toBe(true)
  })

  it('requires a short 0.8 second hold and retreats if released early', () => {
    const priming = stepPrimeProgress(0, 0.4, true)
    const retreating = stepPrimeProgress(priming, 0.12, false)
    expect(priming).toBeCloseTo(0.5)
    expect(retreating).toBeCloseTo(0)
    expect(stepPrimeProgress(0, 0.8, true)).toBe(1)
  })

  it('maps the autonomous 6.2 second assembly through all visual phases', () => {
    expect(mapAssemblyProgress(0)).toBe(0)
    expect(mapAssemblyProgress(1.2)).toBeCloseTo(0.15)
    expect(mapAssemblyProgress(4.4)).toBeCloseTo(0.76)
    expect(mapAssemblyProgress(5.6)).toBeCloseTo(0.97)
    expect(mapAssemblyProgress(6.2)).toBe(1)
  })

  it('keeps release independent from autonomous formation and allows resonance after completion', () => {
    let state: AppState = { ...initialAppState, scene: 'telescope' }
    state = revealReducer(state, { type: 'PRIME_REVEAL' })
    state = revealReducer(state, { type: 'START_FORMING' })
    state = revealReducer(state, { type: 'SET_REVEAL_PROGRESS', progress: 0.42 })
    expect(state.revealPhase).toBe('forming')
    expect(state.revealProgress).toBeCloseTo(0.42)
    state = revealReducer(state, { type: 'COMPLETE_REVEAL' })
    state = revealReducer(state, { type: 'START_RESONANCE' })
    expect(state.revealPhase).toBe('resonating')
    state = revealReducer(state, { type: 'END_RESONANCE' })
    expect(state.revealPhase).toBe('completed')
  })
})
