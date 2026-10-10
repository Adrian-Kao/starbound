import { describe, expect, it } from 'vitest'
import { initialAppState, revealReducer, stepRevealProgress, type AppState } from '../state/revealFlow'

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

  it('allows a completed first page to transition and resets its progress', () => {
    let state: AppState = { ...initialAppState, scene: 'telescope' }
    state = revealReducer(state, { type: 'COMPLETE_REVEAL' })
    state = revealReducer(state, { type: 'START_PAGE_TRANSITION' })
    state = revealReducer(state, { type: 'NEXT_PAGE' })
    expect(state.pageIndex).toBe(1)
    expect(state.revealProgress).toBe(0)
    expect(state.completedPages[0]).toBe(true)
  })

  it('moves toward the glyph while held and smoothly retreats after release', () => {
    const forming = stepRevealProgress(0.25, 0.28, true, 2.8)
    const retreating = stepRevealProgress(forming, 0.09, false, 2.8)
    expect(forming).toBeCloseTo(0.35)
    expect(retreating).toBeCloseTo(0.25)
    expect(stepRevealProgress(0.02, 1, false)).toBe(0)
  })
})
