import { describe, expect, it } from 'vitest';
import { absUrl, joinBase, withBase } from '../src/lib/urls';

describe('joinBase', () => {
  it('joins a base with or without a trailing slash', () => {
    expect(joinBase('/aws-learn/', 'config/')).toBe('/aws-learn/config/');
    expect(joinBase('/aws-learn', 'config/')).toBe('/aws-learn/config/');
  });

  it('strips leading slashes from the path so nothing doubles up', () => {
    expect(joinBase('/aws-learn/', '/config/')).toBe('/aws-learn/config/');
    expect(joinBase('/aws-learn/', '//config/')).toBe('/aws-learn/config/');
  });

  it('returns the base itself (with a trailing slash) for an empty path', () => {
    expect(joinBase('/aws-learn/', '')).toBe('/aws-learn/');
    expect(joinBase('/aws-learn')).toBe('/aws-learn/');
  });

  it('handles nested step paths, hashes and queries', () => {
    expect(joinBase('/aws-learn/', 'config/how-it-works/')).toBe('/aws-learn/config/how-it-works/');
    expect(joinBase('/aws-learn/', 'config/config-rules/#triggers')).toBe('/aws-learn/config/config-rules/#triggers');
    expect(joinBase('/aws-learn/', 'config/?q=rules')).toBe('/aws-learn/config/?q=rules');
  });

  it('preserves the presence or absence of a trailing slash', () => {
    expect(joinBase('/aws-learn/', 'config')).toBe('/aws-learn/config');
    expect(joinBase('/aws-learn/', 'favicon.ico')).toBe('/aws-learn/favicon.ico');
  });

  it('works with a root base', () => {
    expect(joinBase('/', 'config/')).toBe('/config/');
    expect(joinBase('/', '')).toBe('/');
  });
});

describe('withBase (uses astro.config base)', () => {
  it('is configured for /aws-learn/', () => {
    expect(withBase()).toBe('/aws-learn/');
  });

  it('prefixes page and asset paths', () => {
    expect(withBase('config/')).toBe('/aws-learn/config/');
    expect(withBase('/config/how-it-works/')).toBe('/aws-learn/config/how-it-works/');
    expect(withBase('favicon-32.png')).toBe('/aws-learn/favicon-32.png');
  });
});

describe('absUrl', () => {
  it('uses the configured site by default', () => {
    expect(absUrl()).toBe('https://www.studytrails.com/aws-learn/');
    expect(absUrl('config/')).toBe('https://www.studytrails.com/aws-learn/config/');
    expect(absUrl('config/how-it-works/')).toBe('https://www.studytrails.com/aws-learn/config/how-it-works/');
  });

  it('accepts an explicit site, with or without a trailing slash', () => {
    expect(absUrl('config/', 'https://example.com')).toBe('https://example.com/aws-learn/config/');
    expect(absUrl('config/', 'https://example.com/')).toBe('https://example.com/aws-learn/config/');
  });

  it('throws when no site is configured', () => {
    expect(() => absUrl('config/', '')).toThrow(/site/);
  });
});
