'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface GuideContentProps {
  guideType: string
  tier: 'free' | 'enhanced' | 'monograph'
}

export function GuideContent({ guideType, tier }: GuideContentProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch(`/content/guides/${tier}/${guideType}.md`)
        if (response.ok) {
          const text = await response.text()
          // Remove frontmatter
          const contentWithoutFrontmatter = text.replace(/^---[\s\S]*?---\n/, '')
          setContent(contentWithoutFrontmatter)
        } else {
          setContent(`# ${guideType.replace(/_/g, ' ').toUpperCase()}\n\nContent coming soon...`)
        }
      } catch (error) {
        setContent('Error loading content')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [guideType, tier])

  if (loading) return <div>Loading content...</div>

  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}