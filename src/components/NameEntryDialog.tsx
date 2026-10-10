import { useEffect, useRef, useState, type FormEvent } from 'react'

type Props = {
  onSubmit: (name: string) => boolean
  onClose: () => void
}

export function NameEntryDialog({ onSubmit, onClose }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!onSubmit(name)) {
      setError('找不到這個名字，請確認與名單中的本名一致')
      inputRef.current?.select()
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="name-dialog" role="dialog" aria-modal="true" aria-labelledby="name-dialog-title">
        <button className="dialog-close" type="button" onClick={onClose} aria-label="關閉姓名輸入">×</button>
        <span className="eyebrow">IDENTITY ALIGNMENT</span>
        <h2 id="name-dialog-title">請輸入本名</h2>
        <form onSubmit={submit} noValidate>
          <label htmlFor="full-name">本名</label>
          <div className="name-field-row">
            <input
              ref={inputRef}
              id="full-name"
              value={name}
              onChange={(event) => { setName(event.target.value); setError('') }}
              autoComplete="name"
              inputMode="text"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'name-error' : undefined}
              placeholder="輸入完整姓名"
            />
            <button type="submit">開始觀測</button>
          </div>
          <p id="name-error" className="field-error" role="alert" aria-live="polite">{error}</p>
        </form>
      </section>
    </div>
  )
}
