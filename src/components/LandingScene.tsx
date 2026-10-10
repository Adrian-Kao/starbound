import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { BackgroundStars } from './BackgroundStars'
import { Telescope3D } from './Telescope3D'
import { FallbackTelescope } from './FallbackTelescope'

type Props = {
  webgl: boolean
  entering: boolean
  onActivate: () => void
  onEntered: () => void
  teamName: string
}

export function LandingScene({ webgl, entering, onActivate, onEntered, teamName }: Props) {
  useEffect(() => {
    if (!entering || webgl) return
    const timer = window.setTimeout(onEntered, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 320 : 1350)
    return () => window.clearTimeout(timer)
  }, [entering, onEntered, webgl])

  return (
    <main className={`landing-scene ${entering ? 'is-entering' : ''}`}>
      <div className="landing-canvas" aria-hidden="true">
        {webgl ? (
          <Canvas camera={{ position: [0, 0.7, 7.2], fov: 42 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: false }}>
            <color attach="background" args={['#040713']} />
            <fog attach="fog" args={['#040713', 7, 17]} />
            <ambientLight intensity={0.7} color="#7ba7d6" />
            <directionalLight position={[3, 5, 5]} intensity={3.1} color="#d8ecff" />
            <pointLight position={[-3, 1, 2]} intensity={24} distance={8} color="#3f9fd2" />
            <pointLight position={[2, -1, 3]} intensity={12} distance={7} color="#f1d6a6" />
            <Suspense fallback={null}>
              <BackgroundStars seed="landing-sky" count={1250} radius={10} drift={0.012} />
              <Telescope3D entering={entering} onActivate={onActivate} onEntered={onEntered} />
            </Suspense>
          </Canvas>
        ) : <FallbackTelescope />}
      </div>

      <header className="site-header">
        <div className="brand-mark" aria-hidden="true"><i /><i /><i /></div>
        <div>
          <strong>STARBOUND</strong>
          <span>{teamName}</span>
        </div>
      </header>

      <section className="landing-copy">
        <span className="eyebrow">CELESTIAL RENDEZVOUS · 01</span>
        <h1>在星海裡，<br />找到與我同行的人。</h1>
        <p>對準夜空，讓每一道微光慢慢顯出名字。</p>
      </section>

      <button className="telescope-trigger" type="button" onClick={onActivate} disabled={entering}>
        <span className="trigger-orbit" aria-hidden="true" />
        <span>{entering ? '正在穿越鏡片' : '點擊望遠鏡，尋找你的星光'}</span>
        <small>{webgl ? '3D OBSERVATORY' : '2D COMPATIBILITY MODE'}</small>
      </button>
      {entering && <div className="iris-transition" aria-hidden="true" />}
    </main>
  )
}
