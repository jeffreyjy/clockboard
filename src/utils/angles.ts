export function nextAngle(current: number, target: number): number {
  const targetMod  = ((target  % 360) + 360) % 360
  const currentMod = ((current % 360) + 360) % 360
  let delta = targetMod - currentMod
  if (delta > 180)  delta -= 360
  if (delta < -180) delta += 360
  return current + delta
}
