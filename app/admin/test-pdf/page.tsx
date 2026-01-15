'use client'

import { useState } from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'

const GUIDE_TYPES = [
  { id: 'sciatica', name: 'Sciatica' },
  { id: 'upper_lumbar_radiculopathy', name: 'Upper Lumbar Radiculopathy' },
  { id: 'si_joint_dysfunction', name: 'SI Joint Dysfunction' },
  { id: 'canal_stenosis', name: 'Spinal Canal Stenosis' },
  { id: 'central_disc_bulge', name: 'Central Disc Bulge' },
  { id: 'facet_arthropathy', name: 'Facet Arthropathy' },
  { id: 'muscular_nslbp', name: 'Muscular Low Back Pain' },
  { id: 'lumbar_instability', name: 'Lumbar Instability' },
  { id: 'urgent_symptoms', name: 'Urgent Symptoms' }
]

const TIERS = [
  { id: 'free', name: 'Free' },
  { id: 'enhanced', name: 'Enhanced' },
  { id: 'comprehensive', name: 'Comprehensive' }
]

export default function TestPDFPage() {
  const [generating, setGenerating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generatePDF = async (guideType: string, tier: string) => {
    setGenerating(`${guideType}-${tier}`)
    setError(null)

    try {
      // Call the same API endpoint that users use, but with mock data
      const response = await fetch('/api/download-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: `admin-test-${guideType}`,
          tier: tier
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`)
      }

      // Get the PDF blob
      const pdfBlob = await response.blob()
      
      // Download the PDF
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${guideType}-${tier}-test.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Failed to generate PDF')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Test PDF Generation</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Generate test PDFs for any condition and tier combination without creating database records.
          </p>

          <div className="space-y-8">
            {GUIDE_TYPES.map((guide) => (
              <div key={guide.id} className="border-b pb-6 last:border-b-0">
                <div className="flex items-center mb-4">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium">{guide.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TIERS.map((tier) => {
                    const isGenerating = generating === `${guide.id}-${tier.id}`
                    
                    return (
                      <button
                        key={tier.id}
                        onClick={() => generatePDF(guide.id, tier.id)}
                        disabled={!!generating}
                        className={`
                          flex items-center justify-center px-4 py-2 rounded-lg border transition-all
                          ${isGenerating 
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                            : tier.id === 'free'
                              ? 'border-gray-300 hover:bg-gray-50'
                              : tier.id === 'enhanced'
                                ? 'border-blue-300 hover:bg-blue-50'
                                : 'border-green-300 hover:bg-green-50'
                          }
                        `}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            {tier.name}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Test PDF Features:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Generates PDFs without creating database records</li>
          <li>• Tests all condition and tier combinations</li>
          <li>• Uses mock assessment data for testing</li>
          <li>• Downloads directly to your device</li>
        </ul>
      </div>
    </div>
  )
}