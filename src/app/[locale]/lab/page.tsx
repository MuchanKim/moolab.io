'use client'

import dynamic from 'next/dynamic'

const CyberpunkScene = dynamic(
  () => import('@/components/lab/CyberpunkScene'),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
)

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <div className="relative">
        <h1
          className="text-3xl font-mono tracking-[0.3em] animate-pulse"
          style={{ color: '#00ffcc', textShadow: '0 0 20px rgba(0,255,204,0.5), 0 0 40px rgba(0,255,204,0.2)' }}
        >
          MOOLAB CITY
        </h1>
        <div
          className="mt-2 h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #00ffcc, transparent)' }}
        />
      </div>
      <p
        className="mt-6 text-xs font-mono tracking-[0.5em]"
        style={{ color: 'rgba(0,255,204,0.4)' }}
      >
        INITIALIZING...
      </p>
    </div>
  )
}

export default function LabPage() {
  return <CyberpunkScene />
}
