"use client"

import Link from 'next/link'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Activity } from 'lucide-react'

type HeaderProps = {
  startHref: string
}

export function Header({ startHref }: HeaderProps) {
  const router = useRouter()

  const handleStartAssessment = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    router.push(startHref)
  }, [router, startHref])

  return (
    <header className="relative z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#0B5394]" />
            <span className="text-xl font-medium text-gray-900">PainOptix™</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({
                  behavior: 'smooth'
                });
              }}
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              How it works
            </a>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
            <button onClick={handleStartAssessment} className="px-6 py-2 bg-[#0B5394] text-white font-medium rounded hover:bg-[#084074] transition-colors min-h-[44px]">
              Start Assessment
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
