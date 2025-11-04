"use client"

import { hp } from '@/content/homepage_v2'

export function PhysicianBio() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-neutral-50/70 px-8 py-10 shadow-sm lg:flex lg:items-center lg:gap-10">
          <div className="flex-shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
              {hp.bio.avatarInitials}
            </div>
          </div>
          <div className="mt-6 lg:mt-0">
            <h2 className="text-3xl font-semibold text-gray-900">
              {hp.bio.title}
            </h2>
            <p className="mt-2 text-sm uppercase tracking-wide text-primary">
              {hp.bio.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hp.bio.creds}
            </p>
            <p className="mt-6 text-lg text-gray-700 leading-relaxed">
              {hp.bio.quote}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
