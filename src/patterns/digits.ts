import type { ClockState } from '../types'

export const IDLE: ClockState = [225, 225]

const U = 0, R = 90, D = 180, L = 270, I = 225

export const DIGITS: ClockState[][][] = [
  // 0
  [
    [[R,D],[L,R],[L,R],[L,D]],
    [[U,D],[R,D],[L,D],[U,D]],
    [[U,D],[U,D],[U,D],[U,D]],
    [[U,D],[U,D],[U,D],[U,D]],
    [[U,D],[U,R],[U,L],[U,D]],
    [[R,U],[L,R],[L,R],[L,U]],
  ],
  // 1
  [
    [[R,D],[L,R],[L,D],[I,I]],
    [[U,R],[L,D],[U,D],[I,I]],
    [[I,I],[U,D],[U,D],[I,I]],
    [[I,I],[U,D],[U,D],[I,I]],
    [[R,D],[L,U],[R,U],[L,D]],
    [[R,U],[L,R],[L,R],[L,U]],
  ],
  // 2
  [
    [[R,D],[L,R],[L,R],[L,D]],
    [[R,U],[L,R],[L,D],[U,D]],
    [[R,D],[L,R],[L,U],[U,D]],
    [[U,D],[R,D],[L,R],[L,U]],
    [[U,D],[R,U],[L,R],[L,D]],
    [[R,U],[L,R],[L,R],[L,U]],
  ],
  // 3
  [
    [[R,D],[L,R],[L,R],[L,D]],
    [[R,U],[L,R],[L,D],[U,D]],
    [[R,D],[L,R],[L,U],[U,D]],
    [[R,U],[L,R],[L,D],[U,D]],
    [[R,D],[L,R],[L,U],[U,D]],
    [[R,U],[L,R],[L,R],[L,U]],
  ],
  // 4
  [
    [[R,D],[L,D],[R,D],[L,D]],
    [[U,D],[U,D],[U,D],[U,D]],
    [[U,D],[R,U],[L,U],[U,D]],
    [[R,U],[L,R],[L,D],[U,D]],
    [[I,I],[I,I],[U,D],[U,D]],
    [[I,I],[I,I],[R,U],[L,U]],
  ],
  // 5
  [
    [[R,D],[L,R],[L,R],[L,D]],
    [[U,D],[R,D],[L,R],[L,U]],
    [[U,D],[R,U],[L,R],[L,D]],
    [[R,U],[L,R],[L,D],[U,D]],
    [[R,D],[L,R],[L,U],[U,D]],
    [[R,U],[L,R],[L,R],[L,U]],
  ],
  // 6
  [
    [[R,D],[L,R],[L,R],[L,D]],
    [[U,D],[R,D],[L,R],[L,U]],
    [[U,D],[R,U],[L,R],[L,D]],
    [[U,D],[R,D],[L,D],[U,D]],
    [[U,D],[R,U],[L,U],[U,D]],
    [[R,U],[L,R],[L,R],[L,U]],
  ],
  // 7
  [
    [[R,D],[L,R],[L,R],[L,D]],
    [[R,U],[L,R],[L,D],[U,D]],
    [[I,I],[I,I],[U,D],[U,D]],
    [[I,I],[I,I],[U,D],[U,D]],
    [[I,I],[I,I],[U,D],[U,D]],
    [[I,I],[I,I],[R,U],[L,U]],
  ],
  // 8
  [
    [[R,D],[L,R],[L,R],[L,D]],
    [[U,D],[R,D],[L,D],[U,D]],
    [[U,D],[R,U],[L,U],[U,D]],
    [[U,D],[R,D],[L,D],[U,D]],
    [[U,D],[R,U],[L,U],[U,D]],
    [[R,U],[L,R],[L,R],[L,U]],
  ],
  // 9
  [
    [[R,D],[L,R],[L,R],[L,D]],
    [[U,D],[R,D],[L,D],[U,D]],
    [[U,D],[R,U],[L,U],[U,D]],
    [[R,U],[L,R],[L,D],[U,D]],
    [[I,I],[I,I],[U,D],[U,D]],
    [[I,I],[I,I],[R,U],[L,U]],
  ],
]

export const COLON: ClockState[][] = [
  [[R,D],[D,L]],
  [[U,R],[U,L]],
  [[R,D],[D,L]],
  [[U,R],[U,L]],
]
