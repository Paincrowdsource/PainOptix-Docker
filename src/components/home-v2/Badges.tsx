"use client"

import { hp } from '@/content/homepage_v2'

export function Badges() {
  return (
    <section className="relative -mt-24 z-30 bg-white px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-light text-gray-900 text-center mb-8">
            {hp.quickProof.title}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {hp.quickProof.badges.map(badge => (
              <div
                key={badge.label}
                className="text-center"
              >
                <p className="text-2xl font-semibold text-primary">
                  {badge.label}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {badge.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
