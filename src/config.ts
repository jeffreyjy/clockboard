// ─── Grid ────────────────────────────────────────────────────────────────────
// NEVER CHANGE — all digit patterns, behaviors, and layout math are hardcoded for 20×8.
export const COLS = 20
export const ROWS = 8

// ─── Colors ──────────────────────────────────────────────────────────────────
export const BOARD_COLOR = '#171717'
export const CLOCK_COLOR = '#141414'
export const HAND_COLOR  = 'white'

// ─── Layout ──────────────────────────────────────────────────────────────────
export const BOARD_PADDING    = '4%'
export const BOARD_RADIUS     = 8       // px
export const CLOCK_GAP        = '0.25%'
export const CLOCK_FACE_INSET = '6%'   // gap between cell edge and clock face

// ─── Hand geometry (SVG viewBox units, 0–100) ────────────────────────────────
export const HAND_WIDTH  = 10
export const FACE_RADIUS = 50          // fixed: half of 100×100 viewBox

// ─── Animation ───────────────────────────────────────────────────────────────
export const DEFAULT_DURATION = 5000   // ms; overridable per applyPattern() call
export const ANIMATION_EASING = 'ease-in-out'
export const CYCLE_HOLD       = 5000   // ms pause after animation ends before next pattern
