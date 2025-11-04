"use client"

import { hp } from '@/content/homepage_v2'

export function FaqTrust() {
  return (
    <section className="bg-neutral-50 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-gray-900">
          {hp.faqTrust.title}
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {hp.faqTrust.faqs.map(item => (
            <div key={item.q} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-lg font-semibold text-gray-900">
                {item.q}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
