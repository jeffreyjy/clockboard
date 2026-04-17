import type { CSSProperties } from 'react'

export type ClockState = [hand1: number, hand2: number]
export type GridPattern = ClockState[][]

export type StaggerFn = (row: number, col: number) => number

export type ApplyOptions = {
  duration?: number
  easing?: (t: number) => number
  absolute?: boolean
  onComplete?: () => void
  stagger?: StaggerFn
  spinRevolutions?: number
  spinDirection?: 'clockwise' | 'counterclockwise' | 'opposite'
  revolutionDuration?: number
}

export type ApplyPattern = (pattern: GridPattern, durationOrOptions?: number | ApplyOptions) => void
export type Behavior = (apply: ApplyPattern) => () => void

export type SequenceStep = {
  pattern: GridPattern | (() => GridPattern)
  duration?: number
  hold?: number
  easing?: (t: number) => number
  absolute?: boolean
  stagger?: StaggerFn
  spinRevolutions?: number
  spinDirection?: 'clockwise' | 'counterclockwise' | 'opposite'
  revolutionDuration?: number
}

export type SpinOptions = {
  start?: GridPattern
  revolutions?: number
  opposite?: boolean
  revolutionDuration?: number
  easing?: (t: number) => number
  stagger?: StaggerFn
}

export interface ClockBoardProps {
  behavior?: Behavior
  pattern?: GridPattern
  duration?: number
  easing?: 'ease-in-out' | 'linear' | ((t: number) => number)
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
