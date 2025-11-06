"use client"

import { useEffect, useState } from 'react'

import { hp } from '@/content/homepage_v2'
import { ensurePilotCookie, isPilot, pilotLabel } from '@/lib/pilot'

import { Header } from './Header'
import { Footer } from './Footer'
import { Badges } from './Badges'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { PhysicianBio } from './PhysicianBio'
import { ProductCards } from './ProductCards'
import { Testimonials } from './Testimonials'
import { PilotLaunch } from './PilotLaunch'
import { WhatYouGetSection } from './WhatYouGetSection'
import { TrustAndFaqs } from './TrustAndFaqs'
import { FinalCTA } from './FinalCTA'

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
      <Header />
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
      <PilotLaunch startHref={startHref} />
      <WhatYouGetSection />
      <TrustAndFaqs />
      <FinalCTA startHref={startHref} />
      <Footer />
    </div>
  )
}
