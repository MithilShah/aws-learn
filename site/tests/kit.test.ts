import { describe, expect, it } from 'vitest';
import { anchor, arrowGeometry } from '../src/lib/diagram';
import { makeId, slugify } from '../src/lib/ids';
import { actionForKey, clampStage, isLit, parseStages, reduceStepper, statusText } from '../src/lib/stepper';
import { nextTabIndex } from '../src/lib/tabs';

describe('stepper', () => {
  const at = (current: number) => ({ current, count: 4 });

  it('moves forward and back, stopping at the ends', () => {
    expect(reduceStepper(at(1), 'next')).toEqual(at(2));
    expect(reduceStepper(at(4), 'next')).toEqual(at(4));
    expect(reduceStepper(at(3), 'prev')).toEqual(at(2));
    expect(reduceStepper(at(1), 'prev')).toEqual(at(1));
  });

  it('jumps to the first and last stage', () => {
    expect(reduceStepper(at(3), 'first')).toEqual(at(1));
    expect(reduceStepper(at(2), 'last')).toEqual(at(4));
  });

  it('returns the same state when nothing changes, so callers can skip re-rendering', () => {
    const state = at(4);
    expect(reduceStepper(state, 'next')).toBe(state);
  });

  it('clamps out-of-range and non-integer stages', () => {
    expect(clampStage(0, 4)).toBe(1);
    expect(clampStage(9, 4)).toBe(4);
    expect(clampStage(2.7, 4)).toBe(2);
    expect(clampStage(Number.NaN, 4)).toBe(1);
    expect(clampStage(3, 0)).toBe(1);
  });

  it.each([
    ['ArrowRight', 'next'],
    ['ArrowLeft', 'prev'],
    ['Home', 'first'],
    ['End', 'last'],
    ['ArrowDown', null],
    ['ArrowUp', null],
    ['Enter', null],
    [' ', null],
  ])('key %j -> %s', (key, action) => {
    expect(actionForKey(key)).toBe(action);
  });

  it('parses stage lists, ignoring junk', () => {
    expect(parseStages('2')).toEqual([2]);
    expect(parseStages('3 1')).toEqual([1, 3]);
    expect(parseStages('1,2, 2')).toEqual([1, 2]);
    expect(parseStages('0 -1 x 1.5 4')).toEqual([4]);
    expect(parseStages('')).toEqual([]);
    expect(parseStages(null)).toEqual([]);
  });

  it('lights parts at their stages, or from a stage onwards', () => {
    expect(isLit(2, { stages: [2, 3] })).toBe(true);
    expect(isLit(4, { stages: [2, 3] })).toBe(false);
    expect(isLit(2, { from: 3 })).toBe(false);
    expect(isLit(3, { from: 3 })).toBe(true);
    expect(isLit(9, { from: 3 })).toBe(true);
    expect(isLit(1, {})).toBe(false);
  });

  it('announces the stage and its title', () => {
    expect(statusText(2, 4, 'The recorder captures the change')).toBe('Stage 2 of 4: The recorder captures the change');
  });
});

describe('tabs keyboard', () => {
  it('moves right and left, wrapping around', () => {
    expect(nextTabIndex('ArrowRight', 0, 4)).toBe(1);
    expect(nextTabIndex('ArrowRight', 3, 4)).toBe(0);
    expect(nextTabIndex('ArrowLeft', 0, 4)).toBe(3);
    expect(nextTabIndex('ArrowLeft', 2, 4)).toBe(1);
  });

  it('jumps to the first and last tab', () => {
    expect(nextTabIndex('Home', 2, 4)).toBe(0);
    expect(nextTabIndex('End', 1, 4)).toBe(3);
  });

  it('ignores other keys and empty tab lists', () => {
    expect(nextTabIndex('ArrowDown', 1, 4)).toBeNull();
    expect(nextTabIndex('Tab', 1, 4)).toBeNull();
    expect(nextTabIndex('ArrowRight', 0, 0)).toBeNull();
  });
});

describe('diagram geometry', () => {
  const box = { x: 10, y: 20, width: 100, height: 40 };

  it('finds the middle of each side of a box', () => {
    expect(anchor(box, 'top')).toEqual({ x: 60, y: 20 });
    expect(anchor(box, 'bottom')).toEqual({ x: 60, y: 60 });
    expect(anchor(box, 'left')).toEqual({ x: 10, y: 40 });
    expect(anchor(box, 'right')).toEqual({ x: 110, y: 40 });
  });

  it('ends the shaft where the head starts, with the tip exactly at the target', () => {
    const arrow = arrowGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, 10)!;
    expect(arrow.line).toEqual({ x1: 0, y1: 0, x2: 90, y2: 0 });
    expect(arrow.head).toBe('100,0 90,6 90,-6');
    expect(arrow.mid).toEqual({ x: 45, y: 0 });
  });

  it('points the right way for a vertical arrow', () => {
    const arrow = arrowGeometry({ x: 50, y: 100 }, { x: 50, y: 0 }, 10)!;
    expect(arrow.line.y2).toBe(10);
    expect(arrow.head.startsWith('50,0 ')).toBe(true);
  });

  it('keeps the head no longer than a very short arrow', () => {
    const arrow = arrowGeometry({ x: 0, y: 0 }, { x: 4, y: 0 }, 10)!;
    expect(arrow.line).toEqual({ x1: 0, y1: 0, x2: 0, y2: 0 });
  });

  it('returns null for a zero-length arrow', () => {
    expect(arrowGeometry({ x: 5, y: 5 }, { x: 5, y: 5 })).toBeNull();
  });
});

describe('ids', () => {
  it('slugifies text, stripping accents and punctuation', () => {
    expect(slugify('How AWS Config works!')).toBe('how-aws-config-works');
    expect(slugify('  Café — résumé  ')).toBe('cafe-resume');
  });

  it('makes stable, readable, distinct ids', () => {
    const a = makeId('fig', 'How a change is recorded');
    expect(a).toMatch(/^fig-how-a-change-is-recorded-[a-z0-9]+$/);
    expect(makeId('fig', 'How a change is recorded')).toBe(a);
    // Same slug, different text: still distinct.
    expect(makeId('fig', 'Rules!')).not.toBe(makeId('fig', 'Rules?'));
  });

  it('caps long slugs', () => {
    expect(makeId('term', 'x'.repeat(200)).length).toBeLessThan(60);
  });
});
