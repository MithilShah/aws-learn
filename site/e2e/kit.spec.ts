// The visual kit, exercised on the component gallery (/aws/kit/components/,
// built because test:e2e sets BUILD_KIT=1) and the journey map on the overview.
import { expect, test } from './fixtures';

const KIT = '/aws/kit/components/';
const OVERVIEW = '/aws/config/';

test.describe('tabs', () => {
  test('work with the mouse and the keyboard (WAI-ARIA tabs)', async ({ page }) => {
    await page.goto(KIT);
    const tablist = page.getByRole('tablist', { name: 'Example tabs' });
    const tabs = tablist.getByRole('tab');
    await expect(tabs).toHaveText(['First panel', 'Second panel', 'Third panel']);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toContainText('The first panel');

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('The second panel');

    // Keyboard: arrows move focus and selection, wrapping; Home/End jump.
    await tabs.nth(1).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(2)).toBeFocused();
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(0)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(tabs.nth(2)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('The third panel');

    // Only the selected tab is in the Tab order; Tab moves into the panel.
    await expect(tabs.nth(0)).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tabpanel')).toBeFocused();
  });
});

test.describe('stepper', () => {
  test('steps through stages with buttons and keys, highlighting and announcing each', async ({ page }) => {
    await page.goto(KIT);
    const stepper = page.getByRole('group', { name: 'Example walkthrough' });
    const back = stepper.getByRole('button', { name: 'Back' });
    const next = stepper.getByRole('button', { name: 'Next' });
    const caption = stepper.locator('.stepper-stage:visible');
    const live = stepper.locator('[data-stepper-live]');
    const lit = (selector: string) => stepper.locator(selector);

    await expect(stepper.locator('[data-stepper-count]')).toHaveText('Stage 1 of 3');
    await expect(caption).toHaveCount(1);
    await expect(caption).toContainText('A resource changes.');
    await expect(back).toHaveAttribute('aria-disabled', 'true');
    await expect(lit('[data-stage="1"]')).toHaveClass(/is-lit/);
    await expect(lit('[data-stage="2"]').first()).not.toHaveClass(/is-lit/);
    // Nothing is announced until the reader acts.
    await expect(live).toHaveText('');

    await next.click();
    await expect(stepper.locator('[data-stepper-count]')).toHaveText('Stage 2 of 3');
    await expect(caption).toContainText('AWS Config records it.');
    await expect(live).toHaveText('Stage 2 of 3: AWS Config records it.. The recorder captures the new configuration.');
    await expect(lit('[data-stage="2"]').first()).toHaveClass(/is-lit/);
    await expect(lit('[data-stage="1"]')).not.toHaveClass(/is-lit/);

    // Keyboard on the controls.
    await next.focus();
    await page.keyboard.press('ArrowRight');
    await expect(stepper.locator('[data-stepper-count]')).toHaveText('Stage 3 of 3');
    await expect(lit('[data-stage-from="3"]').first()).toHaveClass(/is-lit/);
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    // At the end, Next stays focusable and pressing it does nothing.
    // (Playwright won't click an aria-disabled button, so use the keyboard.)
    await page.keyboard.press('Enter');
    await expect(next).toBeFocused();
    await expect(stepper.locator('[data-stepper-count]')).toHaveText('Stage 3 of 3');

    await page.keyboard.press('Home');
    await expect(stepper.locator('[data-stepper-count]')).toHaveText('Stage 1 of 3');
    await page.keyboard.press('End');
    await expect(stepper.locator('[data-stepper-count]')).toHaveText('Stage 3 of 3');
    await page.keyboard.press('ArrowLeft');
    await expect(stepper.locator('[data-stepper-count]')).toHaveText('Stage 2 of 3');
  });

  test('fades between stages only when the reader allows motion', async ({ browser }) => {
    for (const [reducedMotion, expected] of [
      ['no-preference', '0.35s'],
      ['reduce', '0s'],
    ] as const) {
      const page = await browser.newPage({ reducedMotion });
      await page.route('https://gc.zgo.at/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
      await page.goto(KIT);
      const duration = await page
        .locator('[data-stepper] [data-stage="1"]')
        .evaluate((el) => getComputedStyle(el).transitionDuration);
      expect(duration, reducedMotion).toBe(expected);
      await page.close();
    }
  });
});

test.describe('figure and key terms', () => {
  test('a figure has a caption and an expandable text description linked to it', async ({ page }) => {
    await page.goto(KIT);
    const figure = page.locator('figure.figure');
    await expect(figure.locator('figcaption')).toHaveText('Example walkthrough: a change moves through three services');
    const describedBy = await figure.getAttribute('aria-describedby');
    const description = page.locator(`[id="${describedBy}"]`);
    await expect(description).toContainText('Three boxes in a row');
    await expect(description).toBeHidden();
    await figure.getByText('Text description').click();
    await expect(description).toBeVisible();
  });

  test('key terms are a definition list with linkable terms', async ({ page }) => {
    await page.goto(KIT);
    await expect(page.locator('dl.key-terms dt')).toHaveText(['Configuration item', 'Configuration recorder']);
    await expect(page.locator('#term-configuration-item')).toHaveText('Configuration item');
  });
});

test.describe('diagrams', () => {
  /** Rendered size of the diagram's 15px node labels, in CSS pixels. */
  const labelSize = (page: import('@playwright/test').Page) =>
    page.locator('svg.diagram').evaluate((svg) => {
      const viewBoxWidth = (svg as SVGSVGElement).viewBox.baseVal.width;
      return (15 * svg.getBoundingClientRect().width) / viewBoxWidth;
    });

  test('on a wide screen: full size, no scrolling, no extra tab stop', async ({ page }) => {
    await page.goto(KIT);
    const frame = page.locator('[data-diagram-frame]');
    await expect(frame).not.toHaveAttribute('data-scrolls');
    await expect(frame).not.toHaveAttribute('tabindex');
    expect(await labelSize(page)).toBeCloseTo(15, 0);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('labels stay readable and the frame scrolls, reachable by keyboard', async ({ page }) => {
      await page.goto(KIT);
      expect(await labelSize(page)).toBeGreaterThanOrEqual(10.5);
      const frame = page.getByRole('region', { name: /Example walkthrough|A resource, then AWS Config/ });
      await expect(frame).toHaveAttribute('data-scrolls', '');
      await expect(frame).toHaveAttribute('tabindex', '0');
      await frame.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => frame.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    });
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('tabs show every panel under its heading, and the stepper lists every stage', async ({ page }) => {
    await page.goto(KIT);
    await expect(page.getByRole('tablist')).toHaveCount(0);
    for (const label of ['First panel', 'Second panel', 'Third panel']) {
      await expect(page.getByRole('heading', { name: label })).toBeVisible();
    }
    const stepper = page.locator('[data-stepper]');
    await expect(stepper.locator('.stepper-stage')).toHaveCount(3);
    for (const stage of await stepper.locator('.stepper-stage').all()) await expect(stage).toBeVisible();
    await expect(stepper.locator('[data-stepper-controls]')).toBeHidden();
    // The whole diagram is shown at full strength.
    await expect(stepper.locator('[data-stage="2"]').first()).toHaveCSS('opacity', '1');
  });
});

test.describe('rule simulator', () => {
  test('picks a rule and resource and shows the matching evaluation result', async ({ page }) => {
    await page.goto(KIT);
    const sim = page.locator('[data-rule-sim]');
    // With JS the interactive picker replaces the static table.
    await expect(sim.locator('[data-rule-sim-ui]')).toBeVisible();
    await expect(sim.locator('[data-rule-sim-table]')).toBeHidden();

    const pill = sim.locator('[data-sim-pill] .pill, [data-sim-pill]').first();
    // encrypted-volumes defaults to the first resource (encrypted volume) -> COMPLIANT.
    await expect(sim.locator('[data-sim-pill]')).toContainText('COMPLIANT');

    // Point it at the unencrypted volume -> NON_COMPLIANT.
    await sim.locator('[data-sim-resource]').selectOption({ label: 'Unencrypted EBS volume' });
    await expect(sim.locator('[data-sim-pill]')).toContainText('NON_COMPLIANT');

    // Point it at an S3 bucket -> NOT_APPLICABLE (out of scope).
    await sim.locator('[data-sim-resource]').selectOption({ label: 'S3 bucket with versioning on' });
    await expect(sim.locator('[data-sim-pill]')).toContainText('NOT_APPLICABLE');

    // required-tags needs a parameter: ERROR until tagKey is given.
    await sim.locator('[data-sim-rule]').selectOption({ label: 'required-tags' });
    await expect(sim.locator('[data-sim-param-field]')).toBeVisible();
    await expect(sim.locator('[data-sim-pill]')).toContainText('ERROR');
    await sim.locator('[data-sim-param]').fill('team');
    await expect(sim.locator('[data-sim-pill]')).toContainText('COMPLIANT');
    expect(pill).toBeTruthy();
  });

  test('without JavaScript, shows the full results table', async ({ browser }) => {
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.route('https://gc.zgo.at/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.goto(KIT);
    const table = page.locator('[data-rule-sim-table]');
    await expect(table).toBeVisible();
    // 3 rules x 4 resources = 12 result pills.
    await expect(table.locator('tbody .pill')).toHaveCount(12);
    await page.close();
  });
});

test.describe('service sorter', () => {
  test('scores assignments and reveals the explanation for each', async ({ page }) => {
    await page.goto(KIT);
    const sorter = page.locator('[data-svc-sorter]');
    await expect(sorter).toHaveClass(/is-enhanced/);
    const first = sorter.locator('[data-sorter-q]').first();
    // Choice buttons are revealed; the answer stays hidden until a choice is made.
    await expect(first.locator('[data-sorter-choices]')).toBeVisible();
    await expect(first.locator('[data-sorter-answer]')).toBeHidden();

    // The first question ("…look like last Tuesday?") is answered by AWS Config.
    await first.getByRole('button', { name: 'AWS CloudTrail' }).click();
    await expect(first).toHaveClass(/is-wrong/);
    await expect(first.locator('[data-sorter-answer]')).toBeVisible();
    await expect(sorter.locator('[data-sorter-score]')).toContainText('0 of 6 correct');

    await first.getByRole('button', { name: 'AWS Config' }).click();
    await expect(first).toHaveClass(/is-correct/);
    await expect(sorter.locator('[data-sorter-score]')).toContainText('1 of 6 correct');
  });

  test('without JavaScript, shows the full answer key', async ({ browser }) => {
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.route('https://gc.zgo.at/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.goto(KIT);
    const sorter = page.locator('[data-svc-sorter]');
    await expect(sorter).not.toHaveClass(/is-enhanced/);
    // Every question shows its answer; choice buttons stay hidden.
    await expect(sorter.locator('[data-sorter-q]')).toHaveCount(6);
    await expect(sorter.locator('[data-sorter-answer]').first()).toBeVisible();
    await expect(sorter.locator('[data-sorter-choices]').first()).toBeHidden();
    await page.close();
  });
});

test.describe('journey map', () => {
  const setProgress = async (page: import('@playwright/test').Page, done: string[]) => {
    await page.evaluate((d) => localStorage.setItem('st-aws:config', JSON.stringify({ v: 1, done: d })), done);
    await page.reload();
  };
  const map = (page: import('@playwright/test').Page) => page.locator('.journey-map');

  test('invites a new reader to start at step 1', async ({ page }) => {
    await page.goto(OVERVIEW);
    const cta = map(page).locator('[data-progress-continue]');
    await expect(cta).toContainText('Start here');
    await expect(cta).toContainText('Step 1: What is AWS Config?');
    await expect(cta).toHaveAttribute('href', '/aws/config/what-is-aws-config/');
    await expect(map(page).locator('.is-next')).toHaveCount(0);
    await expect(map(page).locator('.trail-stop')).toHaveCount(6);
  });

  test('marks finished steps and points at the next unfinished one', async ({ page }) => {
    await page.goto(OVERVIEW);
    await setProgress(page, ['what-is-aws-config', 'config-rules']);
    await expect(map(page).locator('[data-progress-text]')).toHaveText('2 of 6 steps done');
    await expect(map(page).locator('.trail-stop.is-done')).toHaveCount(2);
    // Next is the first unfinished step in journey order, not after the latest one.
    const upNext = map(page).locator('.trail-stop.is-next');
    await expect(upNext).toHaveAttribute('data-step', 'how-it-works');
    await expect(upNext.locator('.trail-next')).toBeVisible();
    await expect(upNext.locator('[data-done-label]')).toHaveText('(up next)');
    const cta = map(page).locator('[data-progress-continue]');
    await expect(cta).toContainText('Continue where you left off');
    await expect(cta).toHaveAttribute('href', '/aws/config/how-it-works/');
  });

  test('congratulates a reader who finished every step', async ({ page }) => {
    await page.goto(OVERVIEW);
    await setProgress(page, [
      'what-is-aws-config',
      'how-it-works',
      'config-rules',
      'remediation',
      'conformance-packs-and-aggregators',
      'config-vs-cloudtrail-vs-cloudwatch',
    ]);
    await expect(map(page).locator('.trail-stop.is-done')).toHaveCount(6);
    await expect(map(page).locator('[data-progress-continue]')).toContainText("You've finished the journey");
  });
});
