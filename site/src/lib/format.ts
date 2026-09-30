/**
 * Date helpers. Frontmatter dates like `2026-09-29` parse to UTC midnight,
 * so format in UTC; local time zones would otherwise show the day before.
 */

/** Human-readable date, e.g. 'September 29, 2026'. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Machine-readable date for <time datetime>, e.g. '2026-09-29'. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
