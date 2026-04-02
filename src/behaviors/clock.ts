import { CYCLE_HOLD, DEFAULT_DURATION } from '../config'
import { ALL_PATTERNS } from '../patterns/ambient'
import { composeTime } from '../patterns/time'
import { cycle, random } from './cycle'
import type { Behavior, GridPattern } from '../types'

const TIME_DURATION = 5000
const TIME_HOLD = 10000

export function clock(duration = DEFAULT_DURATION): Behavior {
  return (apply) => {
    function show() {
      const now = new Date()
      apply(composeTime(now.getHours(), now.getMinutes()), duration)
    }

    show()

    const now = new Date()
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

    let timer: ReturnType<typeof setTimeout>
    let interval: ReturnType<typeof setInterval>

    timer = setTimeout(() => {
      show()
      interval = setInterval(show, 60_000)
    }, msUntilNextMinute)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }
}

function showcase(
  ambientBehavior: Behavior,
  timeDuration = TIME_DURATION,
  timeHold = TIME_HOLD,
): Behavior {
  return (apply) => {
    let minuteTimer: ReturnType<typeof setTimeout>
    let resumeTimer: ReturnType<typeof setTimeout>
    let ambientCleanup: (() => void) | undefined

    function showTime() {
      clearTimeout(resumeTimer)

      if (ambientCleanup) {
        ambientCleanup()
        ambientCleanup = undefined
      }

      const now = new Date()
      apply(composeTime(now.getHours(), now.getMinutes()), timeDuration)

      resumeTimer = setTimeout(() => {
        ambientCleanup = ambientBehavior(apply)
      }, timeDuration + timeHold)
    }

    function scheduleMinute() {
      const now = new Date()
      const ms = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

      minuteTimer = setTimeout(() => {
        showTime()
        scheduleMinute()
      }, ms)
    }

    showTime()
    scheduleMinute()

    return () => {
      clearTimeout(minuteTimer)
      clearTimeout(resumeTimer)
      if (ambientCleanup) ambientCleanup()
    }
  }
}

export function clockRandom(
  patterns: GridPattern[] = ALL_PATTERNS,
  duration = DEFAULT_DURATION,
  hold = CYCLE_HOLD,
  timeDuration = TIME_DURATION,
  timeHold = TIME_HOLD,
): Behavior {
  return showcase(random(patterns, duration, hold), timeDuration, timeHold)
}

export function clockCycle(
  patterns: GridPattern[] = ALL_PATTERNS,
  duration = DEFAULT_DURATION,
  hold = CYCLE_HOLD,
  timeDuration = TIME_DURATION,
  timeHold = TIME_HOLD,
): Behavior {
  return showcase(cycle(patterns, duration, hold), timeDuration, timeHold)
}
