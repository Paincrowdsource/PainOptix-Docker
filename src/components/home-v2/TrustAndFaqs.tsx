'use client';

import { hp } from '@/content/homepage_v2';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function TrustAndFaqs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" data-e2e="trust-and-faqs" className="py-24 bg-white scroll-mt-24">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <h2 className="text-3xl lg:text-4xl font-light text-center text-gray-900 mb-12">
          {hp.faqTrust.title}
        </h2>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {hp.faqTrust.faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-[#0B5394]/30"
            >
              {/* Question Button */}
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-gray-50/50 transition-colors"
                aria-expanded={openIndex === idx}
                aria-controls={`faq-answer-${idx}`}
              >
                <span className="text-lg font-medium text-gray-900">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#0B5394] transition-transform duration-200 flex-shrink-0 ml-4 ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Answer */}
              <div
                id={`faq-answer-${idx}`}
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === idx ? 'max-h-40' : 'max-h-0'
                }`}
              >
                <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100">
                  <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
