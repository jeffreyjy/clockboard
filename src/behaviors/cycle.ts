import { CYCLE_HOLD, DEFAULT_DURATION } from '../config'
import { ALL_PATTERNS, NOON } from '../patterns/ambient'
import type { Behavior, GridPattern } from '../types'

/** Optional overrides for `cycle` / `random` — omit any key to use library defaults. */
export type CycleRandomOptions = {
  patterns?: GridPattern[]
  duration?: number
  hold?: number
}

function resolveCycleRandomArgs(
  patternsOrOptions?: GridPattern[] | CycleRandomOptions,
  duration?: number,
  hold?: number,
): { patterns: GridPattern[]; duration: number; hold: number } {
  if (patternsOrOptions !== undefined && !Array.isArray(patternsOrOptions)) {
    const o = patternsOrOptions
    return {
      patterns: o.patterns ?? ALL_PATTERNS,
      duration: o.duration ?? DEFAULT_DURATION,
      hold: o.hold ?? CYCLE_HOLD,
    }
  }
  return {
    patterns: (patternsOrOptions as GridPattern[] | undefined) ?? ALL_PATTERNS,
    duration: duration ?? DEFAULT_DURATION,
    hold: hold ?? CYCLE_HOLD,
  }
}

export function cycle(
  patternsOrOptions?: GridPattern[] | CycleRandomOptions,
  duration?: number,
  hold?: number,
): Behavior {
  const { patterns, duration: d, hold: h } = resolveCycleRandomArgs(patternsOrOptions, duration, hold)

  return (apply) => {
    let index = patterns[0] === NOON ? 1 % patterns.length : 0
    let timer: ReturnType<typeof setTimeout>

    function step() {
      timer = setTimeout(step, d + h)
      apply(patterns[index], d)
      index = (index + 1) % patterns.length
    }

    step()
    return () => clearTimeout(timer)
  }
}

export function random(
  patternsOrOptions?: GridPattern[] | CycleRandomOptions,
  duration?: number,
  hold?: number,
): Behavior {
  const { patterns, duration: d, hold: h } = resolveCycleRandomArgs(patternsOrOptions, duration, hold)

  return (apply) => {
    let current = -1
    let timer: ReturnType<typeof setTimeout>

    function step() {
      let next: number
      do { next = Math.floor(Math.random() * patterns.length) } while ((next === current || (current === -1 && patterns[next] === NOON)) && patterns.length > 1)
      current = next
      timer = setTimeout(step, d + h)
      apply(patterns[current], d)
    }

    step()
    return () => clearTimeout(timer)
  }
}
