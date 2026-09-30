import { describe, expect, it } from 'vitest';
import { DESCRIPTION_MAX, journeyPageSchema } from '../src/lib/schema';

const valid = {
  title: 'How AWS Config Works',
  navTitle: 'How it works',
  description: 'Follow a change through AWS Config, from resource discovery to delivery.',
  summary: 'How AWS Config records configuration items.',
  order: 2,
  sources: [
    {
      title: 'How AWS Config Works',
      url: 'https://docs.aws.amazon.com/config/latest/developerguide/how-does-config-work.html',
    },
  ],
  lastVerified: '2026-09-29',
};

function withSourceUrl(url: string) {
  return { ...valid, sources: [{ title: 'A page', url }] };
}

/** Issue messages for a failed parse, for readable assertions. */
function errorsFor(data: unknown): string[] {
  const result = journeyPageSchema.safeParse(data);
  expect(result.success).toBe(false);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
}

describe('journeyPageSchema', () => {
  it('accepts a complete step page and parses lastVerified to a UTC date', () => {
    const data = journeyPageSchema.parse(valid);
    expect(data.lastVerified).toBeInstanceOf(Date);
    expect(data.lastVerified.toISOString()).toBe('2026-09-29T00:00:00.000Z');
  });

  it('accepts a Date for lastVerified (YAML parses bare dates to Date)', () => {
    expect(journeyPageSchema.safeParse({ ...valid, lastVerified: new Date('2026-09-29') }).success).toBe(true);
  });

  it('allows order to be omitted (the overview page has none)', () => {
    const { order: _order, ...overview } = valid;
    expect(journeyPageSchema.safeParse(overview).success).toBe(true);
  });

  describe('sources', () => {
    it('accepts docs.aws.amazon.com and aws.amazon.com pages', () => {
      expect(journeyPageSchema.safeParse(withSourceUrl('https://aws.amazon.com/config/faq/')).success).toBe(true);
      expect(
        journeyPageSchema.safeParse(
          withSourceUrl('https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html'),
        ).success,
      ).toBe(true);
    });

    it.each([
      ['a non-AWS host', 'https://example.com/aws-config-guide'],
      ['a blog on a subdomain of aws.amazon.com', 'https://blog.aws.amazon.com/post'],
      ['a lookalike host', 'https://docs.aws.amazon.com.example.com/config/'],
      ['an AWS URL only in the query string', 'https://example.com/?u=https://docs.aws.amazon.com/'],
      ['plain http', 'http://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html'],
      ['embedded credentials', 'https://user:pass@docs.aws.amazon.com/config/'],
      ['a relative path', '/config/latest/developerguide/WhatIsConfig.html'],
    ])('rejects %s', (_label, url) => {
      expect(errorsFor(withSourceUrl(url)).some((e) => e.startsWith('sources.0.url'))).toBe(true);
    });

    it('normalises the URL (lowercase host)', () => {
      const data = journeyPageSchema.parse(withSourceUrl('https://DOCS.AWS.AMAZON.COM/config/'));
      expect(data.sources[0].url).toBe('https://docs.aws.amazon.com/config/');
    });

    it('requires at least one source', () => {
      expect(errorsFor({ ...valid, sources: [] }).some((e) => e.startsWith('sources'))).toBe(true);
    });
  });

  describe('description', () => {
    it(`accepts exactly ${DESCRIPTION_MAX} characters`, () => {
      expect(journeyPageSchema.safeParse({ ...valid, description: 'a'.repeat(DESCRIPTION_MAX) }).success).toBe(true);
    });

    it(`rejects more than ${DESCRIPTION_MAX} characters`, () => {
      const errors = errorsFor({ ...valid, description: 'a'.repeat(DESCRIPTION_MAX + 1) });
      expect(errors).toContain(`description: description must be ${DESCRIPTION_MAX} characters or fewer`);
    });

    it('rejects an empty or whitespace-only description', () => {
      errorsFor({ ...valid, description: '   ' });
    });
  });

  it('rejects a missing required field', () => {
    const { title: _title, ...noTitle } = valid;
    expect(errorsFor(noTitle).some((e) => e.startsWith('title'))).toBe(true);
  });

  it('rejects unknown keys, catching frontmatter typos', () => {
    const errors = errorsFor({ ...valid, lastverified: '2026-09-29' });
    expect(errors.join('\n')).toMatch(/lastverified/);
  });

  it.each([0, -1, 1.5])('rejects order %s', (order) => {
    expect(errorsFor({ ...valid, order }).some((e) => e.startsWith('order'))).toBe(true);
  });

  it('rejects an invalid lastVerified date', () => {
    expect(errorsFor({ ...valid, lastVerified: 'last week' }).some((e) => e.startsWith('lastVerified'))).toBe(true);
  });
});
