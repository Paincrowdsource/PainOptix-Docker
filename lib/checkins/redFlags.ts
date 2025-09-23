import "server-only";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

// Fallback red-flag keywords (current hardcoded list)
const FALLBACK_RED_FLAGS = [
  "bladder",
  "bowel",
  "saddle",
  "numbness",
  "fever",
  "trauma",
  "progressive weakness",
  "loss of control",
  "incontinence",
];

let cachedTerms: string[] | null = null;
let lastLoaded = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Load red-flag keywords from YAML file with caching
 * Falls back to hardcoded list if file is not available
 */
function loadRedFlagTerms(): string[] {
  const now = Date.now();

  // Return cached terms if still valid
  if (cachedTerms && now - lastLoaded < CACHE_TTL_MS) {
    return cachedTerms;
  }

  try {
    const yamlPath = join(process.cwd(), "docs", "checkins", "red-flags.yml");

    if (existsSync(yamlPath)) {
      const fileContent = readFileSync(yamlPath, "utf-8");
      const parsed = parse(fileContent);

      if (parsed?.terms && Array.isArray(parsed.terms)) {
        cachedTerms = parsed.terms.map((term: unknown) =>
          String(term).toLowerCase().trim()
        ).filter(Boolean);
        lastLoaded = now;

        console.log(`[redFlags] Loaded ${cachedTerms?.length || 0} terms from YAML`);
        return cachedTerms || [];
      }
    }
  } catch (error) {
    console.error("[redFlags] Failed to load from YAML, using fallback", error);
  }

  // Use fallback if file loading fails
  cachedTerms = FALLBACK_RED_FLAGS;
  lastLoaded = now;
  return cachedTerms;
}

/**
 * Scan text for red-flag keywords
 * @param note The text to scan
 * @returns Array of matched red-flag terms (case-insensitive match)
 */
export function scanRedFlags(note: string): string[] {
  if (!note || typeof note !== "string") {
    return [];
  }

  const terms = loadRedFlagTerms();
  const lowerNote = note.toLowerCase();
  const matched: string[] = [];

  for (const term of terms) {
    // Handle multi-word terms (e.g., "progressive weakness")
    if (lowerNote.includes(term)) {
      matched.push(term);
    }
  }

  return matched;
}

/**
 * Force reload of red-flag terms (useful for tests)
 */
export function clearRedFlagCache(): void {
  cachedTerms = null;
  lastLoaded = 0;
}