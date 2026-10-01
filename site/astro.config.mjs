// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// The journeys are served from https://www.studytrails.com/aws-learn/ — a real
// folder next to the WordPress site on Bluehost. `site` + `base` make Astro
// emit correct absolute URLs (canonical, OG, sitemap). Never hardcode
// '/aws-learn' in components: build URLs with the helpers in src/lib/urls.ts.
// (The folder is /aws-learn, not /aws, because WordPress already has a post
// whose slug collides with /aws.)
export default defineConfig({
  site: 'https://www.studytrails.com',
  base: '/aws-learn',
  trailingSlash: 'always',
  build: {
    // Emit /config/how-it-works/index.html so URLs are clean directories.
    format: 'directory',
  },
  // Allow the DevSpaces proxy host to reach `astro dev` / `astro preview`.
  // A leading-dot entry matches the domain and all its subdomains, so the
  // rotating proxy hostnames (…prod.proxy.devspaces.amazon.dev) all work.
  vite: {
    server: { allowedHosts: ['.devspaces.amazon.dev'] },
    preview: { allowedHosts: ['.devspaces.amazon.dev'] },
  },
  integrations: [
    mdx(),
    // The component kit (/aws-learn/kit/…) is a dev and test page, never listed.
    sitemap({ filter: (page) => !page.includes('/aws-learn/kit/') }),
  ],
});
