import type { TeamConfig, TeamMember } from '../config/teamTypes'
import { findMemberByName, getOtherMembers } from '../config/parseTeamMarkdown'

export type Scene = 'landing' | 'name-entry' | 'entering-lens' | 'telescope' | 'returning' | 'finale'
export type RevealPhase = 'scattered' | 'forming' | 'completed' | 'dragging' | 'transitioning'

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
  | { type: 'SET_REVEAL_PROGRESS'; progress: number; forming: boolean }
  | { type: 'COMPLETE_REVEAL' }
  | { type: 'START_DRAG' }
  | { type: 'END_DRAG' }
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
    case 'SET_REVEAL_PROGRESS': {
      if (state.scene !== 'telescope' || state.revealPhase === 'completed' || state.revealPhase === 'dragging') return state
      const progress = Math.min(0.999, Math.max(0, action.progress))
      return { ...state, revealProgress: progress, revealPhase: action.forming && progress > 0 ? 'forming' : 'scattered' }
    }
    case 'COMPLETE_REVEAL': {
      if (state.scene !== 'telescope') return state
      const completedPages = [...state.completedPages]
      completedPages[state.pageIndex] = true
      return { ...state, revealProgress: 1, revealPhase: 'completed', completedPages }
    }
    case 'START_DRAG':
      return state.revealPhase === 'completed' ? { ...state, revealPhase: 'dragging' } : state
    case 'END_DRAG':
      return state.revealPhase === 'dragging' ? { ...state, revealPhase: 'completed' } : state
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

export function stepRevealProgress(
  current: number,
  deltaSeconds: number,
  holding: boolean,
  holdDurationSeconds = 2.8,
): number {
  const next = holding
    ? current + deltaSeconds / holdDurationSeconds
    : current - deltaSeconds / 0.9
  return Math.min(1, Math.max(0, next))
}
