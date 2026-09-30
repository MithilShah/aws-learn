import { describe, expect, it } from 'vitest';
import {
  EMPTY,
  countDone,
  isDone,
  markDone,
  mergeProgress,
  nextStep,
  parseProgress,
  readProgress,
  saveStep,
  serializeProgress,
  storageKey,
  type StorageLike,
} from '../src/lib/progress';

/** In-memory Storage stand-in. */
function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const throwing: StorageLike = {
  getItem: () => {
    throw new DOMException('blocked', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('full', 'QuotaExceededError');
  },
};

describe('storageKey', () => {
  it('namespaces by service', () => {
    expect(storageKey('config')).toBe('st-aws:config');
  });
});

describe('parseProgress / serializeProgress', () => {
  it('round-trips', () => {
    const progress = { done: ['what-is-aws-config', 'how-it-works'] };
    expect(parseProgress(serializeProgress(progress))).toEqual(progress);
    expect(serializeProgress(progress)).toBe('{"v":1,"done":["what-is-aws-config","how-it-works"]}');
  });

  it.each([
    ['nothing stored', null],
    ['an empty string', ''],
    ['invalid JSON', '{not json'],
    ['a JSON array', '["how-it-works"]'],
    ['JSON null', 'null'],
    ['an unknown version', '{"v":2,"done":["how-it-works"]}'],
    ['a missing version', '{"done":["how-it-works"]}'],
    ['done that is not a list', '{"v":1,"done":"how-it-works"}'],
  ])('returns empty progress for %s', (_label, raw) => {
    expect(parseProgress(raw)).toEqual(EMPTY);
  });

  it('drops invalid and duplicate entries but keeps valid ones', () => {
    const raw = JSON.stringify({ v: 1, done: ['how-it-works', 42, '<script>', 'How-It-Works', 'how-it-works', 'remediation'] });
    expect(parseProgress(raw)).toEqual({ done: ['how-it-works', 'remediation'] });
  });
});

describe('markDone / isDone', () => {
  it('adds a step once, keeping completion order', () => {
    const one = markDone(EMPTY, 'how-it-works');
    const two = markDone(one, 'what-is-aws-config');
    expect(two.done).toEqual(['how-it-works', 'what-is-aws-config']);
    expect(isDone(two, 'how-it-works')).toBe(true);
    expect(isDone(two, 'remediation')).toBe(false);
  });

  it('is idempotent and never mutates its input', () => {
    const one = markDone(EMPTY, 'how-it-works');
    expect(markDone(one, 'how-it-works')).toBe(one);
    expect(EMPTY.done).toEqual([]);
  });
});

describe('mergeProgress', () => {
  it('is the union of both, without duplicates', () => {
    expect(mergeProgress({ done: ['a', 'b'] }, { done: ['b', 'c'] })).toEqual({ done: ['a', 'b', 'c'] });
  });
});

describe('nextStep', () => {
  const steps = ['what-is-aws-config', 'how-it-works', 'config-rules'];

  it('is the first unfinished step in journey order, not completion order', () => {
    expect(nextStep(EMPTY, steps)).toBe('what-is-aws-config');
    expect(nextStep({ done: ['how-it-works'] }, steps)).toBe('what-is-aws-config');
    expect(nextStep({ done: ['what-is-aws-config', 'how-it-works'] }, steps)).toBe('config-rules');
  });

  it('is null once every step is done', () => {
    expect(nextStep({ done: [...steps].reverse() }, steps)).toBeNull();
  });
});

describe('countDone', () => {
  it('counts only steps that still exist in the journey', () => {
    const progress = { done: ['what-is-aws-config', 'renamed-old-step', 'how-it-works'] };
    expect(countDone(progress, ['what-is-aws-config', 'how-it-works', 'config-rules'])).toBe(2);
    expect(countDone(EMPTY, ['what-is-aws-config'])).toBe(0);
  });
});

describe('readProgress / saveStep', () => {
  it('reads what was saved, per service', () => {
    const storage = memoryStorage();
    saveStep(storage, 'config', 'how-it-works');
    saveStep(storage, 's3', 'buckets');
    expect(readProgress(storage, 'config')).toEqual({ done: ['how-it-works'] });
    expect(storage.data['st-aws:config']).toBe('{"v":1,"done":["how-it-works"]}');
  });

  it('merges with what another tab saved in the meantime', () => {
    const storage = memoryStorage();
    saveStep(storage, 'config', 'what-is-aws-config');
    // Another tab writes directly.
    storage.setItem('st-aws:config', serializeProgress({ done: ['what-is-aws-config', 'config-rules'] }));
    expect(saveStep(storage, 'config', 'how-it-works').done).toEqual([
      'what-is-aws-config',
      'config-rules',
      'how-it-works',
    ]);
  });

  it('recovers from corrupt stored data', () => {
    const storage = memoryStorage({ 'st-aws:config': 'garbage' });
    expect(saveStep(storage, 'config', 'how-it-works')).toEqual({ done: ['how-it-works'] });
    expect(readProgress(storage, 'config')).toEqual({ done: ['how-it-works'] });
  });

  it('never throws when storage is blocked, missing or full', () => {
    expect(readProgress(throwing, 'config')).toEqual(EMPTY);
    expect(saveStep(throwing, 'config', 'how-it-works')).toEqual({ done: ['how-it-works'] });
    expect(readProgress(null, 'config')).toEqual(EMPTY);
    expect(saveStep(undefined, 'config', 'how-it-works')).toEqual({ done: ['how-it-works'] });
  });
});
