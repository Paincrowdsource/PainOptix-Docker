'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface GuideContentProps {
  guideType: string
  tier: 'free' | 'enhanced' | 'monograph'
  responses?: any[]
}

export function GuideContent({ guideType, tier, responses }: GuideContentProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch the markdown content from the API
        const response = await fetch(`/api/guide-content?type=${guideType}&tier=${tier}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`No ${tier} content found for ${guideType}`)
          }
          throw new Error(`Failed to load content: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.content) {
          // Remove frontmatter if present
          const contentWithoutFrontmatter = data.content.replace(/^---[\s\S]*?---\n/, '')
          setContent(contentWithoutFrontmatter)
        } else {
          throw new Error('No content received')
        }
      } catch (err) {
        console.error('Error loading guide content:', err)
        setError(err instanceof Error ? err.message : 'Failed to load content')
        setContent('')
      } finally {
        setLoading(false)
      }
    }
    
    loadContent()
  }, [guideType, tier])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 border-2 border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-2">Unable to Load Content</h3>
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-gray-600 mt-2">
          Please contact support if this issue persists.
        </p>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="p-6 border-2 border-gray-200 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">No content available for this guide.</p>
      </div>
    )
  }

  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}