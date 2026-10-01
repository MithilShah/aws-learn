// Automated accessibility checks (axe-core, WCAG 2.2 A/AA rules). These
// catch a useful share of problems, such as contrast, names, roles and ARIA
// misuse, but not all: full WCAG conformance still needs manual testing with
// assistive technology.
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join('\n  ')}`,
  );
}

const PAGES = [
  ['hub', '/aws-learn/'],
  ['overview', '/aws-learn/config/'],
  ['step', '/aws-learn/config/how-it-works/'],
  ['component kit', '/aws-learn/kit/components/'],
] as const;

for (const [name, url] of PAGES) {
  test(`${name} page has no detectable accessibility violations`, async ({ page }) => {
    await page.goto(url);
    expect(await violations(page)).toEqual([]);
  });
}

test.describe('404', () => {
  // The browser logs the page's own 404 status as a console error.
  test.use({ expectedConsoleErrors: [/status of 404/] });

  test('404 page has no detectable accessibility violations', async ({ page }) => {
    const response = await page.goto('/aws-learn/no-such-page/');
    expect(response?.status()).toBe(404);
    expect(await violations(page)).toEqual([]);
  });
});

test('overview with progress (journey map states) has no violations', async ({ page }) => {
  await page.goto('/aws-learn/config/');
  await page.evaluate(() =>
    localStorage.setItem('st-aws:config', JSON.stringify({ v: 1, done: ['what-is-aws-config', 'how-it-works'] })),
  );
  await page.reload();
  await expect(page.locator('.trail-stop.is-next')).toHaveCount(1);
  expect(await violations(page)).toEqual([]);
});

test('kit with a tab and a stepper stage changed has no violations', async ({ page }) => {
  await page.goto('/aws-learn/kit/components/');
  await page.getByRole('tab', { name: 'Second panel' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  expect(await violations(page)).toEqual([]);
});

test('search results have no violations', async ({ page }) => {
  await page.goto('/aws-learn/config/remediation/');
  await page.getByPlaceholder('Search the journeys').fill('configuration item');
  await expect(page.locator('.pagefind-ui__result-link').first()).toBeVisible();
  expect(await violations(page)).toEqual([]);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('step page with the menu open has no violations', async ({ page }) => {
    await page.goto('/aws-learn/config/how-it-works/');
    await page.getByRole('button', { name: 'Menu' }).click();
    expect(await violations(page)).toEqual([]);
  });

  test('component kit (scrolling diagram) has no violations', async ({ page }) => {
    await page.goto('/aws-learn/kit/components/');
    await expect(page.locator('[data-diagram-frame][data-scrolls]')).toHaveCount(1);
    expect(await violations(page)).toEqual([]);
  });
});
