import { describe, expect, it } from 'vitest';
import { apply, currentVersion, isReadable, run, type TimelineState } from '../src/lib/version-timeline';
import { steps } from '../src/lib/version-timeline-data';

const empty: TimelineState = { versions: [] };

describe('apply: put', () => {
  it('adds a new current version without removing older ones', () => {
    const s1 = apply(empty, { type: 'put', label: 'a' });
    const s2 = apply(s1, { type: 'put', label: 'b' });
    expect(s2.versions.map((v) => v.versionId)).toEqual(['v2', 'v1']);
    expect(currentVersion(s2)?.label).toBe('b');
    expect(isReadable(s2)).toBe(true);
  });
});

describe('apply: delete', () => {
  it('adds a delete marker as current and makes the key unreadable, keeping the data', () => {
    const s = run([{ type: 'put', label: 'a' }, { type: 'delete' }]);
    expect(currentVersion(s)?.isDeleteMarker).toBe(true);
    expect(isReadable(s)).toBe(false);
    // The real version is still underneath — nothing was discarded.
    expect(s.versions.some((v) => !v.isDeleteMarker && v.label === 'a')).toBe(true);
  });
});

describe('apply: undo-delete', () => {
  it('removes the current delete marker and makes the previous version current', () => {
    const s = run([{ type: 'put', label: 'a' }, { type: 'delete' }, { type: 'undo-delete' }]);
    expect(isReadable(s)).toBe(true);
    expect(currentVersion(s)?.label).toBe('a');
  });

  it('does nothing when the current version is not a delete marker', () => {
    const s = run([{ type: 'put', label: 'a' }]);
    expect(apply(s, { type: 'undo-delete' })).toBe(s);
  });

  it('does nothing on an empty key', () => {
    expect(apply(empty, { type: 'undo-delete' })).toBe(empty);
  });
});

describe('scripted recovery story (data)', () => {
  it('ends with the object recovered and readable', () => {
    const final = run(steps.map((s) => s.op));
    expect(isReadable(final)).toBe(true);
    expect(currentVersion(final)?.label).toContain('edit');
  });

  it('at the delete step the key is unreadable but data is retained', () => {
    const afterDelete = run(steps.slice(0, 3).map((s) => s.op));
    expect(isReadable(afterDelete)).toBe(false);
    expect(afterDelete.versions.filter((v) => !v.isDeleteMarker).length).toBe(2);
  });
});
