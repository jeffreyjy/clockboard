/** Pick a random item from an array. */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Pick a random item, excluding one value. */
export function pickExcept<T>(arr: T[], exclude: T | null): T {
  if (arr.length <= 1) return arr[0]
  let item: T
  do { item = pick(arr) } while (item === exclude)
  return item
}

/** Pick from weighted options. Items and weights arrays must be the same length. */
export function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

/** Random integer in [min, max] inclusive. */
export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/** Random float in [min, max). */
export function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}
