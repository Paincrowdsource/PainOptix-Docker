/**
 * Utility functions for processing markdown content
 */

/**
 * Remove duplicate PAINOPTIX title headers from markdown content
 */
export const stripDocumentTitle = (md: string): string => {
  // Remove any line starting with # PAINOPTIX
  // This includes variations like:
  // # PAINOPTIX™ ENHANCED CLINICAL GUIDE
  // # PainOptix™ Upper Lumbar Radiculopathy Monograph
  return md
    .replace(/^#\s*PAINOPTIX.*GUIDE.*$/gim, '')
    .replace(/^#\s*PainOptix.*Monograph.*$/gim, '')
    .replace(/^\n+/gm, '\n') // Clean up extra newlines
    .trim();
};