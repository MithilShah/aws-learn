/**
 * URL helpers that respect Astro's `base` ('/aws') and `site`
 * (https://www.studytrails.com). Every internal link, asset path and absolute
 * URL (canonical, OG, JSON-LD) goes through these — never hardcode '/aws'.
 *
 * Paths are site-relative *within* the base: 'config/' means /aws/config/.
 * Trailing slashes are preserved exactly as given, because the site uses
 * trailingSlash: 'always' for pages ('config/') but assets must not get one
 * ('favicon.ico'). Pass page paths with a trailing slash.
 */

/**
 * Join a base path and a path, normalising the slashes between them.
 * Pure (no Astro env), so it's easy to test with any base.
 *
 *   joinBase('/aws/', 'config/')      -> '/aws/config/'
 *   joinBase('/aws', '/favicon.ico')  -> '/aws/favicon.ico'
 *   joinBase('/aws/', '')             -> '/aws/'
 *   joinBase('/', 'config/')          -> '/config/'
 */
export function joinBase(base: string, path = ''): string {
  const b = base.replace(/\/+$/, ''); // '/aws/' -> '/aws', '/' -> ''
  const p = path.replace(/^\/+/, ''); // '/config/' -> 'config/'
  return `${b}/${p}`;
}

/**
 * Root-relative path under the configured base.
 *
 *   withBase()                  -> '/aws/'
 *   withBase('config/')         -> '/aws/config/'
 *   withBase('config/#rules')   -> '/aws/config/#rules'
 *   withBase('favicon-32.png')  -> '/aws/favicon-32.png'
 */
export function withBase(path = ''): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

/**
 * Absolute URL on the configured site, for canonical / OG / JSON-LD.
 * `site` defaults to astro.config's `site`; pass one explicitly in tests.
 *
 *   absUrl('config/') -> 'https://www.studytrails.com/aws/config/'
 */
export function absUrl(path = '', site: string | undefined = import.meta.env.SITE): string {
  if (!site) {
    throw new Error('absUrl: `site` is not set in astro.config.mjs');
  }
  return new URL(withBase(path), site).href;
}
