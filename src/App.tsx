import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import teamMarkdown from '../TEAM_DATA.md?raw'
import { parseTeamMarkdown } from './config/parseTeamMarkdown'
import { identifyUser, initialAppState, revealReducer } from './state/revealFlow'
import { supportsWebGL } from './utils/webgl'
import { LandingScene } from './components/LandingScene'
import { NameEntryDialog } from './components/NameEntryDialog'
import { TelescopeViewport } from './components/TelescopeViewport'
import { ReturnSequence } from './components/ReturnSequence'
import { FinaleScene } from './components/FinaleScene'

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

function App() {
  const parsed = useMemo(() => {
    try {
      return { config: parseTeamMarkdown(teamMarkdown), error: '' }
    } catch (error) {
      return { config: null, error: error instanceof Error ? error.message : 'TEAM_DATA.md 設定無法讀取' }
    }
  }, [])
  const [state, dispatch] = useReducer(revealReducer, initialAppState)
  const [webgl] = useState(() => supportsWebGL())
  const reducedMotion = useReducedMotion()

  const openNameEntry = useCallback(() => dispatch({ type: 'OPEN_NAME_ENTRY' }), [])
  const enterTelescope = useCallback(() => dispatch({ type: 'ENTER_TELESCOPE' }), [])
  const finishReturn = useCallback(() => dispatch({ type: 'FINISH_RETURN' }), [])

  if (!parsed.config) {
    return (
      <main className="configuration-error" role="alert">
        <span className="eyebrow">CONFIGURATION ERROR</span>
        <h1>星圖資料無法載入</h1>
        <p>{parsed.error}</p>
        <small>請檢查專案根目錄的 TEAM_DATA.md，修正後重新整理。</small>
      </main>
    )
  }
  const config = parsed.config

  const submitName = (input: string) => {
    const result = identifyUser(config, input)
    if (!result) return false
    dispatch({ type: 'IDENTIFIED', member: result.member, others: result.others })
    return true
  }

  if (state.scene === 'telescope') {
    return (
      <>
        {!webgl && <div className="compatibility-notice">WebGL 不可用，已切換至 2D 星空模式</div>}
        <TelescopeViewport state={state} dispatch={dispatch} webgl={webgl} reducedMotion={reducedMotion} />
      </>
    )
  }

  if (state.scene === 'returning') {
    const finalMember = state.revealMembers[2]
    return finalMember ? (
      <ReturnSequence member={finalMember} webgl={webgl} reducedMotion={reducedMotion} onComplete={finishReturn} />
    ) : (
      <main className="configuration-error">返回星空時找不到最後一位組員資料。</main>
    )
  }

  if (state.scene === 'finale') {
    return (
      <FinaleScene
        config={config}
        webgl={webgl}
        reducedMotion={reducedMotion}
        menuOpen={state.menuOpen}
        onMenuChange={(open) => dispatch({ type: 'SET_MENU', open })}
        onReset={() => dispatch({ type: 'RESET' })}
      />
    )
  }

  const entering = state.scene === 'entering-lens'
  return (
    <>
      <LandingScene
        webgl={webgl}
        entering={entering}
        onActivate={openNameEntry}
        onEntered={enterTelescope}
        teamName={config.teamName}
      />
      {state.scene === 'name-entry' && (
        <NameEntryDialog onSubmit={submitName} onClose={() => dispatch({ type: 'CLOSE_NAME_ENTRY' })} />
      )}
    </>
  )
}

export default App
