"use client"

import { hp } from '@/content/homepage_v2'
import { Award } from 'lucide-react'

export function Badges() {
  return (
    <div className="relative -mt-24 z-30 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-around items-center space-y-6 md:space-y-0">
            {hp.quickProof.badges.map((badge, index) => {
              // Parse number from label if exists (e.g., "16 Clinical Questions")
              const numberMatch = badge.label.match(/^(\d+)/)
              const hasNumber = numberMatch !== null

              return (
                <div key={badge.label} className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    {hasNumber ? (
                      <span className="text-2xl font-semibold text-[#0B5394]">
                        {numberMatch[1]}
                      </span>
                    ) : (
                      <Award className="w-8 h-8 text-[#0B5394]" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {hasNumber ? badge.label.replace(/^\d+\s*/, '') : badge.label}
                  </h3>
                  <p className="text-sm text-gray-600">{badge.sub}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
