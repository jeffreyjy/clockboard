import { useCallback, useRef } from 'react'
import { nextAngle } from './utils/angles'
import { ANIMATION_EASING, COLS, DEFAULT_DURATION, ROWS } from './config'
import type { ApplyPattern, GridPattern } from './types'

export function useClockBoard() {
  // Cumulative angles — never mod-360, preserves rotation direction history
  const anglesRef = useRef(new Float64Array(COLS * ROWS * 2))

  // Flat array of SVGRectElement refs: index = clockIndex * 2 + handIndex (0=hand1, 1=hand2)
  const handRefs = useRef<(SVGRectElement | null)[]>(
    new Array(COLS * ROWS * 2).fill(null)
  )

  // Created once — stable identity for the lifetime of the component
  const refCallbacks = useRef(
    Array.from({ length: COLS * ROWS * 2 }, (_, i) =>
      (el: SVGRectElement | null) => {
        handRefs.current[i] = el
      }
    )
  )

  const applyPattern: ApplyPattern = useCallback(
    (pattern: GridPattern, duration = DEFAULT_DURATION) => {
      const angles = anglesRef.current
      const refs   = handRefs.current

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c
          const [target1, target2] = pattern[r][c]

          const next1 = nextAngle(angles[i * 2],     target1)
          const next2 = nextAngle(angles[i * 2 + 1], target2)

          angles[i * 2]     = next1
          angles[i * 2 + 1] = next2

          // Single-keyframe: WAAPI uses the current visual position as the implicit "from",
          // giving smooth interruption even mid-animation.
          refs[i * 2]?.animate(
            [{ transform: `rotate(${next1}deg)` }],
            { duration, fill: 'forwards', easing: ANIMATION_EASING }
          )
          refs[i * 2 + 1]?.animate(
            [{ transform: `rotate(${next2}deg)` }],
            { duration, fill: 'forwards', easing: ANIMATION_EASING }
          )
        }
      }
    },
    [] // reads only refs and module-level constants — never stale
  )

  return {
    refCallbacks: refCallbacks.current,
    applyPattern,
  }
}
