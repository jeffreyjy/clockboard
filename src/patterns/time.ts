import { COLS, ROWS } from '../config'
import type { ClockState, GridPattern } from '../types'
import { COLON, DIGITS, IDLE } from './digits'

function placeBlock(grid: GridPattern, block: ClockState[][], startRow: number, startCol: number) {
  for (let r = 0; r < block.length; r++) {
    for (let c = 0; c < block[r].length; c++) {
      grid[startRow + r][startCol + c] = block[r][c]
    }
  }
}

export function composeTime(hours: number, minutes: number): GridPattern {
  const grid: GridPattern = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, (): ClockState => [...IDLE])
  )

  const h1 = Math.floor(hours / 10) % 10
  const h2 = hours % 10
  const m1 = Math.floor(minutes / 10) % 10
  const m2 = minutes % 10

  placeBlock(grid, DIGITS[h1], 1, 1)
  placeBlock(grid, DIGITS[h2], 1, 5)
  placeBlock(grid, COLON, 2, 9)
  placeBlock(grid, DIGITS[m1], 1, 11)
  placeBlock(grid, DIGITS[m2], 1, 15)

  return grid
}
