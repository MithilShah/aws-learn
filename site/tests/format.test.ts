import { describe, expect, it } from 'vitest';
import { formatDate, isoDate } from '../src/lib/format';

describe('date formatting', () => {
  // Frontmatter `lastVerified: 2026-09-29` parses to UTC midnight.
  const verified = new Date('2026-09-29T00:00:00.000Z');

  it('formats in UTC, so no time zone shows the previous day', () => {
    expect(formatDate(verified)).toBe('September 29, 2026');
  });

  it('gives a machine-readable date for <time datetime>', () => {
    expect(isoDate(verified)).toBe('2026-09-29');
  });
});
