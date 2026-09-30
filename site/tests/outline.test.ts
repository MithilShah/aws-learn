import { describe, expect, it } from 'vitest';
import { buildOutline } from '../src/lib/outline';

const h = (depth: number, text: string) => ({ depth, text, slug: text.toLowerCase().replace(/\s+/g, '-') });

describe('buildOutline', () => {
  it('nests H3s under the preceding H2', () => {
    expect(buildOutline([h(2, 'Recording'), h(3, 'Continuous'), h(3, 'Daily'), h(2, 'Delivery')])).toEqual([
      {
        slug: 'recording',
        text: 'Recording',
        children: [
          { slug: 'continuous', text: 'Continuous' },
          { slug: 'daily', text: 'Daily' },
        ],
      },
      { slug: 'delivery', text: 'Delivery', children: [] },
    ]);
  });

  it('ignores H1 and H4+ headings', () => {
    expect(buildOutline([h(1, 'Title'), h(2, 'Rules'), h(4, 'Detail')])).toEqual([
      { slug: 'rules', text: 'Rules', children: [] },
    ]);
  });

  it('keeps an H3 that comes before any H2', () => {
    expect(buildOutline([h(3, 'Intro'), h(2, 'Rules')]).map((s) => s.slug)).toEqual(['intro', 'rules']);
  });

  it('skips headings without an id', () => {
    expect(buildOutline([{ depth: 2, slug: '', text: 'No id' }])).toEqual([]);
  });

  it('returns nothing for a page without headings', () => {
    expect(buildOutline([])).toEqual([]);
  });
});
