/**
 * Journey progress in the browser: marks a step done when the reader
 * reaches the end of its content, and shows progress wherever the page has
 * a [data-progress-journey="<service>"] list (sidebar, overview) with
 * [data-step="<slug>"] items. Storage logic lives in lib/progress.ts.
 */
import { countDone, isDone, nextStep, readProgress, saveStep, STORAGE_PREFIX, type Progress } from '../lib/progress';

function getStorage(): Storage | null {
  try {
    return window.localStorage; // Throws in some browsers when storage is blocked.
  } catch {
    return null;
  }
}

const storage = getStorage();

function render(serviceId: string, progress: Progress): void {
  const roots = document.querySelectorAll<HTMLElement>(`[data-progress-journey="${CSS.escape(serviceId)}"]`);
  for (const root of roots) {
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
    const slugs = items.map((item) => item.dataset.step!);
    // Only the overview's journey map (data-progress-next) marks "up next".
    const upNext = root.hasAttribute('data-progress-next') ? nextStep(progress, slugs) : null;
    for (const item of items) {
      const done = isDone(progress, item.dataset.step!);
      const next = item.dataset.step === upNext && countDone(progress, slugs) > 0;
      item.classList.toggle('is-done', done);
      item.classList.toggle('is-next', next);
      const label = item.querySelector('[data-done-label]');
      if (label) label.textContent = done ? ' (done)' : next ? ' (up next)' : '';
    }
    const count = countDone(progress, slugs);
    const text = root.querySelector('[data-progress-text]');
    if (text) text.textContent = `${count} of ${items.length} ${items.length === 1 ? 'step' : 'steps'} done`;
    const bar = root.querySelector('progress');
    if (bar) bar.value = count;
    renderContinue(root, items, count, upNext);
  }
}

/** Point the journey map's button at the next unfinished step. */
function renderContinue(root: HTMLElement, items: HTMLElement[], count: number, upNext: string | null): void {
  const link = root.querySelector<HTMLAnchorElement>('[data-progress-continue]');
  const kicker = link?.querySelector('[data-continue-kicker]');
  const label = link?.querySelector('[data-continue-label]');
  if (!link || !kicker || !label || items.length === 0) return;
  const target = items.find((item) => item.dataset.step === upNext) ?? items[0];
  const { stepNumber, stepTitle, stepHref } = target.dataset;
  link.href = stepHref ?? link.href;
  if (count === 0) {
    kicker.textContent = 'Start here';
    label.textContent = `Step ${stepNumber}: ${stepTitle}`;
  } else if (upNext) {
    kicker.textContent = 'Continue where you left off';
    label.textContent = `Step ${stepNumber}: ${stepTitle}`;
  } else {
    kicker.textContent = "You've finished the journey";
    label.textContent = `Review step ${stepNumber}: ${stepTitle}`;
  }
}

/** Every service with progress UI or a step on this page. */
function servicesOnPage(): Set<string> {
  const ids = new Set<string>();
  document.querySelectorAll<HTMLElement>('[data-progress-journey]').forEach((el) => ids.add(el.dataset.progressJourney!));
  document.querySelectorAll<HTMLElement>('[data-read-sentinel]').forEach((el) => ids.add(el.dataset.service!));
  return ids;
}

function renderAll(): void {
  for (const id of servicesOnPage()) render(id, readProgress(storage, id));
}

renderAll();

// Reaching the end of a step's content marks it done.
const sentinel = document.querySelector<HTMLElement>('[data-read-sentinel]');
if (sentinel && 'IntersectionObserver' in window) {
  const { service, step } = sentinel.dataset;
  if (service && step) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      render(service, saveStep(storage, service, step));
    });
    observer.observe(sentinel);
  }
}

// Another tab finished a step.
window.addEventListener('storage', (event) => {
  if (event.key === null || event.key.startsWith(STORAGE_PREFIX)) renderAll();
});

// Back/forward cache restores the old DOM; refresh it.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) renderAll();
});
