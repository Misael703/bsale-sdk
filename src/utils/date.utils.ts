/**
 * Converts a JavaScript Date to a Bsale Unix timestamp (seconds).
 * @param date - The date to convert
 * @returns Unix timestamp in seconds
 */
export function toBsaleTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Converts a Bsale Unix timestamp (seconds) to a JavaScript Date.
 * @param timestamp - Unix timestamp in seconds
 * @returns JavaScript Date object
 */
export function fromBsaleTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Formats a Bsale Unix timestamp as a human-readable date string.
 * @param timestamp - Unix timestamp in seconds
 * @param locale - Locale for formatting (default: 'es-CL')
 * @returns Formatted date string
 */
export function formatBsaleDate(timestamp: number, locale: string = 'es-CL'): string {
  const date = fromBsaleTimestamp(timestamp);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Returns today at 00:00:00 as a Bsale Unix timestamp (seconds).
 * @returns Unix timestamp in seconds for the start of today
 */
export function todayBsaleTimestamp(): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(today.getTime() / 1000);
}
