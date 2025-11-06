"use client"

import { hp } from '@/content/homepage_v2'
import { Card, CardContent } from '@/components/ui/card'

export function Testimonials() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-light text-gray-900">
          {hp.testimonials.strap}
        </h2>
        <div className="mt-10 overflow-x-auto pb-4 md:overflow-visible">
          <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4 snap-x snap-mandatory md:grid-flow-row md:grid-cols-3 md:gap-6">
            {hp.testimonials.items.map(item => {
              const date = (item as { date?: string }).date
              return (
                <Card key={`${item.quote}-${item.by}`} className="snap-center border border-gray-200 bg-white shadow-sm">
                  <CardContent className="space-y-4 py-6">
                    <p className="text-base text-gray-700 leading-relaxed">
                      {item.quote}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-gray-900">{item.by}</p>
                      {date ? <p>{date}</p> : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          {hp.testimonials.footnote}
        </p>
      </div>
    </section>
  )
}
