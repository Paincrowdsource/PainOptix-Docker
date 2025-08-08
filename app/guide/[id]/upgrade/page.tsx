'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'

interface PricingTier {
  name: string
  price: number
  priceId: string
  features: string[]
  popular?: boolean
}

const tiers: PricingTier[] = [
  {
    name: 'Enhanced Guide',
    price: 5,
    priceId: 'enhanced',
    features: [
      'Detailed explanation of your condition',
      'Specific exercises and stretches',
      'Self-care recommendations',
      'When to seek medical care',
      'PDF download'
    ]
  },
  {
    name: 'Comprehensive Monograph',
    price: 20,
    priceId: 'monograph',
    popular: true,
    features: [
      'Everything in Enhanced Guide',
      'In-depth medical research',
      'Treatment options comparison',
      'Recovery timeline',
      'Professional medical references',
      'Printable patient handout'
    ]
  }
]

export default function UpgradePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)
  const [highlightedTier, setHighlightedTier] = useState<string | null>(null)

  useEffect(() => {
    // Check if a specific tier was requested
    const tierParam = searchParams.get('tier')
    if (tierParam === 'enhanced' || tierParam === 'monograph') {
      setHighlightedTier(tierParam)
    }
  }, [searchParams])

  const handlePurchase = async (tier: PricingTier) => {
    try {
      setLoading(tier.priceId)
      
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: params.id,
          priceId: tier.priceId,
          tierPrice: tier.price
        })
      })

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Error creating checkout session')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-4">
        Unlock Your Personalized Pain Relief Plan
      </h1>
      
      <p className="text-center text-gray-600 mb-2 max-w-2xl mx-auto">
        Get detailed strategies and expert guidance tailored to your specific symptoms.
      </p>
      
      {highlightedTier === 'enhanced' && (
        <div className="text-center mb-6">
          <span className="inline-block bg-red-500 text-white px-4 py-2 rounded-full font-bold">
            🎉 LIMITED TIME: Save 28% on Enhanced Report!
          </span>
        </div>
      )}
      
      {/* Disclaimer for payment pages */}
      <div className="disclaimer-box max-w-3xl mx-auto mb-12">
        <p className="text-sm">
          <strong>Important:</strong> These enhanced educational reports are for wellness guidance only. 
          They do not constitute a medical diagnosis or individualized treatment plan. 
          Always consult with a licensed healthcare provider for medical advice.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {tiers.map((tier) => (
          <div
            key={tier.priceId}
            className={`relative rounded-lg border-2 p-8 transition-all ${
              highlightedTier === tier.priceId 
                ? 'border-green-500 shadow-2xl transform scale-105 bg-green-50' 
                : tier.popular 
                  ? 'border-blue-500 shadow-xl' 
                  : 'border-gray-200'
            }`}
          >
            {tier.priceId === 'enhanced' && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                28% OFF!
              </span>
            )}
            {tier.popular && tier.priceId !== 'enhanced' && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                Most Popular
              </span>
            )}
            
            <h2 className="text-2xl font-bold mb-4">{tier.name}</h2>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">${tier.price}</span>
              {tier.priceId === 'enhanced' && (
                <span className="text-2xl text-gray-500 line-through ml-2">$7</span>
              )}
              <span className="text-gray-600"> one time</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handlePurchase(tier)}
              disabled={loading !== null}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                tier.popular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } ${loading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading === tier.priceId ? 'Creating checkout...' : `Get ${tier.name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to guide
        </button>
      </div>
      
      {/* Post-purchase disclaimer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 max-w-2xl mx-auto">
          Thank you for purchasing this PainOptix™ guide. This content is educational in nature and not a substitute for professional medical advice. 
          No personal health information was used to generate this report.
        </p>
      </div>
    </div>
  )
}