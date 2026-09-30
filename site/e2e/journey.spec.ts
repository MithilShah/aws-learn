import { expect, test, type Page } from '@playwright/test';

const OVERVIEW = '/aws/config/';
const STEPS = [
  'what-is-aws-config',
  'how-it-works',
  'config-rules',
  'remediation',
  'conformance-packs-and-aggregators',
  'config-vs-cloudtrail-vs-cloudwatch',
];
const stepUrl = (slug: string) => `/aws/config/${slug}/`;
/** Matches a page URL, ignoring any #section the scroll-spy adds. */
const at = (path: string) => new RegExp(`^http://localhost:\\d+${path.replace(/[/.]/g, '\\$&')}(#.*)?$`);

const sidebar = (page: Page) => page.locator('aside.sidebar');
const progressText = (page: Page) => sidebar(page).locator('[data-progress-text]');
const sidebarStep = (page: Page, slug: string) => sidebar(page).locator(`[data-step="${slug}"]`);

// Every test fails on a JavaScript error or console error in the page.
let errors: string[];
test.beforeEach(({ page }) => {
  errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
});
test.afterEach(() => {
  expect(errors).toEqual([]);
});

test.describe('navigation', () => {
  test('hub → overview → every step with Next, then back with Previous', async ({ page }) => {
    await page.goto('/aws/');
    await page.getByRole('main').getByRole('link', { name: 'AWS Config' }).click();
    await expect(page).toHaveURL(at(OVERVIEW));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('AWS Config Tutorial for Beginners');

    await page.locator('a[rel="next"]').click(); // "Start the journey"
    for (const [i, slug] of STEPS.entries()) {
      await expect(page).toHaveURL(at(stepUrl(slug)));
      await expect(page.locator('.eyebrow')).toHaveText(`AWS Config · Step ${i + 1} of 6`);
      await expect(sidebarStep(page, slug).locator('> a')).toHaveAttribute('aria-current', 'page');
      if (i < STEPS.length - 1) await page.locator('a[rel="next"]').click();
    }
    await expect(page.locator('a[rel="next"]')).toHaveCount(0);

    for (const slug of [...STEPS].reverse().slice(1)) {
      await page.locator('a[rel="prev"]').click();
      await expect(page).toHaveURL(at(stepUrl(slug)));
    }
    await page.locator('a[rel="prev"]').click();
    await expect(page).toHaveURL(at(OVERVIEW));
    await expect(page.locator('a[rel="prev"]')).toHaveCount(0);
  });

  test('breadcrumbs lead back to the overview and the hub', async ({ page }) => {
    await page.goto(stepUrl('remediation'));
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Remediation');
    await crumbs.getByRole('link', { name: 'AWS Config' }).click();
    await expect(page).toHaveURL(at(OVERVIEW));
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'AWS Learning Journeys' }).click();
    await expect(page).toHaveURL(at('/aws/'));
  });

  test('the sidebar lists every step and outlines the current one', async ({ page }) => {
    await page.goto(stepUrl('how-it-works'));
    await expect(sidebar(page).locator('.nav-steps > li')).toHaveCount(STEPS.length);
    const outline = sidebarStep(page, 'how-it-works').locator('.nav-sections a');
    await expect(outline).toHaveText(['What this step covers']);
    // Only the current step is expanded.
    await expect(sidebar(page).locator('.nav-sections')).toHaveCount(1);
  });
});

test.describe('progress', () => {
  test('a step is marked done only once its end is reached, and survives a reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto(stepUrl('how-it-works'));

    // Precondition: the end of the content starts below the fold.
    const sentinel = page.locator('[data-read-sentinel]');
    expect((await sentinel.boundingBox())!.y).toBeGreaterThan(400);
    await expect(progressText(page)).toHaveText('0 of 6 steps done');
    await expect(sidebarStep(page, 'how-it-works')).not.toHaveClass(/is-done/);

    await sentinel.scrollIntoViewIfNeeded();
    await expect(progressText(page)).toHaveText('1 of 6 steps done');
    await expect(sidebarStep(page, 'how-it-works')).toHaveClass(/is-done/);
    // The current step's number is hidden behind the tick once it's done.
    await expect(sidebarStep(page, 'how-it-works').locator('.nav-step-marker')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
    await expect(sidebarStep(page, 'how-it-works').locator('[data-done-label]')).toHaveText('(done)');
    await expect(sidebar(page).locator('progress')).toHaveJSProperty('value', 1);

    await page.reload();
    await expect(progressText(page)).toHaveText('1 of 6 steps done');
    await expect(sidebarStep(page, 'how-it-works')).toHaveClass(/is-done/);

    const stored = await page.evaluate(() => localStorage.getItem('st-aws:config'));
    expect(JSON.parse(stored!)).toEqual({ v: 1, done: ['how-it-works'] });
  });

  test('progress adds up across steps, shows on the overview, and ignores the overview itself', async ({ page }) => {
    // At full height these stub pages fit on screen, so visiting completes them.
    await page.goto(stepUrl('what-is-aws-config'));
    await expect(progressText(page)).toHaveText('1 of 6 steps done');
    await page.goto(stepUrl('config-rules'));
    await expect(progressText(page)).toHaveText('2 of 6 steps done');

    await page.goto(OVERVIEW);
    await expect(progressText(page)).toHaveText('2 of 6 steps done');
    const list = page.locator('.step-list');
    await expect(list.locator('[data-step="what-is-aws-config"]')).toHaveClass(/is-done/);
    await expect(list.locator('[data-step="config-rules"]')).toHaveClass(/is-done/);
    await expect(list.locator('[data-step="how-it-works"]')).not.toHaveClass(/is-done/);
  });

  test('ignores corrupt saved progress', async ({ page }) => {
    await page.goto(OVERVIEW);
    await page.evaluate(() => localStorage.setItem('st-aws:config', '{broken'));
    await page.goto(stepUrl('remediation'));
    await expect(progressText(page)).toHaveText('1 of 6 steps done');
  });
});

test.describe('search', () => {
  test('finds a step by its content and links under /aws/', async ({ page }) => {
    await page.goto(stepUrl('remediation'));
    await page.getByPlaceholder('Search the journeys').fill('configuration item');

    const results = page.locator('.pagefind-ui__result-link');
    await expect(results.first()).toBeVisible();
    // With a single journey the filter panel is hidden (see Search.astro).
    await expect(page.locator('.pagefind-ui__filter-panel')).toBeHidden();
    const hrefs = await results.evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
    expect(hrefs.some((href) => href.startsWith('/aws/config/how-it-works/'))).toBe(true);
    for (const href of hrefs) expect(href).toMatch(/^\/aws\/config\//);

    await page.locator('.pagefind-ui__result-title .pagefind-ui__result-link[href="/aws/config/how-it-works/"]').click();
    await expect(page).toHaveURL(at(stepUrl('how-it-works')));
  });
});

test.describe('scroll-spy', () => {
  test('highlights the section being read and mirrors it in the URL', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto(stepUrl('how-it-works'));
    const link = sidebar(page).locator('[data-nav-anchor="what-this-step-covers"]');
    // First section is highlighted by default, but the URL stays clean.
    await expect(link).toHaveAttribute('aria-current', 'true');
    await expect(page).toHaveURL(/how-it-works\/$/);

    await page.locator('#what-this-step-covers').evaluate((el) => el.scrollIntoView());
    await expect(page).toHaveURL(/how-it-works\/#what-this-step-covers$/);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveURL(/how-it-works\/$/);
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the sidebar collapses behind a Menu button', async ({ page }) => {
    await page.goto(stepUrl('how-it-works'));
    const toggle = page.getByRole('button', { name: 'Menu' });
    const panel = page.locator('#sidebar-panel');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.getByRole('link', { name: 'Config rules' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();

    // Choosing a section on this page closes the menu.
    await toggle.click();
    await panel.getByRole('link', { name: 'What this step covers' }).click();
    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test('navigation stays usable: menu open, no Menu button, no progress UI', async ({ page }) => {
    await page.goto(stepUrl('how-it-works'));
    await expect(page.locator('html')).toHaveClass('no-js');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
    await expect(page.locator('#sidebar-panel').getByRole('link', { name: 'Config rules' })).toBeVisible();
    await expect(sidebar(page).locator('.journey-progress')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('How AWS Config Works');
  });
});
