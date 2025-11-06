"use client"

import { useEffect, useState } from 'react'

import { hp } from '@/content/homepage_v2'
import { ensurePilotCookie, isPilot, pilotLabel } from '@/lib/pilot'

import { Badges } from './Badges'
import { FaqTrust } from './FaqTrust'
import { Footer } from './Footer'
import { Header } from './Header'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { PilotBanner } from './PilotBanner'
import { PhysicianBio } from './PhysicianBio'
import { ProductCards } from './ProductCards'
import { Testimonials } from './Testimonials'

const startHref = '/?src=homepage_pilot#start-check'

type HomepageV2Props = {
  assessmentId?: string
}

export function HomepageV2({ assessmentId }: HomepageV2Props) {
  const [pilotActive, setPilotActive] = useState(false)
  const [pilotLabelValue, setPilotLabelValue] = useState<string>(hp.products.monograph.priceNormal)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PILOT_ACTIVE === 'true') {
      ensurePilotCookie()
      const pilotStatus = isPilot()
      setPilotActive(pilotStatus)
      if (pilotStatus) {
        setPilotLabelValue(pilotLabel())
      } else {
        setPilotLabelValue(hp.products.monograph.priceNormal)
      }
    } else {
      setPilotActive(false)
      setPilotLabelValue(hp.products.monograph.priceNormal)
    }
  }, [])

  return (
    <div className="bg-white">
      <Header startHref={startHref} />
      <Hero startHref={startHref} />
      <Badges />
      <HowItWorks startHref={startHref} />
      <ProductCards
        pilotActive={pilotActive}
        pilotLabelValue={pilotLabelValue}
        assessmentId={assessmentId}
        startHref={startHref}
      />
      <PhysicianBio />
      <Testimonials />
      <PilotBanner pilotActive={pilotActive} assessmentId={assessmentId} startHref={startHref} />
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-light text-gray-900">
            {hp.whatYouGet.title}
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {hp.whatYouGet.bullets.map(item => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-neutral-50 px-5 py-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-base text-gray-700 leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <FaqTrust />
      <Footer startHref={startHref} />
    </div>
  )
}
