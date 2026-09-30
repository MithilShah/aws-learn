/**
 * Geometry for the SVG diagram kit (Diagram, ServiceNode, Arrow). All
 * coordinates are in the diagram's viewBox units.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Side = 'top' | 'right' | 'bottom' | 'left';

const round = (n: number) => Math.round(n * 100) / 100;

/** Midpoint of one side of a box, for attaching arrows to service nodes. */
export function anchor(box: Box, side: Side): Point {
  switch (side) {
    case 'top':
      return { x: box.x + box.width / 2, y: box.y };
    case 'bottom':
      return { x: box.x + box.width / 2, y: box.y + box.height };
    case 'left':
      return { x: box.x, y: box.y + box.height / 2 };
    case 'right':
      return { x: box.x + box.width, y: box.y + box.height / 2 };
  }
}

export interface ArrowGeometry {
  /** The shaft, ending where the head begins. */
  line: { x1: number; y1: number; x2: number; y2: number };
  /** Arrowhead triangle as an SVG points list, tip at `to`. */
  head: string;
  /** Where to place a label: the shaft's midpoint. */
  mid: Point;
}

/**
 * An arrow from `from` to `to` with a filled triangular head (no <marker>,
 * so there are no ids to clash when several diagrams share a page).
 * Returns null for a zero-length arrow.
 */
export function arrowGeometry(from: Point, to: Point, headLength = 10): ArrowGeometry | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return null;
  const head = Math.min(headLength, length);
  const ux = dx / length;
  const uy = dy / length;
  // Base of the head, and the perpendicular for its half-width.
  const bx = to.x - ux * head;
  const by = to.y - uy * head;
  const half = head * 0.6;
  const px = -uy * half;
  const py = ux * half;
  return {
    line: { x1: round(from.x), y1: round(from.y), x2: round(bx), y2: round(by) },
    head: [
      [to.x, to.y],
      [bx + px, by + py],
      [bx - px, by - py],
    ]
      .map(([x, y]) => `${round(x)},${round(y)}`)
      .join(' '),
    mid: { x: round((from.x + bx) / 2), y: round((from.y + by) / 2) },
  };
}
