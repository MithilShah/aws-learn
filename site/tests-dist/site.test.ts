/**
 * Checks the built site in dist/ the way a crawler or a share preview sees it.
 * Run after `npm run build`: `npm run test:dist`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, type HTMLElement } from 'node-html-parser';
import { beforeAll, describe, expect, it } from 'vitest';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const SITE = 'https://www.studytrails.com';
const BASE = '/aws-learn/';
const GOATCOUNTER = 'https://studytrails.goatcounter.com/count';

interface Page {
  file: string;
  /** URL path, e.g. '/aws-learn/config/how-it-works/' or '/aws-learn/404.html'. */
  path: string;
  root: HTMLElement;
  noindex: boolean;
  jsonLd: Record<string, unknown>[];
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function urlPathFor(file: string): string {
  const rel = relative(DIST, file).split(sep).join('/');
  return BASE + rel.replace(/(^|\/)index\.html$/, '$1');
}

/** Map a root-relative URL to the file Apache would serve from dist/. */
function fileFor(urlPath: string): string | null {
  if (!urlPath.startsWith(BASE)) return null;
  const rel = decodeURI(urlPath.slice(BASE.length));
  const candidate = join(DIST, rel.endsWith('/') || rel === '' ? `${rel}index.html` : rel);
  return existsSync(candidate) && statSync(candidate).isFile() ? candidate : null;
}

/** PNG width/height from the IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(file);
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const meta = (root: HTMLElement, key: string) =>
  root.querySelector(`meta[property="${key}"]`)?.getAttribute('content') ??
  root.querySelector(`meta[name="${key}"]`)?.getAttribute('content');

let pages: Page[] = [];
let indexable: Page[] = [];
const byPath = new Map<string, Page>();

beforeAll(() => {
  if (!existsSync(join(DIST, 'index.html'))) {
    throw new Error('dist/ is missing: run `npm run build` first.');
  }
  pages = walk(DIST)
    .filter((f) => f.endsWith('.html') && !f.includes(`${sep}pagefind${sep}`))
    .map((file) => {
      const root = parse(readFileSync(file, 'utf8'));
      const robots = root.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
      const jsonLd = root
        .querySelectorAll('script[type="application/ld+json"]')
        .map((s) => JSON.parse(s.text) as Record<string, unknown>);
      return { file, path: urlPathFor(file), root, noindex: robots.includes('noindex'), jsonLd };
    });
  indexable = pages.filter((p) => !p.noindex);
  for (const p of pages) byPath.set(p.path, p);
});

describe('the build', () => {
  it('has the hub, both journey overviews, their steps and the 404 page', () => {
    const paths = pages.map((p) => p.path).sort();
    expect(paths).toEqual(
      [
        '/aws-learn/',
        '/aws-learn/404.html',
        '/aws-learn/config/',
        '/aws-learn/config/config-rules/',
        '/aws-learn/config/config-vs-cloudtrail-vs-cloudwatch/',
        '/aws-learn/config/conformance-packs-and-aggregators/',
        '/aws-learn/config/how-it-works/',
        '/aws-learn/config/remediation/',
        '/aws-learn/config/what-is-aws-config/',
        '/aws-learn/s3/',
        '/aws-learn/s3/buckets-and-objects/',
        '/aws-learn/s3/s3-vs-ebs-vs-efs/',
        '/aws-learn/s3/security-and-access/',
        '/aws-learn/s3/storage-classes/',
        '/aws-learn/s3/versioning-and-lifecycle/',
        '/aws-learn/s3/what-is-amazon-s3/',
      ].sort(),
    );
  });

  it('never mentions the book path', () => {
    const offenders = walk(DIST)
      .filter((f) => /\.(html|js|css|xml|json|txt)$/.test(f))
      .filter((f) => readFileSync(f, 'utf8').includes('agentic-ai-book'));
    expect(offenders.map((f) => relative(DIST, f))).toEqual([]);
  });
});

describe('every page', () => {
  it('has a title, description, language and exactly one h1', () => {
    for (const { path, root } of pages) {
      const title = root.querySelector('title')?.text.trim() ?? '';
      const description = meta(root, 'description') ?? '';
      expect(title, path).not.toBe('');
      expect(title.length, `${path} title "${title}"`).toBeLessThanOrEqual(70);
      expect(description.length, `${path} description`).toBeGreaterThan(50);
      expect(description.length, `${path} description`).toBeLessThanOrEqual(160);
      expect(root.querySelector('html')?.getAttribute('lang'), path).toBe('en');
      expect(root.querySelectorAll('h1').length, `${path} h1 count`).toBe(1);
    }
  });

  it('loads GoatCounter', () => {
    for (const { path, root } of pages) {
      const script = root.querySelector('script[data-goatcounter]');
      expect(script?.getAttribute('data-goatcounter'), path).toBe(GOATCOUNTER);
      expect(script?.getAttribute('src'), path).toBe('https://gc.zgo.at/count.js');
    }
  });

  it('has a 1200×630 share image that exists, with alt text', () => {
    for (const { path, root } of pages) {
      const image = meta(root, 'og:image') ?? '';
      expect(image.startsWith(`${SITE}${BASE}og/`), `${path} og:image ${image}`).toBe(true);
      expect(meta(root, 'twitter:image'), path).toBe(image);
      expect(meta(root, 'twitter:card'), path).toBe('summary_large_image');
      expect(meta(root, 'og:image:width'), path).toBe('1200');
      expect(meta(root, 'og:image:height'), path).toBe('630');
      expect(meta(root, 'og:image:alt')?.length ?? 0, path).toBeGreaterThan(10);
      const file = fileFor(new URL(image).pathname);
      expect(file, `${path} -> ${image}`).not.toBeNull();
      expect(pngSize(file!), image).toEqual({ width: 1200, height: 630 });
    }
  });

  it('only links to files that exist, and to ids that exist on them', () => {
    const broken: string[] = [];
    for (const page of pages) {
      const refs = page.root
        .querySelectorAll('a[href], link[href], script[src], img[src]')
        .map((el) => el.getAttribute('href') ?? el.getAttribute('src') ?? '');
      for (const ref of refs) {
        if (/^(https?:|mailto:|data:)/.test(ref)) {
          if (ref.startsWith('http:')) broken.push(`${page.path}: insecure link ${ref}`);
          continue;
        }
        const [pathPart, hash] = ref.split('#');
        const targetPath = pathPart === '' ? page.path : pathPart;
        if (!targetPath.startsWith('/')) {
          broken.push(`${page.path}: relative link ${ref}`);
          continue;
        }
        const file = fileFor(targetPath);
        if (!file) {
          broken.push(`${page.path}: ${ref} (no such file)`);
          continue;
        }
        if (hash && file.endsWith('.html')) {
          const target = byPath.get(targetPath) ?? byPath.get(urlPathFor(file));
          if (!target?.root.getElementById(hash)) broken.push(`${page.path}: ${ref} (no #${hash})`);
        }
      }
    }
    expect(broken).toEqual([]);
  });
});

describe('indexable pages', () => {
  it('have a canonical URL that is their own absolute URL', () => {
    for (const { path, root } of indexable) {
      const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href');
      expect(canonical, path).toBe(`${SITE}${path}`);
      expect(meta(root, 'og:url'), path).toBe(canonical);
      expect(meta(root, 'og:title'), path).toBeTruthy();
      expect(meta(root, 'og:description'), path).toBe(meta(root, 'description'));
    }
  });

  it('have unique titles and descriptions', () => {
    const titles = indexable.map((p) => p.root.querySelector('title')?.text);
    const descriptions = indexable.map((p) => meta(p.root, 'description'));
    expect(new Set(titles).size).toBe(indexable.length);
    expect(new Set(descriptions).size).toBe(indexable.length);
  });

  it('have valid JSON-LD whose URLs all point at real pages', () => {
    for (const { path, jsonLd } of indexable) {
      expect(jsonLd.length, path).toBeGreaterThan(0);
      for (const data of jsonLd) {
        expect(data['@context'], path).toBe('https://schema.org');
        expect(typeof data['@type'], path).toBe('string');
        // Every absolute URL under the site must be a page we built.
        const urls = JSON.stringify(data).match(/https:\/\/www\.studytrails\.com\/aws-learn\/[^"]*/g) ?? [];
        for (const url of urls) {
          expect(fileFor(new URL(url).pathname), `${path} JSON-LD -> ${url}`).not.toBeNull();
        }
      }
    }
  });
});

describe('structured data by page type', () => {
  const types = (path: string) => byPath.get(path)!.jsonLd.map((d) => d['@type']);

  it('hub: an ItemList of journeys', () => {
    expect(types('/aws-learn/')).toEqual(['ItemList']);
  });

  it('overview: a Course listing all six steps, plus breadcrumbs', () => {
    expect(types('/aws-learn/config/')).toEqual(['Course', 'BreadcrumbList']);
    const courseLd = byPath.get('/aws-learn/config/')!.jsonLd[0];
    expect((courseLd.hasPart as unknown[]).length).toBe(6);
  });

  it('steps: a TechArticle with citations, plus a three-level breadcrumb', () => {
    const steps = indexable.filter((p) => /^\/aws-learn\/config\/[^/]+\/$/.test(p.path));
    expect(steps.length).toBe(6);
    for (const { path, jsonLd } of steps) {
      expect(jsonLd.map((d) => d['@type']), path).toEqual(['TechArticle', 'BreadcrumbList']);
      const article = jsonLd[0];
      expect(article.url, path).toBe(`${SITE}${path}`);
      expect((article.citation as unknown[]).length, path).toBeGreaterThan(0);
      expect((jsonLd[1].itemListElement as unknown[]).length, path).toBe(3);
    }
  });
});

describe('noindex pages', () => {
  it('the 404 page is noindex and has no canonical URL', () => {
    const notFound = byPath.get('/aws-learn/404.html')!;
    expect(notFound.noindex).toBe(true);
    expect(notFound.root.querySelector('link[rel="canonical"]')).toBeNull();
  });
});

describe('sitemap', () => {
  it('lists exactly the indexable pages', () => {
    const index = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf8');
    expect(index).toContain(`<loc>${SITE}${BASE}sitemap-0.xml</loc>`);
    const locs = [...readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.sort()).toEqual(indexable.map((p) => `${SITE}${p.path}`).sort());
  });
});

describe('search index', () => {
  it('indexes exactly the journey pages (overview and steps) of every journey', () => {
    const entry = JSON.parse(readFileSync(join(DIST, 'pagefind', 'pagefind-entry.json'), 'utf8'));
    const indexed = Object.values(entry.languages as Record<string, { page_count: number }>).reduce(
      (sum, lang) => sum + lang.page_count,
      0,
    );
    // Two journeys (Config and S3), each an overview plus six steps.
    const withBody = pages.filter((p) => p.root.querySelector('[data-pagefind-body]')).length;
    expect(withBody).toBe(14);
    expect(indexed).toBe(withBody);
  });
});
