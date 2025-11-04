"use client"

import Link from 'next/link'

import { hp } from '@/content/homepage_v2'
import { Button } from '@/components/ui/button'

type FooterLinksProps = {
  startHref: string
}

export function FooterLinks({ startHref }: FooterLinksProps) {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {hp.footer.ctaTitle}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {hp.footer.ctaSub}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={startHref}>
              {hp.footer.cta}
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-4 border-t border-gray-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-gray-400">
            {hp.brand.name}
          </span>
          <div className="flex gap-6 text-sm">
            {hp.footer.links.map(link => (
              <Link key={link.text} href={link.href} className="hover:text-white transition-colors">
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
