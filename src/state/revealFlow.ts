import type { TeamConfig, TeamMember } from '../config/teamTypes'
import { findMemberByName, getOtherMembers } from '../config/parseTeamMarkdown'

export type Scene = 'landing' | 'name-entry' | 'entering-lens' | 'telescope' | 'returning' | 'finale'
export type RevealPhase = 'scattered' | 'priming' | 'forming' | 'completed' | 'resonating' | 'transitioning'

export type AppState = {
  scene: Scene
  currentUserId: string | null
  revealMembers: TeamMember[]
  pageIndex: 0 | 1 | 2
  revealPhase: RevealPhase
  revealProgress: number
  completedPages: boolean[]
  menuOpen: boolean
}

export const initialAppState: AppState = {
  scene: 'landing',
  currentUserId: null,
  revealMembers: [],
  pageIndex: 0,
  revealPhase: 'scattered',
  revealProgress: 0,
  completedPages: [false, false, false],
  menuOpen: false,
}

export type FlowAction =
  | { type: 'OPEN_NAME_ENTRY' }
  | { type: 'CLOSE_NAME_ENTRY' }
  | { type: 'IDENTIFIED'; member: TeamMember; others: TeamMember[] }
  | { type: 'ENTER_TELESCOPE' }
  | { type: 'PRIME_REVEAL' }
  | { type: 'CANCEL_PRIME' }
  | { type: 'START_FORMING' }
  | { type: 'SET_REVEAL_PROGRESS'; progress: number }
  | { type: 'COMPLETE_REVEAL' }
  | { type: 'START_RESONANCE' }
  | { type: 'END_RESONANCE' }
  | { type: 'START_PAGE_TRANSITION' }
  | { type: 'NEXT_PAGE' }
  | { type: 'START_RETURN' }
  | { type: 'FINISH_RETURN' }
  | { type: 'SET_MENU'; open: boolean }
  | { type: 'RESET' }

export function revealReducer(state: AppState, action: FlowAction): AppState {
  switch (action.type) {
    case 'OPEN_NAME_ENTRY':
      return state.scene === 'landing' ? { ...state, scene: 'name-entry' } : state
    case 'CLOSE_NAME_ENTRY':
      return state.scene === 'name-entry' ? { ...state, scene: 'landing' } : state
    case 'IDENTIFIED':
      if (state.scene !== 'name-entry' || action.others.length !== 3) return state
      return {
        ...state,
        scene: 'entering-lens',
        currentUserId: action.member.id,
        revealMembers: action.others,
      }
    case 'ENTER_TELESCOPE':
      return state.scene === 'entering-lens' && state.revealMembers.length === 3
        ? { ...state, scene: 'telescope' }
        : state
    case 'PRIME_REVEAL':
      return state.scene === 'telescope' && state.revealPhase === 'scattered'
        ? { ...state, revealPhase: 'priming' }
        : state
    case 'CANCEL_PRIME':
      return state.scene === 'telescope' && state.revealPhase === 'priming'
        ? { ...state, revealPhase: 'scattered', revealProgress: 0 }
        : state
    case 'START_FORMING':
      return state.scene === 'telescope' && (state.revealPhase === 'priming' || state.revealPhase === 'scattered')
        ? { ...state, revealPhase: 'forming', revealProgress: 0 }
        : state
    case 'SET_REVEAL_PROGRESS': {
      if (state.scene !== 'telescope' || state.revealPhase !== 'forming') return state
      const progress = Math.min(0.999, Math.max(0, action.progress))
      return { ...state, revealProgress: progress }
    }
    case 'COMPLETE_REVEAL': {
      if (state.scene !== 'telescope') return state
      const completedPages = [...state.completedPages]
      completedPages[state.pageIndex] = true
      return { ...state, revealProgress: 1, revealPhase: 'completed', completedPages }
    }
    case 'START_RESONANCE':
      return state.revealPhase === 'completed' ? { ...state, revealPhase: 'resonating' } : state
    case 'END_RESONANCE':
      return state.revealPhase === 'resonating' ? { ...state, revealPhase: 'completed' } : state
    case 'START_PAGE_TRANSITION':
      return state.scene === 'telescope' && state.pageIndex < 2 && state.completedPages[state.pageIndex]
        ? { ...state, revealPhase: 'transitioning' }
        : state
    case 'NEXT_PAGE':
      return state.revealPhase === 'transitioning' && state.pageIndex < 2
        ? {
            ...state,
            pageIndex: (state.pageIndex + 1) as 1 | 2,
            revealPhase: 'scattered',
            revealProgress: 0,
          }
        : state
    case 'START_RETURN':
      return state.scene === 'telescope' && state.pageIndex === 2 && state.completedPages[2]
        ? { ...state, scene: 'returning', revealPhase: 'transitioning' }
        : state
    case 'FINISH_RETURN':
      return state.scene === 'returning' ? { ...state, scene: 'finale', revealPhase: 'completed' } : state
    case 'SET_MENU':
      return state.scene === 'finale' ? { ...state, menuOpen: action.open } : state
    case 'RESET':
      return { ...initialAppState, completedPages: [false, false, false] }
    default:
      return state
  }
}

export function identifyUser(config: TeamConfig, input: string) {
  const member = findMemberByName(config, input)
  if (!member) return null
  const others = getOtherMembers(config, member.id)
  return others.length === 3 ? { member, others } : null
}

export function stepPrimeProgress(
  current: number,
  deltaSeconds: number,
  holding: boolean,
  thresholdSeconds = 0.8,
): number {
  const next = holding
    ? current + deltaSeconds / thresholdSeconds
    : current - deltaSeconds / 0.24
  return Math.min(1, Math.max(0, next))
}

function smoothStep(value: number) {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * (3 - 2 * clamped)
}

export function mapAssemblyProgress(elapsedSeconds: number, durationSeconds = 6.2): number {
  if (durationSeconds <= 0 || elapsedSeconds >= durationSeconds) return 1
  if (elapsedSeconds <= 0) return 0
  const scale = durationSeconds / 6.2
  const phaseOneEnd = 1.2 * scale
  const phaseTwoEnd = 4.4 * scale
  const phaseThreeEnd = 5.6 * scale

  if (elapsedSeconds < phaseOneEnd) {
    return smoothStep(elapsedSeconds / phaseOneEnd) * 0.15
  }
  if (elapsedSeconds < phaseTwoEnd) {
    return 0.15 + smoothStep((elapsedSeconds - phaseOneEnd) / (phaseTwoEnd - phaseOneEnd)) * 0.61
  }
  if (elapsedSeconds < phaseThreeEnd) {
    return 0.76 + smoothStep((elapsedSeconds - phaseTwoEnd) / (phaseThreeEnd - phaseTwoEnd)) * 0.21
  }
  return 0.97 + smoothStep((elapsedSeconds - phaseThreeEnd) / (durationSeconds - phaseThreeEnd)) * 0.03
}
