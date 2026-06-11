'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f] text-white flex flex-col justify-center items-center">
      {/* ─── Animated Gradient Orbs ─── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #6366F1, transparent 70%)',
          }}
        />
        <div
          className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full opacity-15 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #8B5CF6, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-[450px] w-[450px] rounded-full opacity-15 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #06B6D4, transparent 70%)',
          }}
        />
      </div>

      {/* ─── Grid Pattern Overlay ─── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* ─── Top-left branding ─── */}
      <div className="fixed left-6 top-6 z-50 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md">
          <Sparkles className="size-5 animate-pulse" />
        </div>
        <span className="text-lg font-bold font-display tracking-tight text-white">
          CareerAI <span className="text-indigo-400 font-medium">Copilot</span>
        </span>
      </div>

      {/* ─── Centered Form Content ─── */}
      <main className="relative z-10 w-full max-w-md px-4 py-12">
        {mounted && children}
      </main>
    </div>
  )
}
