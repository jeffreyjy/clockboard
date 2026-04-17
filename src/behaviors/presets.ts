import { ALL_PATTERNS, NOON, INWARD } from '../patterns/ambient'
import { spin, uniformPattern } from '../patterns/spin'
import { pickExcept } from '../utils/random'
import * as stagger from '../utils/stagger'
import type { Behavior, GridPattern, SequenceStep } from '../types'
import { loop } from './sequence'

const DRIFT_PATTERNS: GridPattern[] = ALL_PATTERNS.filter(p => p !== NOON && p !== INWARD)

const STAGGER_POOL = [
  undefined,
  stagger.leftToRight(1500),
  stagger.rightToLeft(1500),
  stagger.centerOut(1500),
  stagger.edgesIn(1500),
]

function pickStagger() {
  return STAGGER_POOL[Math.floor(Math.random() * STAGGER_POOL.length)]
}

// ─── Composable spin presets (SequenceStep[]) ───────────────────────────────

/** INWARD opposite spin with center-out stagger. */
export function concentricSpin(): SequenceStep[] {
  return [
    { pattern: INWARD, duration: 2000 },
    ...spin({ start: INWARD, opposite: true, stagger: stagger.centerOut(1500) }),
  ]
}

/** Vertical line spin with left-to-right stagger. */
export function waveSpin(): SequenceStep[] {
  const start = uniformPattern(0, 180)
  return [
    { pattern: start, duration: 2000 },
    ...spin({ start, stagger: stagger.leftToRight(1500) }),
  ]
}

// ─── Standalone behaviors ───────────────────────────────────────────────────

/** INWARD opposite spin with center-out stagger, looping. */
export function concentricDance(): Behavior {
  return loop(concentricSpin())
}

/** Slow ambient pattern transitions with random stagger, looping. */
export function gentleDrift(): Behavior {
  return (apply) => {
    let cancelled = false
    let lastPattern: GridPattern | null = null

    function next() {
      if (cancelled) return
      const pattern = pickExcept(DRIFT_PATTERNS, lastPattern)
      lastPattern = pattern
      apply(pattern, {
        duration: 8000 + Math.random() * 4000,
        stagger: pickStagger(),
        onComplete: () => {
          setTimeout(next, 1000 + Math.random() * 1000)
        },
      })
    }

    next()
    return () => { cancelled = true }
  }
}
