"use client"

import { hp } from '@/content/homepage_v2'
import { BrandButton } from './BrandButton'
import { brand } from './theme'

type HeroProps = {
  startHref: string
}

export function Hero({ startHref }: HeroProps) {
  return (
    <section className="relative min-h-[720px] bg-gradient-to-br from-gray-50/30 to-white flex items-center">
      <div className="relative z-10 max-w-7xl xl:max-w-5xl mx-auto px-6 lg:px-8 text-center">
        {/* Main headline - V1 typography */}
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-gray-900 leading-[1.1]"
            style={{ textShadow: brand.typography.hero.textShadow }}
          >
            {hp.hero.title}
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed">
            {hp.hero.sub}
          </p>

          {/* CTA Section */}
          <div className="mt-10">
            <BrandButton href={startHref}>
              {hp.hero.cta}
            </BrandButton>

            {/* Disclaimer */}
            <p className="mt-4 text-sm text-gray-600">
              {hp.hero.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
