// Share images: one 1200×630 PNG per page, rendered at build time.
//   /aws/og/hub.png                  hub
//   /aws/og/config.png               journey overview
//   /aws/og/config/how-it-works.png  a step
// Paths come from shareImagePath(), the same helper the pages use for
// og:image, so the two can't drift apart.
import type { APIRoute, GetStaticPaths } from 'astro';
import { HUB_DESCRIPTION, HUB_TITLE, SECTION_NAME } from '../../data/site';
import { getJourneys } from '../../lib/content';
import { overviewPath, stepPath, stepSlug } from '../../lib/journey';
import { renderCard, type CardInput } from '../../lib/og-card';
import { shareImagePath } from '../../lib/seo';

/** 'og/config/how-it-works.png' -> 'config/how-it-works' */
const param = (pagePath: string) => shareImagePath(pagePath).replace(/^og\//, '').replace(/\.png$/, '');

export const getStaticPaths = (async () => {
  const paths: { params: { path: string }; props: CardInput }[] = [
    { params: { path: param('') }, props: { eyebrow: SECTION_NAME, title: HUB_TITLE, summary: HUB_DESCRIPTION } },
  ];
  for (const { service, overview, steps } of await getJourneys()) {
    paths.push({
      params: { path: param(overviewPath(service.id)) },
      props: {
        eyebrow: `${service.name} · Beginner journey`,
        title: overview.data.title,
        summary: overview.data.summary,
        steps: { total: steps.length },
      },
    });
    steps.forEach((step, i) => {
      paths.push({
        params: { path: param(stepPath(service.id, stepSlug(step))) },
        props: {
          eyebrow: `${service.name} · Step ${i + 1} of ${steps.length}`,
          title: step.data.title,
          summary: step.data.summary,
          steps: { total: steps.length, current: i + 1 },
        },
      });
    });
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard(props as CardInput);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
