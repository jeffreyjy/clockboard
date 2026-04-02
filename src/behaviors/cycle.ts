import { CYCLE_HOLD, DEFAULT_DURATION } from '../config'
import { NOON } from '../patterns/ambient'
import type { Behavior, GridPattern } from '../types'

export function cycle(
  patterns: GridPattern[],
  duration = DEFAULT_DURATION,
  hold     = CYCLE_HOLD,
): Behavior {
  return (apply) => {
    let index = patterns[0] === NOON ? 1 % patterns.length : 0
    let timer: ReturnType<typeof setTimeout>

    function step() {
      apply(patterns[index], duration)
      index = (index + 1) % patterns.length
      timer = setTimeout(step, duration + hold)
    }

    step()
    return () => clearTimeout(timer)
  }
}

export function random(
  patterns: GridPattern[],
  duration = DEFAULT_DURATION,
  hold     = CYCLE_HOLD,
): Behavior {
  return (apply) => {
    let current = -1
    let timer: ReturnType<typeof setTimeout>

    function step() {
      let next: number
      do { next = Math.floor(Math.random() * patterns.length) } while ((next === current || (current === -1 && patterns[next] === NOON)) && patterns.length > 1)
      current = next
      apply(patterns[current], duration)
      timer = setTimeout(step, duration + hold)
    }

    step()
    return () => clearTimeout(timer)
  }
}
