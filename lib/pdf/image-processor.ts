import { 
  findMatchingExerciseImage, 
  getAnatomicalImages 
} from './monograph-images';


/**
 * Processes markdown content to add images for monograph PDFs only
 * @param markdown The original markdown content
 * @param condition The medical condition (e.g., 'disc_herniation')
 * @param tier The guide tier ('free', 'enhanced', or 'monograph')
 * @returns Processed markdown with images inserted (for monographs only)
 */
export function processMarkdownWithImages(
  markdown: string, 
  condition: string, 
  tier: string
): string {
  try {
    console.log('=== IMAGE PROCESSOR CALLED ===');
    console.log(`Condition: ${condition}, Tier: ${tier}, Content length: ${markdown.length}`);
    
    // Only add images for monographs
    if (tier !== 'monograph') {
      console.log(`Skipping image processing for tier: ${tier} (expected 'monograph')`);
      return markdown;
    }

    console.log(`Processing images for condition: ${condition}, tier: ${tier}`);

    let processedContent = markdown;

    // Process exercise sections (typically Section 7)
    processedContent = addExerciseImages(processedContent);

    // Add anatomical images to appropriate sections
    processedContent = addAnatomicalImages(processedContent, condition);

    return processedContent;
  } catch (error) {
    console.error('[PDF] CRITICAL ERROR in image processor:', error);
    console.error('[PDF] Error stack:', (error as Error).stack);
    // Return original markdown if image processing fails
    return markdown;
  }
}

/**
 * Adds exercise images to the movement/exercise sections
 */
function addExerciseImages(content: string): string {
  // Split content into lines for easier processing
  const lines = content.split('\n');
  const processedLines: string[] = [];
  let inExerciseSection = false;
  let exerciseCount = 0;
  console.log('processExerciseSection called, lines count:', lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we're entering an exercise section
    if (line.match(/^#{1,3}\s+.*?(Movement Plan|Movement Program|Exercise|Week \d+|Section 7)/i)) {
      inExerciseSection = true;
      console.log(`Entered exercise section at line ${i}: ${line}`);
    }
    
    // Check if we're leaving the exercise section (Section 8 or later)
    if (inExerciseSection && line.match(/^#{1,3}\s+.*?(Section [89]|Section 1[0-9]|Posture|Safety|Comfort|Medication|Professional|Prognosis|Tracking|References)/i)) {
      inExerciseSection = false;
    }

    processedLines.push(line);

    // If we're in an exercise section, look for exercise names
    if (inExerciseSection) {
      // Log lines that might contain exercises (commented out for cleaner logs)
      // if (line.includes('Press') || line.includes('Glide') || line.includes('Bridge') || 
      //     line.includes('Lying') || line.includes('Walk') || line.includes('**')) {
      //   console.log(`Potential exercise line: "${line.substring(0, 80)}..."`);
      // }
      
      // Pattern to match exercise names (bold text followed by colon, or list items)
      const exercisePatterns = [
        /^-\s*\*\*([^*]+)\*\*:/,  // - **Exercise Name:**
        /^\*\*([^*]+)\*\*:/,  // **Exercise Name**:
        /^-\s*\*\*([^*]+)\*\*/,  // - **Exercise Name**
        /^-\s*([A-Z][^:]+):/,  // - Exercise Name:
        /^\d+\.\s*\*\*([^*]+)\*\*/,  // 1. **Exercise Name**
        /^\d+\.\s*([A-Z][^:]+):/,  // 1. Exercise Name:
      ];

      for (const pattern of exercisePatterns) {
        if (pattern.test(line)) {
          // console.log(`Pattern matched: ${pattern}`);
          const match = line.match(pattern);
          // console.log(`Match groups:`, match);
          
          if (match) {
            let exerciseName = match[1].trim();
            // Remove trailing colon if present
            if (exerciseName.endsWith(':')) {
              exerciseName = exerciseName.slice(0, -1).trim();
            }
            const imageName = findMatchingExerciseImage(exerciseName);
            
            console.log(`Found exercise: "${exerciseName}", matched image: "${imageName}"`);
            
            if (imageName) {
              // Add the image markdown after the exercise line
              exerciseCount++;
              processedLines.push('');
              
              // Always use production URL for images so Puppeteer can load them
              const baseUrl = 'https://painoptixstaging.netlify.app';
              const encodedImageName = encodeURIComponent(imageName);
              const imageUrl = `${baseUrl}/medical-illustrations/exercises/${encodedImageName}`;
              console.log('[PDF] Using external image URL:', imageUrl);
              processedLines.push(`![${exerciseName}](${imageUrl})`);
              
              processedLines.push('');
            }
          }
          break;
        }
      }
    }
  }

  console.log(`Total exercises with images added: ${exerciseCount}`);
  return processedLines.join('\n');
}

/**
 * Adds anatomical images to relevant sections
 */
function addAnatomicalImages(content: string, condition: string): string {
  const anatomicalImages = getAnatomicalImages(condition);
  
  if (anatomicalImages.length === 0) {
    return content;
  }

  // Split content into sections
  const sections = content.split(/^(#{1,3}\s+.+)$/m);
  const processedSections: string[] = [];
  let anatomicalImageAdded = false; // Track if we've already added an anatomical image

  for (let i = 0; i < sections.length; i++) {
    processedSections.push(sections[i]);

    // Check if this is a section heading that should have anatomical images
    if (sections[i].match(/^#{1,3}\s+/) && !anatomicalImageAdded) {
      const sectionTitle = sections[i].toLowerCase();
      
      // Add anatomical images after relevant sections
      if (sectionTitle.includes('understanding') || 
          sectionTitle.includes('anatomy') || 
          sectionTitle.includes('what is') ||
          (sectionTitle.includes('section 1') && !sectionTitle.includes('week'))) {
        
        // Get the content after this heading
        const nextContent = sections[i + 1];
        if (nextContent && anatomicalImages.length > 0) {
          // Insert the first anatomical image at the beginning of the section content
          // Always use production URL for images so Puppeteer can load them
          const baseUrl = 'https://painoptixstaging.netlify.app';
          const encodedImageName = encodeURIComponent(anatomicalImages[0]);
          const imageUrl = `${baseUrl}/medical-illustrations/anatomical/${encodedImageName}`;
          console.log('[PDF] Using external anatomical image URL:', imageUrl);
          const imageMarkdown = `![Anatomical diagram](${imageUrl})`;
          sections[i + 1] = '\n\n' + imageMarkdown + '\n\n' + nextContent;
          anatomicalImageAdded = true; // Mark that we've added the image
        }
      }
    }
  }

  return processedSections.join('');
}