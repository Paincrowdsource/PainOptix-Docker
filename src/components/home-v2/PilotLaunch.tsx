'use client';

import { hp } from '@/content/homepage_v2';
import { BrandButton } from './BrandButton';

type PilotLaunchProps = {
  startHref: string;
};

export function PilotLaunch({ startHref }: PilotLaunchProps) {

  return (
    <section data-e2e="pilot-launch" className="py-24 bg-gradient-to-br from-[#0B5394]/5 to-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-[#0B5394]/20 p-8 lg:p-12">
          {/* Title */}
          <h2 className="text-3xl lg:text-4xl font-light text-center text-gray-900 mb-6">
            {hp.pilot.title}
          </h2>

          {/* Body */}
          <p className="text-lg text-gray-600 leading-relaxed text-center mb-8 max-w-2xl mx-auto">
            {hp.pilot.body}
          </p>

          {/* CTA */}
          <div className="flex justify-center">
            <BrandButton
              href={startHref}
              variant="primary"
              data-e2e="pilot-launch-cta"
            >
              {hp.pilot.cta}
            </BrandButton>
          </div>
        </div>
      </div>
    </section>
  );
}
