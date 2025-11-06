"use client"

import { hp } from '@/content/homepage_v2'
import { BrandButton } from './BrandButton'

type HowItWorksProps = {
  startHref: string
}

export function HowItWorks({ startHref }: HowItWorksProps) {
  return (
    <section id="how-it-works" data-e2e="how-it-works" className="py-24 bg-gray-50/50 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-light text-gray-900 mb-4">
            {hp.howItWorks.title}
          </h2>
          <div className="w-16 h-px bg-[#0B5394] mx-auto"></div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="space-y-16">
            {hp.howItWorks.steps.map((step, index) => (
              <div key={step.title}>
                <div className="flex items-start gap-8 group">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#0B5394] transition-colors duration-300">
                      <span className="text-lg font-light text-gray-600 group-hover:text-[#0B5394] transition-colors">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>

                {/* Connecting line (except after last step) */}
                {index < hp.howItWorks.steps.length - 1 && (
                  <div className="ml-6 -my-12">
                    <div className="w-px h-16 bg-gradient-to-b from-gray-200 to-transparent ml-0"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Secondary CTA */}
          <div className="mt-12 text-center">
            <BrandButton href={startHref} variant="secondary">
              {hp.howItWorks.cta}
            </BrandButton>
          </div>
        </div>
      </div>
    </section>
  )
}
