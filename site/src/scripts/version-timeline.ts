/**
 * Makes <VersionTimeline> interactive: Back/Next (and Left/Right/Home/End
 * while the controls have focus) reveal one step at a time, showing the
 * version stack that step produces and announcing it to screen readers.
 * Without this script every step is shown in full. There is no autoplay.
 *
 * The steps and their stacks are rendered on the server from
 * lib/version-timeline, so this file only governs which step is visible.
 */
function enhance(root: HTMLElement): void {
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-vtl-step]'));
  const controls = root.querySelector<HTMLElement>('[data-vtl-controls]');
  const prev = root.querySelector<HTMLButtonElement>('[data-vtl-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-vtl-next]');
  const count = root.querySelector<HTMLElement>('[data-vtl-count]');
  const live = root.querySelector<HTMLElement>('[data-vtl-live]');
  if (steps.length === 0 || !controls || !prev || !next || !count || !live) return;

  const total = steps.length;
  let current = 1;

  const render = (announce: boolean) => {
    steps.forEach((step, i) => {
      step.hidden = i + 1 !== current;
    });
    prev.setAttribute('aria-disabled', String(current === 1));
    next.setAttribute('aria-disabled', String(current === total));
    count.textContent = `Step ${current} of ${total}`;
    if (announce) {
      const step = steps[current - 1];
      const title = step.querySelector('.vtl-step-title')?.textContent?.trim() ?? '';
      const text = step.querySelector('.vtl-step-text')?.textContent?.trim() ?? '';
      live.textContent = `${title} ${text}`;
    }
  };

  const go = (to: number) => {
    const clamped = Math.min(Math.max(to, 1), total);
    if (clamped === current) return;
    current = clamped;
    render(true);
  };

  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  controls.addEventListener('keydown', (event) => {
    const map: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 1,
      End: total,
    };
    const to = map[event.key];
    if (to === undefined) return;
    event.preventDefault();
    go(to);
  });

  controls.hidden = false;
  root.classList.add('is-enhanced');
  render(false);
}

document.querySelectorAll<HTMLElement>('[data-vtl]:not(.is-enhanced)').forEach(enhance);

// This file has no imports; mark it a module so its top-level names stay local.
export {};
