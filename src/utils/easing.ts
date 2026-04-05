/** Approximates CSS ease-in-out (cubic-bezier 0.42, 0, 0.58, 1). */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
