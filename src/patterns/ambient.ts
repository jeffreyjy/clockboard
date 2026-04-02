import { COLS, ROWS } from '../config'
import type { ClockState, GridPattern } from '../types'

const CX = (COLS - 1) / 2  // 9.5 — grid center column
const CY = (ROWS - 1) / 2  // 3.5 — grid center row

function grid(fn: (row: number, col: number) => ClockState): GridPattern {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => fn(r, c))
  )
}

/** Both hands at 12 o'clock — clean reset position */
export const NOON: GridPattern = grid(() => [0, 0])

/** Every hand at a random angle — unique each call */
export function randomPattern(): GridPattern {
  return grid(() => [Math.random() * 360, Math.random() * 360])
}

/** Hands radiate outward from the grid center — starburst */
export const RADIAL: GridPattern = grid((r, c) => {
  const angle = Math.atan2(c - CX, r - CY) * (180 / Math.PI) + 90
  return [angle, angle + 180]
})

/** All hands pointing inward toward the grid center — vortex sink */
export const CONVERGE: GridPattern = grid((r, c) => {
  const angle = Math.atan2(c - CX, r - CY) * (180 / Math.PI) + 90
  return [angle + 180, angle]
})

/** Checkerboard of vertical bars and horizontal bars */
export const CHECKERBOARD: GridPattern = grid((r, c) =>
  (r + c) % 2 === 0 ? [0, 180] : [90, 270]
)

/** Sine wave: hands follow a wave undulating across columns (2 full cycles) */
export const WAVE: GridPattern = grid((_, c) => {
  const angle = Math.sin((c / COLS) * Math.PI * 4) * 70
  return [angle, angle + 180]
})

/** Radial direction twisted by distance — galaxy spiral */
export const VORTEX: GridPattern = grid((r, c) => {
  const dx = c - CX, dy = r - CY
  const dist  = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dx, -dy) * (180 / Math.PI) + dist * 18
  return [angle, angle + 180]
})

/** Hands tangential to the radial direction — pinwheel */
export const PINWHEEL: GridPattern = grid((r, c) => {
  const base = Math.atan2(c - CX, r - CY) * (180 / Math.PI) + 90
  return [base + 45, base - 45]
})

/** Angle grows with distance from center — concentric rings */
export const RINGS: GridPattern = grid((r, c) => {
  const dist  = Math.sqrt((c - CX) ** 2 + (r - CY) ** 2)
  const angle = dist * 30
  return [angle, angle + 180]
})

/** Concentric rectangles from border to center — 90° corners, straight edges */
export const CONCENTRIC_RECTS: GridPattern = grid((r, c) => {
  const layer = Math.min(r, c, ROWS - 1 - r, COLS - 1 - c)
  const onTop    = r === layer
  const onBottom = r === ROWS - 1 - layer
  const onLeft   = c === layer
  const onRight  = c === COLS - 1 - layer

  if (onTop && onLeft)     return [90, 180]
  if (onTop && onRight)    return [180, 270]
  if (onBottom && onRight) return [0, 270]
  if (onBottom && onLeft)  return [0, 90]
  if (onTop || onBottom)   return [90, 270]
  if (onLeft || onRight)   return [0, 180]
  return [0, 0]
})

/** Alternating X and + shapes — 90° hands everywhere, woven texture */
export const CROSS_STITCH: GridPattern = grid((r, c) =>
  (r + c) % 2 === 0 ? [45, 135] : [0, 90]
)

/** Hands splay wider with distance from center — flower opening */
export const BLOOM: GridPattern = grid((r, c) => {
  const dx = c - CX, dy = r - CY
  const dist  = Math.sqrt(dx * dx + dy * dy)
  const max   = Math.sqrt(CX * CX + CY * CY)
  const angle = Math.atan2(dx, -dy) * (180 / Math.PI)
  const spread = (dist / max) * 90
  return [angle - spread / 2, angle + spread / 2]
})

/** Rows of V-shapes alternating direction */
export const CHEVRONS: GridPattern = grid((r) =>
  r % 2 === 0 ? [60, 120] : [240, 300]
)

/** Spiral with visible arm width — twisted V-shapes follow the curve */
export const SPIRAL_ARMS: GridPattern = grid((r, c) => {
  const dx = c - CX, dy = r - CY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const base = Math.atan2(dx, -dy) * (180 / Math.PI) + dist * 25
  return [base - 30, base + 30]
})

/** 2x2 repeating windmill — each cell 60° spread, neighbors rotated 90° */
export const WINDMILL: GridPattern = grid((r, c) => {
  const base = ((r % 2) * 2 + (c % 2)) * 90
  return [base, base + 60]
})

export const ALL_PATTERNS: GridPattern[] = [
  NOON, RADIAL, CONVERGE, CHECKERBOARD, WAVE, VORTEX,
  PINWHEEL, RINGS, CONCENTRIC_RECTS, CROSS_STITCH,
  BLOOM, CHEVRONS, SPIRAL_ARMS, WINDMILL,
]
