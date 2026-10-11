import { useEffect } from 'react'
import { FaGithub, FaInstagram, FaLink } from 'react-icons/fa6'
import { SiLine } from 'react-icons/si'
import { HiOutlineSparkles } from 'react-icons/hi2'
import type { TeamLink } from '../config/teamTypes'

type Props = {
  links: TeamLink[]
  onClose: () => void
  onReset: () => void
}

function LinkIcon({ icon }: { icon: string }) {
  const key = icon.toLowerCase()
  if (key === 'line') return <SiLine />
  if (key === 'instagram' || key === 'ig') return <FaInstagram />
  if (key === 'github') return <FaGithub />
  if (key === 'project') return <HiOutlineSparkles />
  return <FaLink />
}

export function LinkPanel({ links, onClose, onReset }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="menu-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="link-panel" role="dialog" aria-modal="true" aria-labelledby="link-panel-title">
        <button className="panel-close" type="button" onClick={onClose} aria-label="關閉星圖選單">×</button>
        <span className="eyebrow">CONSTELLATION INDEX</span>
        <h2 id="link-panel-title">一些相關資料</h2>
        <nav aria-label="團隊與專案連結">
          {links.map((link) => link.url ? (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
              <span className="link-icon"><LinkIcon icon={link.icon} /></span>
              <span><strong>{link.label}</strong></span>
              <i aria-hidden="true">↗</i>
            </a>
          ) : (
            <span key={link.id} className="disabled-link" aria-disabled="true">
              <span className="link-icon"><LinkIcon icon={link.icon} /></span>
              <span><strong>{link.label}</strong><small>即將公開</small></span>
              <i aria-hidden="true">—</i>
            </span>
          ))}
        </nav>
        <button className="reset-journey" type="button" onClick={onReset}>重新探索</button>
      </aside>
    </div>
  )
}
