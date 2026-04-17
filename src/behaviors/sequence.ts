import type { Behavior, SequenceStep } from '../types'

/** Plays steps in order, then stops. */
export function sequence(steps: SequenceStep[]): Behavior {
  return (apply) => {
    let index = 0
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    function playNext() {
      if (cancelled || index >= steps.length) return
      const step = steps[index]
      const pattern = typeof step.pattern === 'function' ? step.pattern() : step.pattern
      const { hold, pattern: _, ...opts } = step
      index++
      apply(pattern, {
        ...opts,
        onComplete: () => {
          timer = setTimeout(playNext, hold ?? 0)
        },
      })
    }

    playNext()
    return () => { cancelled = true; clearTimeout(timer) }
  }
}

/** Plays steps in order, repeating forever. */
export function loop(steps: SequenceStep[]): Behavior {
  return (apply) => {
    let index = 0
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    function playNext() {
      if (cancelled) return
      const step = steps[index % steps.length]
      const pattern = typeof step.pattern === 'function' ? step.pattern() : step.pattern
      const { hold, pattern: _, ...opts } = step
      index++
      apply(pattern, {
        ...opts,
        onComplete: () => {
          timer = setTimeout(playNext, hold ?? 0)
        },
      })
    }

    playNext()
    return () => { cancelled = true; clearTimeout(timer) }
  }
}
