import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ClockBoardProps } from './types'
import { useCanvasBoard } from './useCanvasBoard'
import { clockRandom } from './behaviors/clock'
import { easeInOut } from './utils/easing'
import { BOARD_COLOR, BOARD_PADDING, BOARD_RADIUS, CLOCK_FACE_INSET, CLOCK_GAP, COLS, DEFAULT_DURATION, HAND_COLOR, CLOCK_COLOR, ROWS } from './config'

const DEFAULT_BEHAVIOR = clockRandom()

/** Width ÷ height for square cells (ignores small % gaps — close enough for fit). */
const GRID_ASPECT = COLS / ROWS

export function ClockBoard({
  behavior,
  pattern,
  duration,
  easing,
  rotation,
  handColor,
  faceColor,
  boardColor,
  boardPadding,
  boardRadius,
  clockGap,
  className,
  style,
}: ClockBoardProps) {
  const { canvasRef, applyPattern, updateLayout, updateColors, updateEasing, updateRotation } = useCanvasBoard()
  const boardRef = useRef<HTMLDivElement>(null)
  const [gridPx, setGridPx] = useState({ w: 0, h: 0 })

  // Measure available space and keep the grid at the correct aspect ratio
  useLayoutEffect(() => {
    const el = boardRef.current
    if (!el) return

    function measure() {
      const node = boardRef.current
      if (!node) return
      const cs = getComputedStyle(node)
      const pl = parseFloat(cs.paddingLeft) || 0
      const pr = parseFloat(cs.paddingRight) || 0
      const pt = parseFloat(cs.paddingTop) || 0
      const pb = parseFloat(cs.paddingBottom) || 0
      const innerW = node.clientWidth - pl - pr
      const innerH = node.clientHeight - pt - pb
      if (innerW <= 0 || innerH <= 0) {
        setGridPx({ w: 0, h: 0 })
        return
      }
      const w = Math.min(innerW, innerH * GRID_ASPECT)
      const h = w / GRID_ASPECT
      setGridPx({ w, h })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [boardPadding, clockGap])

  // Update canvas physical pixel dimensions and layout cache on size change
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || gridPx.w === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width  = Math.round(gridPx.w * dpr)
    canvas.height = Math.round(gridPx.h * dpr)
    updateLayout(gridPx.w, gridPx.h, clockGap ?? CLOCK_GAP, CLOCK_FACE_INSET)
  }, [gridPx, clockGap, canvasRef, updateLayout])

  // Sync colors whenever props change
  useEffect(() => {
    updateColors(handColor ?? HAND_COLOR, faceColor ?? CLOCK_COLOR)
  }, [handColor, faceColor, updateColors])

  // Sync easing function whenever the prop changes
  useEffect(() => {
    updateEasing(easing === 'linear' ? (t: number) => t : easeInOut)
  }, [easing, updateEasing])

  // Sync rotation mode whenever the prop changes
  useEffect(() => {
    updateRotation(rotation === 'shortest' ? 'shortest' : 'clockwise')
  }, [rotation, updateRotation])

  // Run behavior or apply static pattern
  useEffect(() => {
    if (pattern) {
      applyPattern(pattern, duration ?? DEFAULT_DURATION)
      return
    }
    const b = behavior ?? DEFAULT_BEHAVIOR
    return b(applyPattern)
  }, [behavior, pattern, duration, applyPattern])

  const computedBoardStyle = useMemo<React.CSSProperties>(() => ({
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: boardColor ?? BOARD_COLOR,
    padding: boardPadding ?? BOARD_PADDING,
    boxSizing: 'border-box' as const,
    borderRadius: boardRadius ?? BOARD_RADIUS,
    ...style,
  }), [boardColor, boardPadding, boardRadius, style])

  return (
    <div ref={boardRef} className={className} style={computedBoardStyle}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width:  gridPx.w > 0 ? gridPx.w : '100%',
          height: gridPx.h > 0 ? gridPx.h : 'auto',
          flexShrink: 0,
        }}
      />
    </div>
  )
}
