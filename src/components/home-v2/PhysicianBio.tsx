"use client"

import { hp } from '@/content/homepage_v2'

export function PhysicianBio() {
  return (
    <section data-e2e="physician-bio" className="py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-4">{hp.bio.title}</h2>
          <div className="w-16 h-px bg-[#0B5394] mx-auto"></div>
        </div>

        <div className="bg-gray-50 rounded-lg p-12 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl font-light text-gray-600">{hp.bio.avatarInitials}</span>
              </div>

              <h3 className="text-2xl font-medium text-gray-900 mb-2">{hp.bio.name}</h3>
              <p className="text-gray-600 mb-6">{hp.bio.creds}</p>
            </div>

            <div className="max-w-3xl mx-auto">
              <blockquote className="text-lg text-gray-700 italic leading-relaxed">
                &quot;{hp.bio.quote}&quot;
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
