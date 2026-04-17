import { COLS, ROWS } from '../config'

const CX = (COLS - 1) / 2
const CY = (ROWS - 1) / 2
const MAX_DIST = Math.sqrt(CX * CX + CY * CY)

/** Clocks animate left to right. */
export function leftToRight(maxDelay: number): (row: number, col: number) => number {
  return (_r, c) => (c / (COLS - 1)) * maxDelay
}

/** Clocks animate right to left. */
export function rightToLeft(maxDelay: number): (row: number, col: number) => number {
  return (_r, c) => ((COLS - 1 - c) / (COLS - 1)) * maxDelay
}

/** Clocks animate top to bottom. */
export function topToBottom(maxDelay: number): (row: number, col: number) => number {
  return (r, _c) => (r / (ROWS - 1)) * maxDelay
}

/** Clocks animate bottom to top. */
export function bottomToTop(maxDelay: number): (row: number, col: number) => number {
  return (r, _c) => ((ROWS - 1 - r) / (ROWS - 1)) * maxDelay
}

/** Clocks animate outward from the center of the grid. */
export function centerOut(maxDelay: number): (row: number, col: number) => number {
  return (r, c) => (Math.sqrt((c - CX) ** 2 + (r - CY) ** 2) / MAX_DIST) * maxDelay
}

/** Clocks animate inward from the edges to the center. */
export function edgesIn(maxDelay: number): (row: number, col: number) => number {
  return (r, c) => (1 - Math.sqrt((c - CX) ** 2 + (r - CY) ** 2) / MAX_DIST) * maxDelay
}

/** Each clock gets a random delay. */
export function randomStagger(maxDelay: number): (row: number, col: number) => number {
  const delays = new Float32Array(ROWS * COLS)
  for (let i = 0; i < delays.length; i++) delays[i] = Math.random() * maxDelay
  return (r, c) => delays[r * COLS + c]
}
