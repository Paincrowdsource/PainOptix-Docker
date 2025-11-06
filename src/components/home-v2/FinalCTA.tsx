'use client';

import { hp } from '@/content/homepage_v2';
import { BrandButton } from './BrandButton';

type FinalCTAProps = {
  startHref: string;
};

export function FinalCTA({ startHref }: FinalCTAProps) {

  return (
    <section data-e2e="final-cta" className="py-24 bg-gradient-to-br from-[#0B5394] to-[#0B5394]/80">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        {/* Title */}
        <h2 className="text-3xl lg:text-4xl font-light text-white mb-4">
          {hp.footer.ctaTitle}
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          {hp.footer.ctaSub}
        </p>

        {/* CTA Button */}
        <BrandButton
          href={startHref}
          variant="secondary"
          className="bg-white text-[#0B5394] hover:bg-gray-50"
          data-e2e="final-cta-button"
        >
          {hp.footer.cta}
        </BrandButton>
      </div>
    </section>
  );
}
