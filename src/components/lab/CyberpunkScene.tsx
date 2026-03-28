'use client'

import { useRef, useEffect, Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Vehicle from './Vehicle'
import World from './World'
import { initInput } from './input'

// ────────────────────────────────────────────
function SpeedHUD({ speedRef }: { speedRef: { current: number } }) {
  const displayRef = useRef<HTMLSpanElement>(null!)
  useEffect(() => {
    let raf: number
    const update = () => {
      if (displayRef.current) {
          const kmps = Math.round(speedRef.current * 1000)
          displayRef.current.textContent = kmps.toLocaleString()
        }
      raf = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(raf)
  }, [speedRef])

  return (
    <div className="absolute bottom-6 right-8 font-mono text-right select-none pointer-events-none">
      <div style={{ color: '#00ccff', textShadow: '0 0 10px rgba(0,200,255,0.4)' }}>
        <span ref={displayRef} className="text-3xl font-bold">0</span>
        <span className="text-xs ml-1 opacity-50">KM/S</span>
      </div>
    </div>
  )
}

function Crosshair() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <div className="relative w-6 h-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1.5" style={{ background: 'rgba(0,200,255,0.4)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-1.5" style={{ background: 'rgba(0,200,255,0.4)' }} />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-1.5" style={{ background: 'rgba(0,200,255,0.4)' }} />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-1.5" style={{ background: 'rgba(0,200,255,0.4)' }} />
      </div>
    </div>
  )
}

function ControlsHint({ locked }: { locked: boolean }) {
  if (locked) return null
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 cursor-pointer select-none">
      <div className="text-center">
        <div className="font-mono text-lg mb-4" style={{ color: '#00ccff' }}>CLICK TO EXPLORE</div>
        <div className="font-mono text-xs space-y-1.5" style={{ color: 'rgba(0,200,255,0.5)' }}>
          <div><span className="text-white/70">WASD</span> — Move</div>
          <div><span className="text-white/70">Mouse</span> — Look around</div>
          <div><span className="text-white/70">Space / Shift</span> — Up / Down</div>
          <div><span className="text-white/70">ESC</span> — Release cursor</div>
        </div>
      </div>
    </div>
  )
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-40">
      <h1 className="text-2xl font-mono tracking-[0.3em] animate-pulse" style={{ color: '#00ccff', textShadow: '0 0 20px rgba(0,200,255,0.4)' }}>
        MOOLAB SPACE
      </h1>
      <div className="mt-4 w-48 h-0.5 bg-white/10 rounded overflow-hidden">
        <div className="h-full rounded animate-pulse" style={{ width: '70%', background: '#00ccff' }} />
      </div>
      <p className="mt-3 text-xs font-mono tracking-wider" style={{ color: 'rgba(0,200,255,0.25)' }}>Loading solar system...</p>
    </div>
  )
}

// ────────────────────────────────────────────
export default function CyberpunkScene() {
  const speedRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null!)
  const [ready, setReady] = useState(false)
  const [locked, setLocked] = useState(false)

  // Init input system (module-level, bypasses React/R3F boundary)
  useEffect(() => {
    const cleanup = initInput()
    const onChange = () => setLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', onChange)
    return () => { cleanup(); document.removeEventListener('pointerlockchange', onChange) }
  }, [])

  const handleClick = useCallback(() => {
    if (!document.pointerLockElement) {
      try { containerRef.current?.requestPointerLock() } catch {}
    }
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black" onClick={handleClick} style={{ outline: 'none' }}>
      {!ready && <LoadingOverlay />}
      <ControlsHint locked={locked} />

      <Canvas
        camera={{ position: [50170, 5.4, 14], fov: 50, near: 0.1, far: 600000 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2, powerPreference: 'high-performance', logarithmicDepthBuffer: true }}
        onCreated={() => setTimeout(() => setReady(true), 2000)}
      >
        <Suspense fallback={null}>
          <Vehicle speedRef={speedRef} />
          <World />
        </Suspense>
      </Canvas>

      {locked && (
        <>
          <div className="absolute top-4 left-6 select-none pointer-events-none">
            <div className="font-mono text-xs tracking-[0.4em]" style={{ color: 'rgba(0,200,255,0.3)' }}>MOOLAB SPACE</div>
          </div>
          <Crosshair />
          <SpeedHUD speedRef={speedRef} />
        </>
      )}
    </div>
  )
}
