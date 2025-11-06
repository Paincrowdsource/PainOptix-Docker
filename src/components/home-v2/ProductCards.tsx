"use client"

import { useMemo, useState } from 'react'

import { hp } from '@/content/homepage_v2'
import { BrandButton } from './BrandButton'
import { BrandCard } from './BrandCard'
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
    <section id="pricing" data-e2e="product-cards" className="bg-gray-50/50 py-24 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-4">
            {hp.products.title}
          </h2>
          <div className="w-16 h-px bg-[#0B5394] mx-auto mb-4"></div>
          <p className="text-gray-600">
            {hp.products.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
          {/* Monograph Card */}
          <BrandCard variant="elevated" hover className={pilotActive ? 'border-[3px] border-[#0B5394]' : ''}>
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0B5394] mb-4">
                Most Chosen
              </span>
              <h3 className="text-2xl font-medium text-gray-900 mt-4">
                {hp.products.monograph.name}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {hp.products.monograph.oneLine}
              </p>
              <div className="mt-4">
                {pilotActive ? (
                  <p className="text-lg font-semibold text-[#0B5394]">
                    <span className="line-through text-gray-400">$20</span> → {pilotLabelValue} today (Pilot)
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-[#0B5394]">
                    {hp.products.monograph.priceNormal}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                {hp.products.monograph.includes.map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#0B5394]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {hasAssessment ? (
                <BrandButton
                  onClick={() => handleCheckout('comprehensive')}
                  disabled={pendingTier === 'comprehensive'}
                  showIcon={false}
                >
                  {monographButton}
                </BrandButton>
              ) : (
                <BrandButton href={startHref} showIcon={false}>
                  {monographButton}
                </BrandButton>
              )}

              <p className="text-xs text-gray-600">
                {hp.products.monograph.microcopy}
              </p>
            </div>
          </BrandCard>

          {/* Enhanced Card */}
          <BrandCard variant="default" hover>
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 mb-4">
                Quick Start
              </span>
              <h3 className="text-2xl font-medium text-gray-900 mt-4">
                {hp.products.enhanced.name}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {hp.products.enhanced.oneLine}
              </p>
              <p className="mt-4 text-lg font-semibold text-[#0B5394]">
                {hp.products.enhanced.price}
              </p>
            </div>

            <div className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                {hp.products.enhanced.includes.map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#0B5394]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {hasAssessment ? (
                <BrandButton
                  onClick={() => handleCheckout('enhanced')}
                  disabled={pendingTier === 'enhanced'}
                  showIcon={false}
                >
                  {hp.products.enhanced.button}
                </BrandButton>
              ) : (
                <BrandButton href={startHref} showIcon={false}>
                  {hp.products.enhanced.button}
                </BrandButton>
              )}

              <p className="text-xs text-gray-600">
                {hp.products.enhanced.microcopy}
              </p>
            </div>
          </BrandCard>
        </div>

        <p className="mt-10 text-sm text-gray-600 text-center">
          {hp.products.underNote}
        </p>
      </div>
    </section>
  )
}
