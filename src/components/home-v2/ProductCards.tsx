"use client"

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { hp } from '@/content/homepage_v2'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { startCheckout } from '@/lib/checkout'

type ProductCardsProps = {
  pilotActive: boolean
  pilotLabelValue: string
  assessmentId?: string
  startHref: string
}

export function ProductCards({ pilotActive, pilotLabelValue, assessmentId, startHref }: ProductCardsProps) {
  const [pendingTier, setPendingTier] = useState<'enhanced' | 'comprehensive' | null>(null)
  const hasAssessment = Boolean(assessmentId)

  const monographPrice = useMemo(
    () => (pilotActive ? pilotLabelValue : hp.products.monograph.priceNormal),
    [pilotActive, pilotLabelValue]
  )

  const monographButton = useMemo(
    () => `${hp.products.monograph.button}${pilotActive ? '$5' : hp.products.monograph.priceNormal}`,
    [pilotActive]
  )

  const handleCheckout = async (tier: 'enhanced' | 'comprehensive') => {
    if (!assessmentId) return
    try {
      setPendingTier(tier)
      await startCheckout({ tier, assessmentId })
    } finally {
      setPendingTier(null)
    }
  }

  return (
    <section className="bg-neutral-50 py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-light text-gray-900">
            {hp.products.title}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {hp.products.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Card className={cn('relative border-2', pilotActive ? 'border-primary' : 'border-primary/60')}>
            <CardHeader>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {hp.products.monograph.featuredLabel}
              </span>
              <CardTitle className="mt-4 text-2xl text-gray-900">
                {hp.products.monograph.name}
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                {hp.products.monograph.oneLine}
              </p>
              <p className="mt-4 text-lg font-medium text-primary">
                {monographPrice}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {hp.products.monograph.includes.map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {hasAssessment ? (
                <Button
                  onClick={() => handleCheckout('comprehensive')}
                  size="lg"
                  disabled={pendingTier === 'comprehensive'}
                >
                  {monographButton}
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href={startHref}>
                    {monographButton}
                  </Link>
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {hp.products.monograph.microcopy}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">
                {hp.products.enhanced.name}
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                {hp.products.enhanced.oneLine}
              </p>
              <p className="mt-4 text-lg font-medium text-primary">
                {hp.products.enhanced.price}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {hp.products.enhanced.includes.map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {hasAssessment ? (
                <Button
                  onClick={() => handleCheckout('enhanced')}
                  variant="secondary"
                  size="lg"
                  disabled={pendingTier === 'enhanced'}
                >
                  {hp.products.enhanced.button}
                </Button>
              ) : (
                <Button asChild variant="secondary" size="lg">
                  <Link href={startHref}>
                    {hp.products.enhanced.button}
                  </Link>
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {hp.products.enhanced.microcopy}
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          {hp.products.underNote}
        </p>
      </div>
    </section>
  )
}
