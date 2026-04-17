import { useCallback, useEffect, useRef } from 'react'
import { easeInOut, lerp } from './utils/easing'
import { nextAngle, nextAngleClockwise } from './utils/angles'
import { COLS, DEFAULT_DURATION, FACE_RADIUS, HAND_WIDTH, ROWS } from './config'
import type { ApplyOptions, ApplyPattern, GridPattern } from './types'

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

// ─── Mode 2: cruise phase easing (5% ramp-up, then constant speed) ──────────

const CRUISE_RAMP = 0.05
const CRUISE_VMAX = 1 / (1 - CRUISE_RAMP / 2)

function cruiseEasing(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  if (t < CRUISE_RAMP) {
    const s = t / CRUISE_RAMP
    return CRUISE_VMAX * CRUISE_RAMP * s * s / 2
  }
  return CRUISE_VMAX * (t - CRUISE_RAMP / 2)
}

export function useCanvasBoard() {
  const canvasRef        = useRef<HTMLCanvasElement>(null)
  const prevAnglesRef    = useRef(new Float64Array(TOTAL * 2))
  const targAnglesRef    = useRef(new Float64Array(TOTAL * 2))
  const startTimeRef     = useRef(0)
  const durationRef      = useRef(DEFAULT_DURATION)
  const totalDurationRef = useRef(DEFAULT_DURATION)
  const rafRef           = useRef(0)
  const layoutRef        = useRef<LayoutCache | null>(null)
  const colorsRef        = useRef({ hand: 'white', face: '#141414' })
  const easingFnRef      = useRef<(t: number) => number>(easeInOut)
  const animEasingRef    = useRef<(t: number) => number>(easeInOut)
  const onCompleteRef    = useRef<(() => void) | null>(null)
  const nextAngleFnRef   = useRef<(current: number, target: number) => number>(nextAngleClockwise)
  const staggerRef       = useRef<Float32Array | null>(null)

  // Mode 2 refs (null = mode 1)
  const midAnglesRef     = useRef<Float64Array | null>(null)
  const cruiseSpeedRef   = useRef(0)
  const cruiseEndMsRef   = useRef(0)

  // ─── Drawing ──────────────────────────────────────────────────────────────

  const drawFrame = useCallback((elapsed: number) => {
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
    const stag = staggerRef.current
    const duration = durationRef.current
    const easingFn = animEasingRef.current
    const mid = midAnglesRef.current
    const cruiseSpeed = cruiseSpeedRef.current
    const cruiseEnd = cruiseEndMsRef.current

    // Mode 1 fast path: precompute global easedT when no stagger and no mode 2
    const globalEasedT = (!stag && mid === null)
      ? easingFn(Math.max(0, Math.min(elapsed / duration, 1)))
      : 0

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    const TAU = Math.PI * 2
    const DEG_TO_RAD = Math.PI / 180

    for (let i = 0; i < TOTAL; i++) {
      const delay = stag ? stag[i] : 0
      const localElapsed = elapsed - delay

      let a1: number
      let a2: number

      if (mid === null) {
        // Mode 1: single lerp (current behavior)
        const easedT = stag
          ? easingFn(Math.max(0, Math.min(localElapsed / duration, 1)))
          : globalEasedT
        a1 = lerp(prev[i * 2],     targ[i * 2],     easedT) * DEG_TO_RAD
        a2 = lerp(prev[i * 2 + 1], targ[i * 2 + 1], easedT) * DEG_TO_RAD
      } else {
        // Mode 2: uniform cruise + per-hand deceleration
        a1 = twoPhase(localElapsed, prev[i * 2],     mid[i * 2],     targ[i * 2],     cruiseEnd, cruiseSpeed) * DEG_TO_RAD
        a2 = twoPhase(localElapsed, prev[i * 2 + 1], mid[i * 2 + 1], targ[i * 2 + 1], cruiseEnd, cruiseSpeed) * DEG_TO_RAD
      }

      const cx = centers[i * 2]
      const cy = centers[i * 2 + 1]

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
    const elapsed = timestamp - startTimeRef.current
    const done = elapsed >= totalDurationRef.current

    drawFrame(elapsed)

    if (!done) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      rafRef.current = 0
      const cb = onCompleteRef.current
      onCompleteRef.current = null
      if (cb) cb()
    }
  }, [drawFrame])

  // ─── Public API ───────────────────────────────────────────────────────────

  const applyPattern: ApplyPattern = useCallback(
    (pattern: GridPattern, durationOrOptions?: number | ApplyOptions) => {
      const opts: ApplyOptions = typeof durationOrOptions === 'number'
        ? { duration: durationOrOptions }
        : durationOrOptions ?? {}

      const duration = opts.duration ?? DEFAULT_DURATION

      const prev = prevAnglesRef.current
      const targ = targAnglesRef.current

      // Previous action is complete (enforced by onComplete). Copy final targets to prev
      // and normalize to [0, 360) so the next action starts from a clean baseline.
      prev.set(targ)
      for (let i = 0; i < prev.length; i++) {
        const n = ((prev[i] % 360) + 360) % 360
        prev[i] = n
        targ[i] = n
      }

      // Reset mode 2 refs (default to mode 1)
      midAnglesRef.current = null

      if (opts.spinRevolutions !== undefined && opts.spinRevolutions > 0) {
        // ── Mode 2: uniform cruise + per-hand landing ──────────────────────
        const dirMode = opts.spinDirection ?? 'clockwise'
        const spinDeg = opts.spinRevolutions * 360
        const midArr = new Float64Array(TOTAL * 2)

        // Compute mid: uniform spin endpoint
        // For 'opposite': even indices (minute) CW, odd indices (hour) CCW
        for (let i = 0; i < prev.length; i++) {
          if (dirMode === 'opposite') {
            midArr[i] = prev[i] + (i % 2 === 0 ? 1 : -1) * spinDeg
          } else {
            midArr[i] = prev[i] + (dirMode === 'counterclockwise' ? -1 : 1) * spinDeg
          }
        }

        // Compute targ: delta from mid to pattern target (matching each hand's spin direction)
        let maxRemaining = 0
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c
            const [target1, target2] = pattern[r][c]
            const midNorm1 = ((midArr[i * 2]     % 360) + 360) % 360
            const midNorm2 = ((midArr[i * 2 + 1] % 360) + 360) % 360
            const tNorm1   = ((target1 % 360) + 360) % 360
            const tNorm2   = ((target2 % 360) + 360) % 360

            // Minute hand direction: CW unless counterclockwise
            const min_ccw = dirMode === 'counterclockwise'
            // Hour hand direction: CCW if opposite, CCW if counterclockwise, else CW
            const hr_ccw  = dirMode === 'opposite' || dirMode === 'counterclockwise'

            let delta1: number, delta2: number
            if (min_ccw) {
              delta1 = midNorm1 - tNorm1; if (delta1 <= 0) delta1 += 360
              targ[i * 2] = midArr[i * 2] - delta1
            } else {
              delta1 = tNorm1 - midNorm1; if (delta1 <= 0) delta1 += 360
              targ[i * 2] = midArr[i * 2] + delta1
            }
            if (hr_ccw) {
              delta2 = midNorm2 - tNorm2; if (delta2 <= 0) delta2 += 360
              targ[i * 2 + 1] = midArr[i * 2 + 1] - delta2
            } else {
              delta2 = tNorm2 - midNorm2; if (delta2 <= 0) delta2 += 360
              targ[i * 2 + 1] = midArr[i * 2 + 1] + delta2
            }
            if (delta1 > maxRemaining) maxRemaining = delta1
            if (delta2 > maxRemaining) maxRemaining = delta2
          }
        }

        // Compute timing from revolutionDuration
        const revDur = opts.revolutionDuration ?? 10000
        const v = 360 / revDur                               // degrees per ms
        const cruiseEnd = opts.spinRevolutions! * revDur      // ms
        const maxLandingMs = maxRemaining > 0 ? 2 * maxRemaining / v : 0
        durationRef.current    = cruiseEnd + maxLandingMs
        totalDurationRef.current = durationRef.current

        midAnglesRef.current   = midArr
        cruiseSpeedRef.current = v
        cruiseEndMsRef.current = cruiseEnd

      } else {
        // ── Mode 1: standard single lerp ───────────────────────────────────
        const absolute = opts.absolute ?? false

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c
            const [target1, target2] = pattern[r][c]

            if (absolute) {
              targ[i * 2]     = target1
              targ[i * 2 + 1] = target2
            } else {
              const next1 = nextAngleFnRef.current(prev[i * 2],     target1)
              const next2 = nextAngleFnRef.current(prev[i * 2 + 1], target2)
              if (Math.abs(next1 - prev[i * 2]) < 0.5 && Math.abs(next2 - prev[i * 2 + 1]) < 0.5) continue
              targ[i * 2]     = next1
              targ[i * 2 + 1] = next2
            }
          }
        }
      }

      // Mode 1: set duration from opts (mode 2 already set it above)
      if (midAnglesRef.current === null) {
        durationRef.current = duration
      }

      // Compute per-clock stagger delays
      const actionDuration = durationRef.current
      if (opts.stagger) {
        const delays = new Float32Array(TOTAL)
        let maxDelay = 0
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const d = opts.stagger(r, c)
            delays[r * COLS + c] = d
            if (d > maxDelay) maxDelay = d
          }
        }
        staggerRef.current       = delays
        totalDurationRef.current = actionDuration + maxDelay
      } else {
        staggerRef.current       = null
        totalDurationRef.current = actionDuration
      }

      animEasingRef.current  = opts.easing ?? easingFnRef.current
      onCompleteRef.current  = opts.onComplete ?? null
      startTimeRef.current   = performance.now()

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
    drawFrame(elapsed)
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

// ─── Mode 2 helper: two-phase angle computation ────────────────────────────

function twoPhase(
  localElapsed: number,
  prev: number,
  mid: number,
  targ: number,
  cruiseEnd: number,
  cruiseSpeed: number,
): number {
  if (localElapsed <= 0) return prev
  if (localElapsed <= cruiseEnd) {
    return lerp(prev, mid, cruiseEasing(localElapsed / cruiseEnd))
  }
  const remaining = targ - mid
  if (Math.abs(remaining) < 0.5) return targ
  const handLandDur = 2 * Math.abs(remaining) / cruiseSpeed
  const landElapsed = localElapsed - cruiseEnd
  if (landElapsed >= handLandDur) return targ
  const lt = landElapsed / handLandDur
  return mid + remaining * (2 * lt - lt * lt)
}
