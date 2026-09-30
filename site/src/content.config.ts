import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { journeyPageSchema } from './lib/schema';

// Journey content lives outside the Astro project, in <repo>/journeys/, so
// writing a page never means touching site code. Layout:
//   journeys/<service>/index.mdx   -> /aws/<service>/         (overview)
//   journeys/<service>/<step>.mdx  -> /aws/<service>/<step>/  (a step)
// Structure, ordering and prev/next are validated in src/lib/journey.ts.
const journeys = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: '../journeys',
    // Keep the raw path ('config/index', 'config/how-it-works'). The default
    // id drops '/index', which would make an overview indistinguishable from
    // a stray file at the journeys/ root.
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: journeyPageSchema,
});

export const collections = { journeys };
