/**
 * Helper functions for PDF generation
 */

import { isHighestTier } from '@/lib/utils/tier-mapping';

// Helper function to drop front-matter for Enhanced/Free tiers
export function dropFrontMatter(raw: string, tier: string): string {
  if (isHighestTier(tier)) return raw;
  
  // Remove the full front-matter block up to and including the date line
  return (raw || '').replace(
    /^PainOptix™[\s\S]+?(?:Date:.*\n)/, // up to and incl. the date line
    ''
  ).trimStart();
}

// Helper function to fix prescriptive medical language
export function fixMedicalLanguage(text: string, isBibliography: boolean = false): string {
  // If this is bibliography content, don't apply ANY replacements
  if (isBibliography) {
    return text;
  }
  
  // Split on bibliography to protect academic citations
  const [main, ...rest] = text.split(/\n## Bibliography/i);
  
  // Critical regulatory compliance replacements
  const replacements: Record<string, string> = {
    // Patient → User
    'Patient Information': 'User Information',
    'patient-specific': 'based on your responses',
    'patient': 'user',
    'Patient': 'User',
    
    // Remove Personalized
    'Personalized Educational Guide': 'Educational Guide',
    'personalized': 'educational',
    'Personalized': 'Educational',
    
    // Treatment → Management
    'treatment': 'management approach',
    'Treatment': 'Management Approach',
    'treat': 'manage',
    'Treat': 'Manage',
    
    // Fix prescriptive language
    'will help': 'may help',
    'will improve': 'may improve',
    'will reduce': 'may reduce',
    'you need': 'you may consider',
    'You need': 'You may consider',
    'Try the': 'Consider the',
    'Use the': 'You may use the',
    'Take NSAIDs': 'Some people find NSAIDs helpful',
    'take NSAIDs': 'some people find NSAIDs helpful',
    'Your symptoms require': 'Your symptoms may benefit from',
    'helps to': 'may help',
    'improves': 'may improve',
    'reduces': 'may reduce',
    
    // Fix outcome promises
    'Taking Control': 'Understanding',
    'A Path to Better': 'Information About',
    'to support mobility and reduce discomfort': 'for educational purposes',
    'evidence-based strategies': 'educational information',
    'have helped many': 'are used by some people',
    
    // Fix success rate claims
    '80–90% improve': 'many people report improvement',
    '60–75% improve': 'some people report improvement',
    '%improve': '% may experience improvement',
    '% improve': '% may experience improvement'
  };
  
  // Apply replacements only to main content (not bibliography)
  let processed = main;
  for (const [find, replace] of Object.entries(replacements)) {
    processed = (processed || '').replace(new RegExp(find, 'gi'), replace);
  }
  
  // Reconstruct with untouched bibliography
  return rest.length ? `${processed}\n## Bibliography${rest.join('## Bibliography')}` : processed;
}

// Check if section is bibliography
export const isBibStart = (line: string): boolean => {
  return /^##\s*BIBLIOGRAPHY/i.test(line);
};

// Bibliography entry interface
export interface BibEntry {
  index: number;
  text: string;
}

// Parse bibliography entries
export const parseBibliography = (lines: string[]): BibEntry[] => {
  const bib: BibEntry[] = [];
  let inBibliography = false;
  let currentEntry: BibEntry | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (isBibStart(l)) {
      inBibliography = true;
      continue;
    }
    if (!inBibliography) continue;

    // New entry: "^\d+\.\s"
    const newMatch = l.match(/^(\d+)\.\s+(.*)/);
    if (newMatch) {
      // Save previous entry if exists
      if (currentEntry) {
        bib.push(currentEntry);
      }
      currentEntry = { index: Number(newMatch[1]), text: newMatch[2] };
      continue;
    }

    // Continuation line (NOT starting with number) - including DOI URLs
    if (currentEntry && !/^\d+\./.test(l) && l.trim()) {
      // Glue DOI/URL lines with preceding text
      if (isDOIUrl(l) || /^https?:\/\//i.test(l)) {
        currentEntry.text = `${currentEntry.text} ${l.trim()}`;
      } else {
        currentEntry.text = `${currentEntry.text} ${(l || '').replace(/\s+/g, ' ').trim()}`;
      }
    }
  }
  
  // Don't forget the last entry
  if (currentEntry) {
    bib.push(currentEntry);
  }
  
  return bib;
};

// Check if line is a DOI URL
export const isDOIUrl = (line: string): boolean => {
  return /^https?:\/\/(dx\.)?doi\.org\//i.test(line.trim());
};

// Check if paragraph is an orphaned title block that should be skipped
export const isOrphanTitle = (paragraph: string, tier: string): boolean => {
  // Only apply to free and enhanced tiers
  if (isHighestTier(tier)) return false;
  
  const p = paragraph.trim();
  
  // Very specific match for the exact front-matter title block only
  return /^PainOptix™\s+(Educational|Enhanced Clinical)\s+Guide$/i.test(p) ||
         /^PainOptix™.*Evidence-Based Information/i.test(p);
};