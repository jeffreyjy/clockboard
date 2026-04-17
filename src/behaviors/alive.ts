import { ALL_PATTERNS, NOON, INWARD } from '../patterns/ambient'
import { composeTime } from '../patterns/time'
import { rotateAll, SYMMETRIC_STARTS } from '../patterns/spin'
import { pick, pickExcept, weightedPick, randInt, randFloat } from '../utils/random'
import * as stagger from '../utils/stagger'
import type { ApplyPattern, Behavior, GridPattern, StaggerFn } from '../types'

// ─── Pools ──────────────────────────────────────────────────────────────────

const AMBIENT_TARGETS: GridPattern[] = ALL_PATTERNS.filter(p => p !== NOON && p !== INWARD)

const STAGGER_FNS: (StaggerFn | undefined)[] = [
  undefined,
  stagger.leftToRight(1500),
  stagger.rightToLeft(1500),
  stagger.topToBottom(1500),
  stagger.bottomToTop(1500),
  stagger.centerOut(1500),
  stagger.edgesIn(1500),
]
const STAGGER_WEIGHTS = [0.3, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15]

const SPIN_DIRS: ('clockwise' | 'counterclockwise' | 'opposite')[] = [
  'clockwise', 'counterclockwise', 'opposite',
]

type Mood = 'drift' | 'spin' | 'restless'
const MOODS: Mood[] = ['drift', 'spin', 'restless']
const MOOD_WEIGHTS = [0.5, 0.4, 0.1]

function pickStagger(): StaggerFn | undefined {
  return weightedPick(STAGGER_FNS, STAGGER_WEIGHTS)
}

// afterAction: called after each action + hold. Calls resume() to continue mood,
// or bails out (e.g., to show time) and never calls resume.
type AfterAction = (resume: () => void) => void

// ─── Mood runners ───────────────────────────────────────────────────────────

function runDrift(apply: ApplyPattern, after: AfterAction, onDone: () => void): void {
  const count = randInt(3, 5)
  let i = 0
  let lastPattern: GridPattern | null = null

  function next() {
    if (i >= count) { onDone(); return }
    const pattern = pickExcept(AMBIENT_TARGETS, lastPattern)
    lastPattern = pattern
    const hold = randFloat(1000, 2000)
    i++
    apply(pattern, {
      duration: randFloat(8000, 12000),
      stagger: pickStagger(),
      onComplete: () => { setTimeout(() => after(next), hold) },
    })
  }

  next()
}

function runSpin(apply: ApplyPattern, after: AfterAction, onDone: () => void): void {
  const count = randInt(1, 3)
  let i = 0

  function next() {
    if (i >= count) { onDone(); return }
    const start = pick(SYMMETRIC_STARTS)
    const dir = pick(SPIN_DIRS)
    const rev = randInt(2, 3)
    const stag = pickStagger()
    const degrees = rev * 360
    const opposite = dir === 'opposite'
    const minuteDeg = degrees
    const hourDeg = opposite ? -degrees : (dir === 'counterclockwise' ? -degrees : degrees)
    const hold = randFloat(1000, 2000)
    i++

    apply(start, { duration: 2000, stagger: pickStagger(), onComplete: () => {
      apply(rotateAll(start, minuteDeg, hourDeg), {
        duration: rev * 10000,
        absolute: true,
        stagger: stag,
        onComplete: () => { setTimeout(() => after(next), hold) },
      })
    }})
  }

  next()
}

function runRestless(apply: ApplyPattern, after: AfterAction, onDone: () => void): void {
  const count = randInt(5, 8)
  let i = 0
  let lastPattern: GridPattern | null = null

  function next() {
    if (i >= count) { onDone(); return }
    const pattern = pickExcept(AMBIENT_TARGETS, lastPattern)
    lastPattern = pattern
    const hold = randFloat(500, 1000)
    i++
    apply(pattern, {
      duration: randFloat(2000, 4000),
      stagger: pickStagger(),
      onComplete: () => { setTimeout(() => after(next), hold) },
    })
  }

  next()
}

// ─── Transition between moods ───────────────────────────────────────────────

function transitionReveal(
  apply: ApplyPattern,
  target: GridPattern,
  isSymmetric: boolean,
  onDone: () => void,
): void {
  const doReveal = () => {
    apply(target, {
      spinRevolutions: 1,
      revolutionDuration: 5000,
      stagger: pickStagger(),
      onComplete: onDone,
    })
  }

  if (isSymmetric) {
    doReveal()
  } else {
    apply(pick(SYMMETRIC_STARTS), { duration: randFloat(2000, 3000), stagger: pickStagger(), onComplete: doReveal })
  }
}

function transitionDirect(
  apply: ApplyPattern,
  target: GridPattern,
  onDone: () => void,
): void {
  apply(target, {
    duration: randFloat(3000, 5000),
    stagger: pickStagger(),
    onComplete: onDone,
  })
}

function transitionToMood(
  apply: ApplyPattern,
  mood: Mood,
  isSymmetric: boolean,
  onDone: () => void,
): void {
  if (mood === 'spin') {
    onDone()
    return
  }

  if (Math.random() < 0.35) {
    transitionReveal(apply, pick(AMBIENT_TARGETS), isSymmetric, onDone)
  } else {
    transitionDirect(apply, pick(AMBIENT_TARGETS), onDone)
  }
}

// ─── Time phase ─────────────────────────────────────────────────────────────

function showTime(apply: ApplyPattern, isSymmetric: boolean, onDone: () => void): void {
  const now = new Date()
  const time = composeTime(now.getHours(), now.getMinutes())

  const afterLand = () => { setTimeout(onDone, 5000) }

  if (Math.random() < 0.35) {
    const doReveal = () => {
      apply(time, {
        spinRevolutions: 1,
        revolutionDuration: 5000,
        stagger: pickStagger(),
        onComplete: afterLand,
      })
    }
    if (isSymmetric) {
      doReveal()
    } else {
      apply(pick(SYMMETRIC_STARTS), { duration: randFloat(2000, 3000), stagger: pickStagger(), onComplete: doReveal })
    }
  } else {
    apply(time, {
      duration: randFloat(5000, 8000),
      stagger: pickStagger(),
      onComplete: afterLand,
    })
  }
}

// ─── Main loop ──────────────────────────────────────────────────────────────

function aliveLoop(apply: ApplyPattern, withTime: boolean): () => void {
  let cancelled = false
  let isSymmetric = false
  let lastMinute = new Date().getMinutes()

  // Called after every action + hold. Checks if minute changed.
  // If so: shows time, then goes back to step() (picks new mood).
  // If not: calls resume() to continue the current mood.
  const afterAction: AfterAction = (resume) => {
    if (cancelled) return
    if (!withTime) { resume(); return }

    const now = new Date()
    const currentMinute = now.getMinutes()
    if (currentMinute !== lastMinute) {
      lastMinute = currentMinute
      showTime(apply, isSymmetric, () => {
        isSymmetric = false
        if (!cancelled) step()
      })
    } else {
      resume()
    }
  }

  function step() {
    if (cancelled) return

    const mood = weightedPick(MOODS, MOOD_WEIGHTS)

    const runMood = () => {
      if (cancelled) return
      const runner = mood === 'drift' ? runDrift : mood === 'spin' ? runSpin : runRestless
      runner(apply, afterAction, () => {
        isSymmetric = mood === 'spin'
        if (!cancelled) step()
      })
    }

    transitionToMood(apply, mood, isSymmetric, () => {
      if (cancelled) return
      if (mood !== 'spin') isSymmetric = false
      runMood()
    })
  }

  if (withTime) {
    showTime(apply, isSymmetric, () => {
      isSymmetric = false
      lastMinute = new Date().getMinutes()
      if (!cancelled) step()
    })
  } else {
    step()
  }

  return () => { cancelled = true }
}

/** Generative behavior — diverse moods, no time display. */
export function alive(): Behavior {
  return (apply) => aliveLoop(apply, false)
}

/** Generative behavior with periodic time display. */
export function aliveTime(): Behavior {
  return (apply) => aliveLoop(apply, true)
}
