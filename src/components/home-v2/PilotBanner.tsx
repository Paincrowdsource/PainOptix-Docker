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
    <section className="bg-primary text-white py-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="rounded-3xl bg-white/10 p-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold leading-tight">
              {hp.pilot.title}
            </h2>
            <p className="mt-4 text-base text-white/90 leading-relaxed">
              {hp.pilot.body}
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            {hasAssessment ? (
              <Button
                onClick={handleClick}
                size="lg"
                variant="secondary"
                disabled={pending}
              >
                {hp.pilot.cta}
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary">
                <Link href={startHref}>
                  {hp.pilot.cta}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
