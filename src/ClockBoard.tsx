import { useEffect, useMemo } from 'react'
import type { ClockBoardProps } from './types'
import { Clock } from './Clock'
import { useClockBoard } from './useClockBoard'
import { clockRandom } from './behaviors/clock'
import { BOARD_COLOR, BOARD_PADDING, BOARD_RADIUS, CLOCK_GAP, COLS, DEFAULT_DURATION, ROWS } from './config'

const TOTAL = COLS * ROWS
const DEFAULT_BEHAVIOR = clockRandom()

export function ClockBoard({
  behavior,
  pattern,
  duration,
  handColor,
  faceColor,
  boardColor,
  boardPadding,
  boardRadius,
  clockGap,
  className,
  style,
}: ClockBoardProps) {
  const { refCallbacks, applyPattern } = useClockBoard()

  useEffect(() => {
    if (pattern) {
      applyPattern(pattern, duration ?? DEFAULT_DURATION)
      return
    }
    const b = behavior ?? DEFAULT_BEHAVIOR
    return b(applyPattern)
  }, [behavior, pattern, duration, applyPattern])

  const clocks = useMemo(
    () =>
      Array.from({ length: TOTAL }, (_, i) => (
        <Clock
          key={i}
          hand1Ref={refCallbacks[i * 2]}
          hand2Ref={refCallbacks[i * 2 + 1]}
          handColor={handColor}
          faceColor={faceColor}
        />
      )),
    [refCallbacks, handColor, faceColor]
  )

  const computedBoardStyle = useMemo<React.CSSProperties>(() => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: boardColor ?? BOARD_COLOR,
    padding: boardPadding ?? BOARD_PADDING,
    boxSizing: 'border-box' as const,
    borderRadius: boardRadius ?? BOARD_RADIUS,
    ...style,
  }), [boardColor, boardPadding, boardRadius, style])

  const computedGridStyle = useMemo<React.CSSProperties>(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${COLS}, 1fr)`,
    gap: clockGap ?? CLOCK_GAP,
    width: '100%',
  }), [clockGap])

  return (
    <div className={className} style={computedBoardStyle}>
      <div style={computedGridStyle}>
        {clocks}
      </div>
    </div>
  )
}
