// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// The journeys are served from https://www.studytrails.com/aws/ — a real
// folder next to the WordPress site on Bluehost. `site` + `base` make Astro
// emit correct absolute URLs (canonical, OG, sitemap). Never hardcode '/aws'
// in components: build URLs with the helpers in src/lib/urls.ts.
export default defineConfig({
  site: 'https://www.studytrails.com',
  base: '/aws',
  trailingSlash: 'always',
  build: {
    // Emit /config/how-it-works/index.html so URLs are clean directories.
    format: 'directory',
  },
  integrations: [mdx(), sitemap()],
});
