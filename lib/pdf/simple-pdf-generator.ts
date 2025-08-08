import { jsPDF } from 'jspdf';
import { marked } from 'marked';
import matter from 'gray-matter';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';

export async function generateSimplePDF(
  guideType: string,
  assessmentData: any,
  tier: 'free' | 'enhanced' | 'monograph'
): Promise<Buffer> {
  try {
    logger.info('Generating simple PDF as fallback', { guideType, tier });
    
    // Try to load the markdown content
    const contentDir = tier === 'monograph' ? 'monograph' : tier;
    const filePath = path.join(process.cwd(), 'content/guides', contentDir, `${guideType}.md`);
    
    let markdownContent: string;
    try {
      markdownContent = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.error('Could not read markdown file:', error);
      // Use placeholder content
      const safeGuideType = guideType || 'unknown';
      markdownContent = `# ${safeGuideType.replace(/_/g, ' ').toUpperCase()} Guide

## Notice
This is a placeholder PDF. The full content could not be loaded.

**Patient Name:** ${assessmentData.name || 'Patient'}
**Date:** ${new Date().toLocaleDateString()}
**Tier:** ${tier}

Please contact support if you continue to experience issues.`;
    }
    
    // Parse frontmatter
    const { content: mainContent } = matter(markdownContent);
    
    // Convert markdown to HTML
    const htmlContent = await marked.parse(mainContent || markdownContent);
    
    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    doc.setFontSize(20);
    const displayGuideType = guideType || 'unknown';
    doc.text(displayGuideType.replace(/_/g, ' ').toUpperCase(), 20, 20);
    
    // Add patient info
    doc.setFontSize(12);
    doc.text(`Patient: ${assessmentData.name || 'Patient'}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42);
    doc.text(`Assessment ID: ${assessmentData.id}`, 20, 49);
    
    // Add content (simplified - just extract text from HTML)
    const textContent = (htmlContent || '').replace(/<[^>]*>/g, '').substring(0, 5000);
    const lines = doc.splitTextToSize(textContent, 170);
    
    let y = 60;
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 7;
    }
    
    // Return as buffer
    const pdfString = doc.output('arraybuffer');
    return Buffer.from(pdfString);
    
  } catch (error: any) {
    logger.error('Simple PDF generation failed:', error);
    throw error;
  }
}