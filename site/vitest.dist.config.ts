// Checks over the built site (dist/). Plain Vitest: nothing here needs Astro.
// Run with `npm run test:dist` after `npm run build`.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests-dist/**/*.test.ts'],
  },
});
