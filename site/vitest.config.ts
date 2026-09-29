/// <reference types="vitest/config" />
// getViteConfig loads astro.config.mjs, so Astro's env (import.meta.env.SITE)
// matches the real build. Vitest always reports import.meta.env.BASE_URL as
// '/' (it ignores Vite's `base` and Astro's define), so set it from the Astro
// config here — otherwise withBase() would return '/config/' in tests but
// '/aws/config/' in the build.
import { getViteConfig } from 'astro/config';
import astroConfig from './astro.config.mjs';

const base = (astroConfig.base ?? '/').replace(/\/?$/, '/'); // '/aws' -> '/aws/'

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: { BASE_URL: base },
  },
});
