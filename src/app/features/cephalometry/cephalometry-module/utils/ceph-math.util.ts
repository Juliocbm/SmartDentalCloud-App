import { Point } from '../models/cephalometry.models';

/**
 * Pure mathematical functions for cephalometric calculations.
 * No Angular dependencies — can be used anywhere.
 */

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Angle (in degrees) at vertex p2, formed by rays p2→p1 and p2→p3. */
export function angleBetween(p1: Point, p2: Point, p3: Point): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 === 0 || m2 === 0) return NaN;
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return Math.acos(cos) * (180 / Math.PI);
}

/** Angle (in degrees) between two lines: (pA1–pA2) and (pB1–pB2). */
export function angleBetweenLines(pA1: Point, pA2: Point, pB1: Point, pB2: Point): number {
  const v1 = { x: pA2.x - pA1.x, y: pA2.y - pA1.y };
  const v2 = { x: pB2.x - pB1.x, y: pB2.y - pB1.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 === 0 || m2 === 0) return NaN;
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return Math.acos(cos) * (180 / Math.PI);
}

/** Always returns the acute angle (≤90°) between two lines. Clinical convention. */
export function acuteAngleBetweenLines(pA1: Point, pA2: Point, pB1: Point, pB2: Point): number {
  const ang = angleBetweenLines(pA1, pA2, pB1, pB2);
  if (Number.isNaN(ang)) return NaN;
  return ang > 90 ? 180 - ang : ang;
}

/**
 * Signed perpendicular distance from point p to the line defined by a–b.
 * Positive = left side of line direction, negative = right side.
 */
export function pointLineDistanceSigned(p: Point, a: Point, b: Point): number {
  const num = (b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y);
  const den = Math.hypot(b.x - a.x, b.y - a.y);
  return den === 0 ? NaN : num / den;
}

/** Perpendicular projection of point p onto the line defined by a–b. */
export function projectPointOntoLine(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { ...a };
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  return { x: a.x + t * dx, y: a.y + t * dy };
}

/** Intersection of two infinite lines: (A1–A2) and (B1–B2). Returns null if parallel. */
export function intersectLines(A1: Point, A2: Point, B1: Point, B2: Point): Point | null {
  const a1 = A2.y - A1.y;
  const b1 = A1.x - A2.x;
  const c1 = a1 * A1.x + b1 * A1.y;
  const a2 = B2.y - B1.y;
  const b2 = B1.x - B2.x;
  const c2 = a2 * B1.x + b2 * B1.y;
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-8) return null;
  return {
    x: (b2 * c1 - b1 * c2) / det,
    y: (a1 * c2 - a2 * c1) / det,
  };
}

/** Z-score: (value − mean) / sd */
export function zScore(value: number, mean: number, sd: number): number {
  if (isNaN(value) || isNaN(mean) || isNaN(sd) || sd <= 0) return NaN;
  return (value - mean) / sd;
}

/** SVG arc path string for an angle indicator at vertex v, between arms v→p1 and v→p2. */
export function arcPath(v: Point, p1: Point, p2: Point, r: number = 35): string {
  const a1 = Math.atan2(p1.y - v.y, p1.x - v.x);
  const a2 = Math.atan2(p2.y - v.y, p2.x - v.x);
  let da = a2 - a1;
  while (da <= -Math.PI) da += 2 * Math.PI;
  while (da > Math.PI) da -= 2 * Math.PI;
  const s = { x: v.x + r * Math.cos(a1), y: v.y + r * Math.sin(a1) };
  const e = { x: v.x + r * Math.cos(a2), y: v.y + r * Math.sin(a2) };
  const largeArc = Math.abs(da) > Math.PI ? 1 : 0;
  const sweep = da > 0 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${e.x} ${e.y}`;
}

/** Format a number to fixed decimals, or return "—" if NaN/null/undefined. */
export function toFixedOrDash(n: number | undefined | null, decimals: number = 2): string {
  return n == null || Number.isNaN(n) ? '—' : n.toFixed(decimals);
}

/** Today's date in ISO format (YYYY-MM-DD). */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
