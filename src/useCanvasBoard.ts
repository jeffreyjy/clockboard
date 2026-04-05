import { useCallback, useEffect, useRef } from 'react'
import { easeInOut, lerp } from './utils/easing'
import { nextAngle, nextAngleClockwise } from './utils/angles'
import { COLS, DEFAULT_DURATION, FACE_RADIUS, HAND_WIDTH, ROWS } from './config'
import type { ApplyPattern, GridPattern } from './types'

const TOTAL = COLS * ROWS

// Hand geometry in SVG units (viewBox 0–100, clock center at 50,50).
// These are scaled to canvas pixels via faceRadius / FACE_RADIUS.
const HAND_HALF_W_SVG = HAND_WIDTH / 2
const MINUTE_H_SVG    = Math.sqrt(FACE_RADIUS ** 2 - HAND_HALF_W_SVG ** 2)
const HOUR_H_SVG      = MINUTE_H_SVG * 0.8
const HUB_R_SVG       = HAND_HALF_W_SVG

type LayoutCache = {
  faceRadius: number
  handHalfW:  number
  minuteH:    number
  hourH:      number
  hubR:       number
  centers:    Float32Array // flat [cx0,cy0, cx1,cy1, ...] for TOTAL clocks
}

export function useCanvasBoard() {
  const canvasRef        = useRef<HTMLCanvasElement>(null)
  const prevAnglesRef    = useRef(new Float64Array(TOTAL * 2))
  const targAnglesRef    = useRef(new Float64Array(TOTAL * 2))
  // Wall-clock timing: t = (rAFTimestamp - startTime) / duration
  const startTimeRef = useRef(0)
  const durationRef  = useRef(DEFAULT_DURATION)
  const rafRef       = useRef(0)
  const layoutRef        = useRef<LayoutCache | null>(null)
  const colorsRef        = useRef({ hand: 'white', face: '#141414' })
  const easingFnRef      = useRef<(t: number) => number>(easeInOut)
  const nextAngleFnRef   = useRef<(current: number, target: number) => number>(nextAngleClockwise)

  // ─── Drawing ──────────────────────────────────────────────────────────────

  const drawFrame = useCallback((easedT: number) => {
    const canvas = canvasRef.current
    const layout = layoutRef.current
    if (!canvas || !layout) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const { faceRadius, handHalfW, minuteH, hourH, hubR, centers } = layout
    const { hand: handColor, face: faceColor } = colorsRef.current
    const prev = prevAnglesRef.current
    const targ = targAnglesRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    const TAU = Math.PI * 2
    const DEG_TO_RAD = Math.PI / 180

    for (let i = 0; i < TOTAL; i++) {
      const cx = centers[i * 2]
      const cy = centers[i * 2 + 1]
      const a1 = lerp(prev[i * 2],     targ[i * 2],     easedT) * DEG_TO_RAD
      const a2 = lerp(prev[i * 2 + 1], targ[i * 2 + 1], easedT) * DEG_TO_RAD

      ctx.fillStyle = faceColor
      ctx.beginPath()
      ctx.arc(cx, cy, faceRadius, 0, TAU)
      ctx.fill()

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, faceRadius, 0, TAU)
      ctx.clip()

      ctx.fillStyle = handColor

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a2)
      ctx.fillRect(-handHalfW, -hourH, handHalfW * 2, hourH)
      ctx.restore()

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a1)
      ctx.fillRect(-handHalfW, -minuteH, handHalfW * 2, minuteH)
      ctx.restore()

      ctx.beginPath()
      ctx.arc(cx, cy, hubR, 0, TAU)
      ctx.fill()

      ctx.restore()
    }

    ctx.restore()
  }, [])

  // ─── rAF loop ─────────────────────────────────────────────────────────────

  const tick = useCallback((timestamp: number) => {
    const t = Math.max(0, Math.min((timestamp - startTimeRef.current) / durationRef.current, 1))
    drawFrame(easingFnRef.current(t))

    if (t < 1) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      rafRef.current = 0
    }
  }, [drawFrame])

  // ─── Public API ───────────────────────────────────────────────────────────

  const applyPattern: ApplyPattern = useCallback(
    (pattern: GridPattern, duration = DEFAULT_DURATION) => {
      const prev = prevAnglesRef.current
      const targ = targAnglesRef.current

      // Snapshot current visual angles into prev (smooth mid-animation interruption)
      const elapsed = startTimeRef.current > 0 ? performance.now() - startTimeRef.current : 0
      const rawT    = durationRef.current > 0 ? Math.min(elapsed / durationRef.current, 1) : 1
      const snapT   = easingFnRef.current(rawT)
      for (let i = 0; i < prev.length; i++) {
        prev[i] = lerp(prev[i], targ[i], snapT)
      }

      // Set new targets, skipping hands that don't need to move
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c
          const [target1, target2] = pattern[r][c]
          const next1 = nextAngleFnRef.current(prev[i * 2],     target1)
          const next2 = nextAngleFnRef.current(prev[i * 2 + 1], target2)
          if (Math.abs(next1 - prev[i * 2]) < 0.5 && Math.abs(next2 - prev[i * 2 + 1]) < 0.5) continue
          targ[i * 2]     = next1
          targ[i * 2 + 1] = next2
        }
      }

      durationRef.current  = duration
      startTimeRef.current = performance.now()

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(tick)
    },
    [tick]
  )

  /** Called from ClockBoard's ResizeObserver whenever the canvas display size changes. */
  const updateLayout = useCallback((w: number, _h: number, gapStr: string, insetStr: string) => {
    const gapPx      = w * parseFloat(gapStr) / 100
    const cellSize   = (w - (COLS - 1) * gapPx) / COLS
    const insetPx    = cellSize * parseFloat(insetStr) / 100
    const faceRadius = cellSize / 2 - insetPx
    const scale      = faceRadius / FACE_RADIUS

    const centers = new Float32Array(TOTAL * 2)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c
        centers[i * 2]     = c * (cellSize + gapPx) + cellSize / 2
        centers[i * 2 + 1] = r * (cellSize + gapPx) + cellSize / 2
      }
    }

    layoutRef.current = {
      faceRadius,
      handHalfW: HAND_HALF_W_SVG * scale,
      minuteH:   MINUTE_H_SVG    * scale,
      hourH:     HOUR_H_SVG      * scale,
      hubR:      HUB_R_SVG       * scale,
      centers,
    }

    const elapsed = startTimeRef.current > 0 ? performance.now() - startTimeRef.current : 0
    const rawT    = durationRef.current > 0 ? Math.min(elapsed / durationRef.current, 1) : 1
    drawFrame(easingFnRef.current(rawT))
  }, [drawFrame])

  /** Called from ClockBoard when handColor or faceColor props change. */
  const updateColors = useCallback((hand: string, face: string) => {
    colorsRef.current = { hand, face }
  }, [])

  /** Called from ClockBoard when the easing prop changes. */
  const updateEasing = useCallback((fn: (t: number) => number) => {
    easingFnRef.current = fn
  }, [])

  /** Called from ClockBoard when the rotation prop changes. */
  const updateRotation = useCallback((mode: 'clockwise' | 'shortest') => {
    nextAngleFnRef.current = mode === 'shortest' ? nextAngle : nextAngleClockwise
  }, [])

  // Cancel any in-flight rAF on unmount
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return { canvasRef, applyPattern, updateLayout, updateColors, updateEasing, updateRotation }
}
