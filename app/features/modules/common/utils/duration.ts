export function isDurationSmallerThan(durationStart: string, durationEnd: string): boolean {
  const getDurationHours = (duration: string) => {
    if (duration === '1h') return 1
    if (duration === '6h') return 6
    if (duration === '12h') return 12
    if (duration === '24h') return 24
    if (duration === '7j') return 7 * 24
    return 24
  }
  const newHours = getDurationHours(durationStart)
  const maxHours = getDurationHours(durationEnd)
  return newHours <= maxHours
}
