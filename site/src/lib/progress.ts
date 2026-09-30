/**
 * Journey progress, saved in the reader's browser (localStorage) under
 * `st-aws:<service>` as {"v":1,"done":["what-is-aws-config", ...]}.
 * Nothing leaves the browser.
 *
 * The pure functions are unit-tested; readProgress/saveStep wrap storage
 * access, which can throw (storage disabled, private mode, quota).
 */

export const STORAGE_PREFIX = 'st-aws:';
const VERSION = 1;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface Progress {
  /** Slugs of completed steps, in the order they were completed. */
  done: string[];
}

/** The subset of the Storage API we use, so tests can pass a fake. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const EMPTY: Progress = Object.freeze({ done: [] }) as Progress;

export function storageKey(serviceId: string): string {
  return `${STORAGE_PREFIX}${serviceId}`;
}

/** Parse stored progress. Anything unexpected (junk, old format, bad slugs) is dropped, never thrown. */
export function parseProgress(raw: string | null | undefined): Progress {
  if (!raw) return EMPTY;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (typeof value !== 'object' || value === null) return EMPTY;
  const { v, done } = value as { v?: unknown; done?: unknown };
  if (v !== VERSION || !Array.isArray(done)) return EMPTY;
  return { done: unique(done.filter((s): s is string => typeof s === 'string' && SLUG_RE.test(s))) };
}

export function serializeProgress(progress: Progress): string {
  return JSON.stringify({ v: VERSION, done: progress.done });
}

export function isDone(progress: Progress, slug: string): boolean {
  return progress.done.includes(slug);
}

/** Progress with `slug` completed. Returns the same object if it already was. */
export function markDone(progress: Progress, slug: string): Progress {
  return isDone(progress, slug) ? progress : { done: [...progress.done, slug] };
}

/** Union of two progress records (e.g. this tab's and another tab's). */
export function mergeProgress(a: Progress, b: Progress): Progress {
  return { done: unique([...a.done, ...b.done]) };
}

/**
 * How many of a journey's current steps are done. Slugs of steps that no
 * longer exist are ignored, so renaming a step can't push the count past 100%.
 */
export function countDone(progress: Progress, stepSlugs: readonly string[]): number {
  return stepSlugs.filter((slug) => isDone(progress, slug)).length;
}

/** Read a journey's progress. Returns empty progress if storage is unavailable. */
export function readProgress(storage: StorageLike | null | undefined, serviceId: string): Progress {
  try {
    return parseProgress(storage?.getItem(storageKey(serviceId)));
  } catch {
    return EMPTY;
  }
}

/**
 * Mark a step done and save it. Re-reads storage first and merges, so a
 * step completed in another tab isn't overwritten. Returns the merged
 * progress even if saving fails, so the page can still show it.
 */
export function saveStep(storage: StorageLike | null | undefined, serviceId: string, slug: string): Progress {
  const next = markDone(readProgress(storage, serviceId), slug);
  try {
    storage?.setItem(storageKey(serviceId), serializeProgress(next));
  } catch {
    // Storage full or blocked: keep the in-memory result.
  }
  return next;
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}
