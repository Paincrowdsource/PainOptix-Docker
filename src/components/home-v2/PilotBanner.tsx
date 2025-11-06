"use client"

import Link from 'next/link'
import { useState } from 'react'

import { hp } from '@/content/homepage_v2'
import { Button } from '@/components/ui/button'
import { startCheckout } from '@/lib/checkout'

type PilotBannerProps = {
  pilotActive: boolean
  assessmentId?: string
  startHref: string
}

export function PilotBanner({ pilotActive, assessmentId, startHref }: PilotBannerProps) {
  const [pending, setPending] = useState(false)
  const hasAssessment = Boolean(assessmentId)

  const handleClick = async () => {
    if (!assessmentId) return
    try {
      setPending(true)
      await startCheckout({ tier: 'comprehensive', assessmentId })
    } finally {
      setPending(false)
    }
  }

  if (!pilotActive) return null

  return (
    <section className="bg-[#0B5394] text-white py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="rounded-2xl bg-white/10 p-8 lg:flex lg:items-center lg:justify-between lg:gap-10 border border-white/20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-medium leading-tight">
              {hp.pilot.title}
            </h2>
            <p className="mt-4 text-base text-white/90 leading-relaxed">
              {hp.pilot.body}
            </p>
          </div>
          <div className="mt-6 lg:mt-0 lg:flex-shrink-0">
            {hasAssessment ? (
              <button
                onClick={handleClick}
                disabled={pending}
                className="px-8 py-3 bg-white text-[#0B5394] text-lg font-medium rounded shadow-sm hover:bg-gray-50 transition-colors"
              >
                {hp.pilot.cta}
              </button>
            ) : (
              <a
                href={startHref}
                className="inline-block px-8 py-3 bg-white text-[#0B5394] text-lg font-medium rounded shadow-sm hover:bg-gray-50 transition-colors"
              >
                {hp.pilot.cta}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
