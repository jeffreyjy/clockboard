/**
 * Trapezoidal ease factory — ramp up, constant speed cruise, ramp down.
 * `edge` is the fraction of total time spent in each ramp (0–0.5).
 */
export function trapezoid(edge: number): (t: number) => number {
  const vMax = 1 / (1 - edge)
  return (t: number): number => {
    if (t < edge) {
      const s = t / edge
      return vMax * edge * s * s / 2
    }
    if (t > 1 - edge) {
      const s = (1 - t) / edge
      return 1 - vMax * edge * s * s / 2
    }
    return vMax * (t - edge / 2)
  }
}

/** Default trapezoidal ease — 30% ramp, 40% cruise. */
export const easeInOut = trapezoid(0.30)

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
