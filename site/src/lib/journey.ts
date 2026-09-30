/**
 * Journey structure: groups content entries by service, orders the steps,
 * and works out prev/next links. Pure functions over plain objects, so this
 * is unit-tested without Astro. Pages get real entries via lib/content.ts.
 *
 * Entry ids come from content.config.ts: '<service>/index' is a journey's
 * overview, '<service>/<step>' is a step.
 */
import type { Service } from '../data/services';

/** The slice of a content entry this module needs. */
export interface JourneyEntryLike {
  id: string;
  data: { navTitle: string; order?: number };
}

export interface Journey<E extends JourneyEntryLike = JourneyEntryLike> {
  service: Service;
  /** journeys/<service>/index.mdx */
  overview: E;
  /** Steps sorted by `order`. */
  steps: E[];
}

/** A link to a page in a journey. `path` is relative to the site base. */
export interface PageLink {
  path: string;
  label: string;
}

/** File name (without .mdx) of a journey's overview page. */
export const OVERVIEW_SLUG = 'index';

/** Lowercase words joined by single hyphens: safe, readable URL segments. */
const SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Split an entry id into its service and page slug, or throw if it's misplaced. */
export function parseEntryId(id: string): { service: string; slug: string } {
  const parts = id.split('/');
  if (parts.length !== 2 || !parts.every((p) => SEGMENT_RE.test(p))) {
    throw new Error(
      `"journeys/${id}.mdx" is not a valid journey page. Pages must be ` +
        'journeys/<service>/<page>.mdx, using lowercase letters, digits and hyphens.',
    );
  }
  return { service: parts[0], slug: parts[1] };
}

/** Base-relative path of a journey's overview, e.g. 'config/'. */
export function overviewPath(serviceId: string): string {
  return `${serviceId}/`;
}

/** Base-relative path of a step, e.g. 'config/how-it-works/'. */
export function stepPath(serviceId: string, slug: string): string {
  return `${serviceId}/${slug}/`;
}

/**
 * Build every journey from the collection, in registry order. Collects all
 * problems and throws them together, so one build run shows every mistake.
 */
export function buildJourneys<E extends JourneyEntryLike>(
  entries: readonly E[],
  services: readonly Service[],
): Journey<E>[] {
  const errors: string[] = [];
  const known = new Set(services.map((s) => s.id));
  const byService = new Map<string, { overview?: E; steps: E[] }>();

  for (const entry of entries) {
    let parsed: { service: string; slug: string };
    try {
      parsed = parseEntryId(entry.id);
    } catch (err) {
      errors.push((err as Error).message);
      continue;
    }
    if (!known.has(parsed.service)) {
      errors.push(
        `"journeys/${entry.id}.mdx" belongs to unknown service "${parsed.service}". ` +
          'Add it to src/data/services.ts.',
      );
      continue;
    }
    const group = byService.get(parsed.service) ?? { steps: [] };
    byService.set(parsed.service, group);
    if (parsed.slug === OVERVIEW_SLUG) {
      group.overview = entry;
    } else if (entry.data.order === undefined) {
      errors.push(`"journeys/${entry.id}.mdx" is missing "order" in its frontmatter.`);
    } else {
      group.steps.push(entry);
    }
  }

  const journeys: Journey<E>[] = [];
  for (const service of services) {
    const group = byService.get(service.id);
    if (!group?.overview) {
      errors.push(`Service "${service.id}" has no overview page: add journeys/${service.id}/index.mdx.`);
      continue;
    }
    const steps = [...group.steps].sort((a, b) => a.data.order! - b.data.order!);
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].data.order === steps[i - 1].data.order) {
        errors.push(
          `"journeys/${steps[i - 1].id}.mdx" and "journeys/${steps[i].id}.mdx" ` +
            `both have order ${steps[i].data.order}.`,
        );
      }
    }
    journeys.push({ service, overview: group.overview, steps });
  }

  if (errors.length > 0) {
    throw new Error(`Journey content has ${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  }
  return journeys;
}

/** Slug of a step entry, e.g. 'how-it-works'. */
export function stepSlug(entry: JourneyEntryLike): string {
  return parseEntryId(entry.id).slug;
}

/** 1-based position of a step in its journey. Throws for an unknown slug. */
export function stepNumber(journey: Journey, slug: string): number {
  const index = journey.steps.findIndex((s) => stepSlug(s) === slug);
  if (index === -1) {
    throw new Error(`Journey "${journey.service.id}" has no step "${slug}".`);
  }
  return index + 1;
}

/**
 * Previous and next pages around a page. The overview comes first, so the
 * overview's `next` is step 1 and step 1's `prev` is the overview.
 * Pass `null` for the overview itself.
 */
export function neighbors(journey: Journey, slug: string | null): { prev?: PageLink; next?: PageLink } {
  const serviceId = journey.service.id;
  const sequence: PageLink[] = [
    { path: overviewPath(serviceId), label: journey.overview.data.navTitle },
    ...journey.steps.map((s) => ({ path: stepPath(serviceId, stepSlug(s)), label: s.data.navTitle })),
  ];
  const index = slug === null ? 0 : stepNumber(journey, slug);
  return { prev: sequence[index - 1], next: sequence[index + 1] };
}
