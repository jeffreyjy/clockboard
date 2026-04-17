import { COLS, ROWS } from '../config'
import { trapezoid } from '../utils/easing'
import { NOON, INWARD } from './ambient'
import type { ClockState, GridPattern, SequenceStep, SpinOptions } from '../types'

const SPIN_EASING = trapezoid(0.10)

const DEFAULT_START: GridPattern = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, (): ClockState => [0, 180])
)

/** Every clock set to the same hand positions. */
export function uniformPattern(minuteAngle: number, hourAngle: number): GridPattern {
  const cell: ClockState = [minuteAngle, hourAngle]
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, (): ClockState => [...cell])
  )
}

/** Symmetric patterns suitable as spin starting positions. */
export const SYMMETRIC_STARTS: GridPattern[] = [
  NOON,
  uniformPattern(0, 180),
  uniformPattern(270, 90),
  INWARD,
]

/** Returns a spin as SequenceStep[]. Setup step is the caller's responsibility. */
export function spin(options?: SpinOptions): SequenceStep[] {
  const start    = options?.start ?? DEFAULT_START
  const rev      = options?.revolutions ?? 3
  const opposite = options?.opposite ?? false
  const revDur   = options?.revolutionDuration ?? 10000
  const degrees  = rev * 360
  return [{
    pattern:  rotateAll(start, degrees, opposite ? -degrees : degrees),
    duration: rev * revDur,
    easing:   options?.easing ?? SPIN_EASING,
    absolute: true,
    stagger:  options?.stagger,
  }]
}

/** Returns a new pattern with all hands offset. Pass two values for independent hand control. */
export function rotateAll(pattern: GridPattern, minuteDegrees: number, hourDegrees?: number): GridPattern {
  const hd = hourDegrees ?? minuteDegrees
  return pattern.map(row =>
    row.map(([h1, h2]): ClockState => {
      const n1 = ((h1 % 360) + 360) % 360
      const n2 = ((h2 % 360) + 360) % 360
      return [n1 + minuteDegrees, n2 + hd]
    })
  )
}
