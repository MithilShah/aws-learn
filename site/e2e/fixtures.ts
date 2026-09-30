/**
 * Shared Playwright setup. Import `test` and `expect` from here, not from
 * @playwright/test, so every test:
 * - fails on any JavaScript error or console error in the page, and
 * - never calls GoatCounter (its script is replaced with an empty one, so
 *   tests work offline and never send page views).
 */
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
      });
      await page.route('https://gc.zgo.at/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
      );
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
