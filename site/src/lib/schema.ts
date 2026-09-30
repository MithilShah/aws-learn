/**
 * Frontmatter schema for journey pages (journeys/<service>/<page>.mdx).
 * Lives outside content.config.ts so unit tests can import it without
 * Astro's virtual modules. Zod 4 comes from astro/zod (Astro's own copy).
 */
import { z } from 'astro/zod';

/** Search-result snippets get cut off beyond roughly this length. */
export const DESCRIPTION_MAX = 160;

/** Hosts allowed in `sources`: official AWS documentation only. */
export const SOURCE_HOSTS = ['docs.aws.amazon.com', 'aws.amazon.com'] as const;

const SOURCE_HOST_RE = new RegExp(`^(${SOURCE_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|')})$`);

/** An https URL on an official AWS documentation host, normalised (e.g. lowercase host). */
export const awsSourceUrl = z
  .url({
    protocol: /^https$/,
    hostname: SOURCE_HOST_RE,
    normalize: true,
    error: `Sources must be https URLs on ${SOURCE_HOSTS.join(' or ')}`,
  })
  .refine((value) => {
    // Zod still runs this after the format check fails; that failure is
    // already reported, so only inspect values that parse as URLs.
    if (!URL.canParse(value)) return true;
    const url = new URL(value);
    return url.username === '' && url.password === '';
  }, 'Source URLs must not contain credentials');

export const sourceSchema = z.strictObject({
  /** The page's own title, as shown on the AWS site. */
  title: z.string().trim().min(1),
  url: awsSourceUrl,
});

export const journeyPageSchema = z.strictObject({
  /** Page <h1> and <title> (the site name is appended automatically). */
  title: z.string().trim().min(1),
  /** Short label for navigation, breadcrumbs and prev/next links. */
  navTitle: z.string().trim().min(1),
  /** Meta description for search results and share cards. */
  description: z
    .string()
    .trim()
    .min(1)
    .max(DESCRIPTION_MAX, `description must be ${DESCRIPTION_MAX} characters or fewer`),
  /** One or two sentences shown in step lists and on the hub. */
  summary: z.string().trim().min(1),
  /**
   * Position of a step in its journey (1, 2, 3…). Required on steps and
   * ignored on the overview (index.mdx) — checked in lib/journey.ts, since
   * the schema can't tell which file it is validating.
   */
  order: z.number().int().positive().optional(),
  /** The AWS pages every fact on this page was checked against. */
  sources: z.array(sourceSchema).min(1, 'List at least one AWS documentation source'),
  /** When the content was last checked against `sources` (YYYY-MM-DD). */
  lastVerified: z.coerce.date(),
});

export type JourneyPageData = z.infer<typeof journeyPageSchema>;
export type Source = z.infer<typeof sourceSchema>;
