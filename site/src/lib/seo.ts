/**
 * Structured data (JSON-LD) and share-image paths. Pure functions over
 * absolute URLs, so they're unit-tested without Astro; layouts pass in URLs
 * built with absUrl().
 */
import { AUTHOR, AUTHOR_URL, SITE_NAME } from '../data/site';
import { isoDate } from './format';

export type JsonLd = Record<string, unknown>;

const CONTEXT = 'https://schema.org';

export interface NamedUrl {
  name: string;
  /** Absolute URL. */
  url: string;
}

export function organization(siteOrigin: string): JsonLd {
  return { '@type': 'Organization', name: SITE_NAME, url: new URL('/', siteOrigin).href };
}

export const author: JsonLd = { '@type': 'Person', name: AUTHOR, url: AUTHOR_URL };

/** Breadcrumb trail, ending with the current page. */
export function breadcrumbList(crumbs: readonly NamedUrl[]): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/** The hub's list of journeys (each journey page carries its own Course markup). */
export function itemList(items: readonly NamedUrl[]): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, url: item.url })),
  };
}

export interface CourseInput {
  siteOrigin: string;
  url: string;
  name: string;
  description: string;
  image: string;
  /** The AWS service the journey teaches, e.g. 'AWS Config'. */
  about: string;
  steps: readonly NamedUrl[];
}

/** A journey overview: a free, self-paced beginner course. */
export function course(input: CourseInput): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'Course',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    inLanguage: 'en',
    educationalLevel: 'Beginner',
    isAccessibleForFree: true,
    about: { '@type': 'Thing', name: input.about },
    provider: organization(input.siteOrigin),
    author,
    hasPart: input.steps.map((step, i) => ({ '@type': 'TechArticle', position: i + 1, name: step.name, url: step.url })),
  };
}

export interface TechArticleInput {
  siteOrigin: string;
  url: string;
  headline: string;
  description: string;
  image: string;
  /** When the content was last checked against its sources. */
  dateModified: Date;
  about: string;
  course: NamedUrl;
  /** The AWS documentation pages the step is based on. */
  citations: readonly NamedUrl[];
}

/** One journey step. */
export function techArticle(input: TechArticleInput): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'TechArticle',
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    image: input.image,
    inLanguage: 'en',
    proficiencyLevel: 'Beginner',
    dateModified: isoDate(input.dateModified),
    about: { '@type': 'Thing', name: input.about },
    isPartOf: { '@type': 'Course', name: input.course.name, url: input.course.url },
    author,
    publisher: organization(input.siteOrigin),
    citation: input.citations.map((c) => ({ '@type': 'CreativeWork', name: c.name, url: c.url })),
  };
}

/** Share images are 1200×630, the size LinkedIn, X and Slack expect. */
export const SHARE_IMAGE = { width: 1200, height: 630 } as const;

/**
 * Base-relative path of a page's share image:
 *   ''                     -> 'og/hub.png'
 *   'config/'              -> 'og/config.png'
 *   'config/how-it-works/' -> 'og/config/how-it-works.png'
 */
export function shareImagePath(pagePath: string): string {
  const trimmed = pagePath.replace(/^\/+|\/+$/g, '');
  return `og/${trimmed || 'hub'}.png`;
}
