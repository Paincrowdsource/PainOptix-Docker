import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const tier = searchParams.get('tier') || 'free'
    
    console.log(`Fetching content: type=${type}, tier=${tier}`)
    
    // Validate tier
    const validTiers = ['free', 'enhanced', 'monograph']
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier', content: '' },
        { status: 400 }
      )
    }
    
    // Sanitize the type to prevent path traversal
    const safeType = type.replace(/[^a-z0-9_-]/gi, '').toLowerCase()
    
    if (!safeType) {
      return NextResponse.json(
        { error: 'Invalid guide type', content: '' },
        { status: 400 }
      )
    }
    
    // Build the file path
    const contentPath = path.join(process.cwd(), 'content', 'guides', tier, `${safeType}.md`)
    
    console.log(`Looking for content at: ${contentPath}`)
    
    // Check if file exists
    if (!fs.existsSync(contentPath)) {
      console.error(`Content file not found: ${contentPath}`)
      
      // Try with underscores instead of hyphens
      const altType = safeType.replace(/-/g, '_')
      const altPath = path.join(process.cwd(), 'content', 'guides', tier, `${altType}.md`)
      
      if (fs.existsSync(altPath)) {
        const content = fs.readFileSync(altPath, 'utf-8')
        return NextResponse.json({
          content,
          type: altType,
          tier
        })
      }
      
      return NextResponse.json(
        { error: `Content not found for ${type} (${tier} tier)`, content: '' },
        { status: 404 }
      )
    }
    
    // Read the content
    const content = fs.readFileSync(contentPath, 'utf-8')
    
    console.log(`Successfully loaded ${content.length} characters of content`)
    
    return NextResponse.json({
      content,
      type: safeType,
      tier
    })
  } catch (error) {
    console.error('Error serving guide content:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load content', 
        details: error instanceof Error ? error.message : 'Unknown error',
        content: '' 
      },
      { status: 500 }
    )
  }
}