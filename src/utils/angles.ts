/** Current rotation in degrees from getComputedStyle (includes in-flight WAAPI). */
export function rotationDegFromComputedTransform(el: Element): number {
  const cs = getComputedStyle(el)
  const t = cs.transform || (cs as CSSStyleDeclaration & { webkitTransform?: string }).webkitTransform
  if (!t || t === 'none') return 0
  try {
    const m = new DOMMatrixReadOnly(t)
    return Math.atan2(m.b, m.a) * (180 / Math.PI)
  } catch {
    return 0
  }
}

export function nextAngle(current: number, target: number): number {
  const targetMod  = ((target  % 360) + 360) % 360
  const currentMod = ((current % 360) + 360) % 360
  let delta = targetMod - currentMod
  if (delta > 180)  delta -= 360
  if (delta < -180) delta += 360
  return current + delta
}

export function nextAngleClockwise(current: number, target: number): number {
  const targetMod  = ((target  % 360) + 360) % 360
  const currentMod = ((current % 360) + 360) % 360
  let delta = targetMod - currentMod
  if (delta < 0) delta += 360
  return current + delta
}
