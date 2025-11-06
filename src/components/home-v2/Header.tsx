"use client"

import Link from 'next/link'
import { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Menu, X } from 'lucide-react'

import { isPilot } from '@/lib/pilot'

export function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleStartAssessment = useCallback((e: React.MouseEvent) => {
    e.preventDefault()

    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recentAssessment')
      if (recent) {
        try {
          const data = JSON.parse(recent)
          const hoursSince = (Date.now() - new Date(data.completedAt).getTime()) / (1000 * 60 * 60)

          if (hoursSince < 24) {
            router.push('/my-assessments')
            return
          }
        } catch (e) {
          // Invalid data, proceed normally
        }
      }
    }

    const target = isPilot() ? '/test-assessment?src=homepage_pilot' : '/test-assessment'
    router.push(target)
  }, [router])

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }, [])

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#0B5394]" />
            <span className="text-xl font-medium text-gray-900">PainOptix™</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              How it works
            </button>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
            <button onClick={handleStartAssessment} className="px-6 py-2 bg-[#0B5394] text-white font-medium rounded hover:bg-[#084074] transition-colors">
              Start Assessment
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl z-50 lg:hidden">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-[#0B5394]" />
                  <span className="text-lg font-medium text-gray-900">PainOptix™</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Menu Links */}
              <nav className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    How it works
                  </button>
                  <button
                    onClick={() => scrollToSection('pricing')}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => scrollToSection('testimonials')}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Testimonials
                  </button>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    FAQ
                  </button>
                  <Link
                    href="/about"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </div>
              </nav>

              {/* Mobile Menu CTA */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    handleStartAssessment(e)
                    setMobileMenuOpen(false)
                  }}
                  className="w-full px-6 py-4 bg-[#0B5394] text-white font-medium rounded-lg hover:bg-[#084074] transition-colors text-center"
                >
                  Start Assessment
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
