// Content loader for serverless environments
// This loads markdown content at build time to avoid filesystem access in production

import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

// Pre-load all guide content at build time
const GUIDE_CONTENT: Record<string, Record<string, string>> = {};

const tiers = ['free', 'enhanced', 'monograph'];
const guides = [
  'sciatica',
  'upper_lumbar_radiculopathy',
  'si_joint_dysfunction',
  'canal_stenosis',
  'central_disc_bulge',
  'facet_arthropathy',
  'muscular_nslbp',
  'lumbar_instability',
  'urgent_symptoms'
];

// Function to load content (can be called at runtime if needed)
function loadContent() {
  try {
    for (const tier of tiers) {
      if (!GUIDE_CONTENT[tier]) {
        GUIDE_CONTENT[tier] = {};
      }
      for (const guide of guides) {
        if (!GUIDE_CONTENT[tier][guide]) {
          try {
            const filePath = path.join(process.cwd(), 'content/guides', tier, `${guide}.md`);
            const content = fs.readFileSync(filePath, 'utf-8');
            GUIDE_CONTENT[tier][guide] = content;
            logger.debug(`Loaded ${tier}/${guide}.md`);
          } catch (error) {
            logger.warn(`Could not load ${tier}/${guide}.md - file may not exist`);
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error loading guide content:', error);
  }
}

// Load content at module initialization
loadContent();

export function getGuideContent(tier: string, guideType: string): string | null {
  // Debug logging
  console.info(`getGuideContent called with tier: ${tier}, guideType: ${guideType}`);
  console.info(`Available tiers:`, Object.keys(GUIDE_CONTENT));
  console.info(`Available guides for ${tier}:`, GUIDE_CONTENT[tier] ? Object.keys(GUIDE_CONTENT[tier]) : 'tier not found');
  
  // Try to load content if not already loaded
  if (!GUIDE_CONTENT[tier] || !GUIDE_CONTENT[tier][guideType]) {
    logger.info(`Content not pre-loaded, attempting runtime load for ${tier}/${guideType}`);
    loadContent();
  }
  
  if (!GUIDE_CONTENT[tier] || !GUIDE_CONTENT[tier][guideType]) {
    logger.error(`Guide content not found after loading attempt: ${tier}/${guideType}`);
    return null;
  }
  return GUIDE_CONTENT[tier][guideType];
}

export function isContentLoaded(): boolean {
  return Object.keys(GUIDE_CONTENT).length > 0;
}