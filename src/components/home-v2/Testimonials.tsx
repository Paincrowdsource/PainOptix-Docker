"use client"

import { hp } from '@/content/homepage_v2'
import { BrandCard } from './BrandCard'

export function Testimonials() {
  return (
    <section id="testimonials" data-e2e="testimonials" className="bg-white py-24 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-4">
            {hp.testimonials.strap}
          </h2>
          <div className="w-16 h-px bg-[#0B5394] mx-auto"></div>
        </div>

        <div className="mt-10 overflow-x-auto pb-4 md:overflow-visible scroll-smooth">
          <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-6 snap-x snap-mandatory md:grid-flow-row md:grid-cols-3 md:gap-6">
            {hp.testimonials.items.map(item => {
              const date = (item as { date?: string }).date
              return (
                <BrandCard key={`${item.quote}-${item.by}`} variant="subtle" hover className="snap-center">
                  <div className="space-y-4">
                    <p className="text-base text-gray-700 leading-relaxed italic">
                      &quot;{item.quote}&quot;
                    </p>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{item.by}</p>
                      {date ? <p className="text-gray-600">{date}</p> : null}
                    </div>
                  </div>
                </BrandCard>
              )
            })}
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-600 text-center">
          {hp.testimonials.footnote}
        </p>
      </div>
    </section>
  )
}
