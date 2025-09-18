/**
 * Generate source tag for check-in attribution
 * @param day The check-in day (3, 7, or 14)
 * @returns Source tag for Stripe metadata
 */
export function sourceTag(day: 3 | 7 | 14): string {
  return `checkin_d${day}`;
}

/**
 * Parse source tag to get day number
 * @param source The source tag from Stripe metadata
 * @returns Day number if valid check-in source, null otherwise
 */
export function parseSourceTag(source: string): number | null {
  const match = source.match(/^checkin_d(\d+)$/);
  if (match) {
    const day = parseInt(match[1]);
    if ([3, 7, 14].includes(day)) {
      return day;
    }
  }
  return null;
}