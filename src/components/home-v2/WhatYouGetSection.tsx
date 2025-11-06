'use client';

import { hp } from '@/content/homepage_v2';
import { CheckCircle } from 'lucide-react';

export function WhatYouGetSection() {
  return (
    <section id="what-you-get" data-e2e="what-you-get" className="py-24 bg-gray-50/50 scroll-mt-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <h2 className="text-3xl lg:text-4xl font-light text-center text-gray-900 mb-12">
          {hp.whatYouGet.title}
        </h2>

        {/* Bullets */}
        <div className="space-y-4">
          {hp.whatYouGet.bullets.map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-[#0B5394] flex-shrink-0 mt-0.5" />
              <p className="text-lg text-gray-700 leading-relaxed">{bullet}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
