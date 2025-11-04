"use client"

import Link from 'next/link'

import { hp } from '@/content/homepage_v2'
import { Button } from '@/components/ui/button'

type HowItWorksProps = {
  startHref: string
}

export function HowItWorks({ startHref }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-gray-900">
              {hp.howItWorks.title}
            </h2>
            <div className="mt-8 space-y-6">
              {hp.howItWorks.steps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {step.title}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 lg:mt-0 lg:ml-12">
            <Button asChild variant="secondary" size="lg">
              <Link href={startHref}>
                {hp.howItWorks.cta}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
