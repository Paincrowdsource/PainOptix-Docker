"use client"

import Link from 'next/link'

import { hp } from '@/content/homepage_v2'
import { Button } from '@/components/ui/button'

type HeroProps = {
  startHref: string
}

export function Hero({ startHref }: HeroProps) {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {hp.brand.name}
          </span>
          <h1 className="mt-6 text-5xl md:text-6xl font-normal tracking-tight text-gray-900 leading-tight">
            {hp.hero.title}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed">
            {hp.hero.sub}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">
            <Button asChild size="lg">
              <Link href={startHref}>
                {hp.hero.cta}
              </Link>
            </Button>
            <p className="text-sm text-gray-500">
              {hp.hero.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
