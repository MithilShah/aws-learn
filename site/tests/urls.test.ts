import { describe, expect, it } from 'vitest';
import { absUrl, joinBase, withBase } from '../src/lib/urls';

describe('joinBase', () => {
  it('joins a base with or without a trailing slash', () => {
    expect(joinBase('/aws/', 'config/')).toBe('/aws/config/');
    expect(joinBase('/aws', 'config/')).toBe('/aws/config/');
  });

  it('strips leading slashes from the path so nothing doubles up', () => {
    expect(joinBase('/aws/', '/config/')).toBe('/aws/config/');
    expect(joinBase('/aws/', '//config/')).toBe('/aws/config/');
  });

  it('returns the base itself (with a trailing slash) for an empty path', () => {
    expect(joinBase('/aws/', '')).toBe('/aws/');
    expect(joinBase('/aws')).toBe('/aws/');
  });

  it('handles nested step paths, hashes and queries', () => {
    expect(joinBase('/aws/', 'config/how-it-works/')).toBe('/aws/config/how-it-works/');
    expect(joinBase('/aws/', 'config/config-rules/#triggers')).toBe('/aws/config/config-rules/#triggers');
    expect(joinBase('/aws/', 'config/?q=rules')).toBe('/aws/config/?q=rules');
  });

  it('preserves the presence or absence of a trailing slash', () => {
    expect(joinBase('/aws/', 'config')).toBe('/aws/config');
    expect(joinBase('/aws/', 'favicon.ico')).toBe('/aws/favicon.ico');
  });

  it('works with a root base', () => {
    expect(joinBase('/', 'config/')).toBe('/config/');
    expect(joinBase('/', '')).toBe('/');
  });
});

describe('withBase (uses astro.config base)', () => {
  it('is configured for /aws/', () => {
    expect(withBase()).toBe('/aws/');
  });

  it('prefixes page and asset paths', () => {
    expect(withBase('config/')).toBe('/aws/config/');
    expect(withBase('/config/how-it-works/')).toBe('/aws/config/how-it-works/');
    expect(withBase('favicon-32.png')).toBe('/aws/favicon-32.png');
  });
});

describe('absUrl', () => {
  it('uses the configured site by default', () => {
    expect(absUrl()).toBe('https://www.studytrails.com/aws/');
    expect(absUrl('config/')).toBe('https://www.studytrails.com/aws/config/');
    expect(absUrl('config/how-it-works/')).toBe('https://www.studytrails.com/aws/config/how-it-works/');
  });

  it('accepts an explicit site, with or without a trailing slash', () => {
    expect(absUrl('config/', 'https://example.com')).toBe('https://example.com/aws/config/');
    expect(absUrl('config/', 'https://example.com/')).toBe('https://example.com/aws/config/');
  });

  it('throws when no site is configured', () => {
    expect(() => absUrl('config/', '')).toThrow(/site/);
  });
});
