/**
 * Calculate sensor status based on interval-aware logic
 * 
 * This is a pure function that can be tested independently.
 * 
 * Rules:
 * - If never received data (no timestamp) → 'unknown'
 * - If no data for more than 2× interval + 10s grace → 'missing'
 * - Otherwise → 'ok'
 */
export function calculateSensorStatus(
    lastUpdate: Date | string | null,
    intervalSeconds: number,
    now: number = Date.now()
): 'ok' | 'missing' | 'unknown' {
    const GRACE_PERIOD_MS = 10000  // 10 seconds
    const DEFAULT_INTERVAL_S = 60   // Default 60s

    // Never received data
    if (!lastUpdate) {
        return 'unknown'
    }

    const interval = intervalSeconds || DEFAULT_INTERVAL_S
    const timeoutMs = (interval * 2 * 1000) + GRACE_PERIOD_MS

    const lastUpdateMs = typeof lastUpdate === 'string'
        ? new Date(lastUpdate).getTime()
        : lastUpdate.getTime()

    const elapsed = now - lastUpdateMs

    // Timeout exceeded
    if (elapsed > timeoutMs) {
        return 'missing'
    }

    // Within timeout
    return 'ok'
}

/**
 * Validate interval value
 */
export function validateInterval(interval: number): boolean {
    const MIN_INTERVAL = 10   // 10 seconds
    const MAX_INTERVAL = 300  // 5 minutes

    return interval >= MIN_INTERVAL && interval <= MAX_INTERVAL
}

/**
 * Format interval for display
 */
export function formatInterval(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) {
        return `${minutes}min`
    }
    return `${minutes}min ${remainingSeconds}s`
}
