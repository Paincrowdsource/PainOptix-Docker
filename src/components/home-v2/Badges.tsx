"use client"

import { hp } from '@/content/homepage_v2'

export function Badges() {
  return (
    <section className="bg-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-gray-900">
          {hp.quickProof.title}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {hp.quickProof.badges.map(badge => (
            <div
              key={badge.label}
              className="rounded-2xl border border-primary/10 bg-white px-6 py-5 shadow-sm"
            >
              <p className="text-lg font-semibold text-primary">
                {badge.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {badge.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
