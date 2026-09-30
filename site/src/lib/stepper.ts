/**
 * Logic behind <Stepper>: a diagram that walks through numbered stages
 * (1, 2, 3…). Pure functions, so the browser script in scripts/stepper.ts
 * stays thin and this part is unit-tested.
 *
 * Diagram parts opt in to highlighting with attributes:
 *   data-stage="2"        lit only at stage 2
 *   data-stage="2 3"      lit at stages 2 and 3
 *   data-stage-from="3"   lit from stage 3 onwards (things that build up)
 */

export interface StepperState {
  /** Current stage, 1-based. */
  current: number;
  count: number;
}

export type StepperAction = 'next' | 'prev' | 'first' | 'last';

export function clampStage(stage: number, count: number): number {
  if (count < 1) return 1;
  return Math.min(Math.max(Math.trunc(stage) || 1, 1), count);
}

export function reduceStepper(state: StepperState, action: StepperAction): StepperState {
  const target = {
    next: state.current + 1,
    prev: state.current - 1,
    first: 1,
    last: state.count,
  }[action];
  const current = clampStage(target, state.count);
  return current === state.current ? state : { ...state, current };
}

/**
 * Keys that move between stages while focus is on the stepper's controls.
 * Up/Down are left alone so the page still scrolls.
 */
export function actionForKey(key: string): StepperAction | null {
  switch (key) {
    case 'ArrowRight':
      return 'next';
    case 'ArrowLeft':
      return 'prev';
    case 'Home':
      return 'first';
    case 'End':
      return 'last';
    default:
      return null;
  }
}

/** Parse a data-stage value such as "2 3" or "2,3" into sorted stage numbers. Junk is ignored. */
export function parseStages(value: string | null | undefined): number[] {
  if (!value) return [];
  const stages = value
    .split(/[\s,]+/)
    .map((part) => Number(part))
    .filter((n) => Number.isInteger(n) && n >= 1);
  return [...new Set(stages)].sort((a, b) => a - b);
}

export interface StageSpec {
  stages?: readonly number[];
  from?: number;
}

/** Whether a diagram part is highlighted at the current stage. */
export function isLit(current: number, { stages = [], from }: StageSpec): boolean {
  return stages.includes(current) || (from !== undefined && current >= from);
}

/** What the live region announces, e.g. "Stage 2 of 4: The recorder captures the change." */
export function statusText(current: number, count: number, title: string): string {
  return `Stage ${current} of ${count}: ${title}`;
}
