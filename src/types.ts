import type { CSSProperties } from 'react'

export type ClockState = [hand1: number, hand2: number]
export type GridPattern = ClockState[][]

export type ApplyPattern = (pattern: GridPattern, duration?: number) => void
export type Behavior = (apply: ApplyPattern) => () => void

export interface ClockBoardProps {
  behavior?: Behavior
  pattern?: GridPattern
  duration?: number
  easing?: 'ease-in-out' | 'linear'
  rotation?: 'clockwise' | 'shortest'

  handColor?: string
  faceColor?: string
  boardColor?: string
  boardPadding?: string
  boardRadius?: number
  clockGap?: string

  className?: string
  style?: CSSProperties
}
