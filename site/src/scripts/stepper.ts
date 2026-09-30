/**
 * Makes <Stepper> interactive: Back/Next (and Left/Right/Home/End while the
 * controls have focus) move between stages, the matching diagram parts are
 * highlighted, and each change is announced in a polite live region. There
 * is no autoplay; motion is a CSS fade that respects reduced-motion.
 * Logic lives in lib/stepper.ts.
 */
import {
  actionForKey,
  isLit,
  parseStages,
  reduceStepper,
  statusText,
  type StepperAction,
  type StepperState,
} from '../lib/stepper';

function enhance(root: HTMLElement): void {
  const stages = Array.from(root.querySelectorAll<HTMLElement>('[data-stage-index]'));
  const controls = root.querySelector<HTMLElement>('[data-stepper-controls]');
  const prev = root.querySelector<HTMLButtonElement>('[data-stepper-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-stepper-next]');
  const count = root.querySelector<HTMLElement>('[data-stepper-count]');
  const live = root.querySelector<HTMLElement>('[data-stepper-live]');
  if (stages.length === 0 || !controls || !prev || !next || !count || !live) return;

  const parts = Array.from(
    root.querySelectorAll<Element>('[data-stepper-visual] [data-stage], [data-stepper-visual] [data-stage-from]'),
  ).map((el) => {
    const from = el.getAttribute('data-stage-from');
    return { el, spec: { stages: parseStages(el.getAttribute('data-stage')), from: from ? Number(from) : undefined } };
  });

  let state: StepperState = { current: 1, count: stages.length };

  const render = (announce: boolean) => {
    const { current } = state;
    stages.forEach((stage, i) => {
      stage.hidden = i + 1 !== current;
    });
    for (const { el, spec } of parts) el.classList.toggle('is-lit', isLit(current, spec));
    // aria-disabled (not disabled) keeps focus on the button at either end.
    prev.setAttribute('aria-disabled', String(current === 1));
    next.setAttribute('aria-disabled', String(current === state.count));
    count.textContent = `Stage ${current} of ${state.count}`;
    root.dataset.currentStage = String(current);
    if (announce) {
      const stage = stages[current - 1];
      const title = stage.querySelector('.stepper-stage-title')?.textContent ?? '';
      const text = stage.querySelector('.stepper-stage-text')?.textContent ?? '';
      live.textContent = `${statusText(current, state.count, title)}. ${text}`;
    }
  };

  const dispatch = (action: StepperAction) => {
    const nextState = reduceStepper(state, action);
    if (nextState === state) return;
    state = nextState;
    render(true);
  };

  prev.addEventListener('click', () => dispatch('prev'));
  next.addEventListener('click', () => dispatch('next'));
  controls.addEventListener('keydown', (event) => {
    const action = actionForKey(event.key);
    if (!action) return;
    event.preventDefault();
    dispatch(action);
  });

  controls.hidden = false;
  root.classList.add('is-enhanced');
  render(false);
}

document.querySelectorAll<HTMLElement>('[data-stepper]:not(.is-enhanced)').forEach(enhance);
