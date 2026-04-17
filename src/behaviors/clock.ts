import { CYCLE_HOLD, DEFAULT_DURATION } from '../config'
import { ALL_PATTERNS, NOON } from '../patterns/ambient'
import { composeTime } from '../patterns/time'
import type { CycleRandomOptions } from './cycle'
import type { Behavior, GridPattern } from '../types'

const TIME_DURATION = DEFAULT_DURATION
const TIME_HOLD = 10000

/** Optional overrides for `clock` — omit keys for defaults. */
export type ClockOptions = { duration?: number }

/** Ambient timing (`CycleRandomOptions`) plus time-display segment for `clockRandom` / `clockCycle`. */
export type ClockShowcaseOptions = CycleRandomOptions & {
  timeDuration?: number
  timeHold?: number
}

function resolveClockShowcaseArgs(
  first?: GridPattern[] | ClockShowcaseOptions,
  duration?: number,
  hold?: number,
  timeDuration?: number,
  timeHold?: number,
): {
  patterns: GridPattern[]
  duration: number
  hold: number
  timeDuration: number
  timeHold: number
  stagger?: (row: number, col: number) => number
} {
  if (first !== undefined && !Array.isArray(first)) {
    const o = first
    return {
      patterns: o.patterns ?? ALL_PATTERNS,
      duration: o.duration ?? DEFAULT_DURATION,
      hold: o.hold ?? CYCLE_HOLD,
      timeDuration: o.timeDuration ?? TIME_DURATION,
      timeHold: o.timeHold ?? TIME_HOLD,
      stagger: o.stagger,
    }
  }
  return {
    patterns: (first as GridPattern[] | undefined) ?? ALL_PATTERNS,
    duration: duration ?? DEFAULT_DURATION,
    hold: hold ?? CYCLE_HOLD,
    timeDuration: timeDuration ?? TIME_DURATION,
    timeHold: timeHold ?? TIME_HOLD,
  }
}

export function clock(durationOrOptions?: number | ClockOptions): Behavior {
  const duration =
    typeof durationOrOptions === 'number'
      ? durationOrOptions
      : (durationOrOptions?.duration ?? DEFAULT_DURATION)
  return (apply) => {
    let timer: ReturnType<typeof setTimeout>
    let cancelled = false

    function show() {
      if (cancelled) return
      const now = new Date()
      apply(composeTime(now.getHours(), now.getMinutes()), {
        duration,
        onComplete: () => {
          if (cancelled) return
          const n = new Date()
          const msUntilNextMinute = (60 - n.getSeconds()) * 1000 - n.getMilliseconds()
          timer = setTimeout(show, msUntilNextMinute)
        },
      })
    }

    show()
    return () => { cancelled = true; clearTimeout(timer) }
  }
}

// Single flat loop: show time whenever the minute changes, otherwise play the next
// ambient pattern. One timer, no nested behaviors, no coordination across closures.
function showcase(
  getNextPattern: () => GridPattern,
  duration: number,
  hold: number,
  timeDuration: number,
  timeHold: number,
  stagger?: (row: number, col: number) => number,
): Behavior {
  return (apply) => {
    let timer: ReturnType<typeof setTimeout>
    let lastMinute = -1
    let cancelled = false

    function step() {
      if (cancelled) return
      const now = new Date()
      const currentMinute = now.getMinutes()
      if (currentMinute !== lastMinute) {
        lastMinute = currentMinute
        apply(composeTime(now.getHours(), now.getMinutes()), {
          duration: timeDuration,
          stagger,
          onComplete: () => { timer = setTimeout(step, timeHold) },
        })
      } else {
        apply(getNextPattern(), {
          duration,
          stagger,
          onComplete: () => { timer = setTimeout(step, hold) },
        })
      }
    }

    step()
    return () => { cancelled = true; clearTimeout(timer) }
  }
}

export function clockRandom(
  first?: GridPattern[] | ClockShowcaseOptions,
  duration?: number,
  hold?: number,
  timeDuration?: number,
  timeHold?: number,
): Behavior {
  const a = resolveClockShowcaseArgs(first, duration, hold, timeDuration, timeHold)

  let current = -1
  const getNext = (): GridPattern => {
    let next: number
    do {
      next = Math.floor(Math.random() * a.patterns.length)
    } while (
      (next === current || (current === -1 && a.patterns[next] === NOON)) &&
      a.patterns.length > 1
    )
    current = next
    return a.patterns[current]
  }

  return showcase(getNext, a.duration, a.hold, a.timeDuration, a.timeHold, a.stagger)
}

export function clockCycle(
  first?: GridPattern[] | ClockShowcaseOptions,
  duration?: number,
  hold?: number,
  timeDuration?: number,
  timeHold?: number,
): Behavior {
  const a = resolveClockShowcaseArgs(first, duration, hold, timeDuration, timeHold)

  let index = a.patterns[0] === NOON ? 1 % a.patterns.length : 0
  const getNext = (): GridPattern => {
    const p = a.patterns[index]
    index = (index + 1) % a.patterns.length
    return p
  }

  return showcase(getNext, a.duration, a.hold, a.timeDuration, a.timeHold, a.stagger)
}
