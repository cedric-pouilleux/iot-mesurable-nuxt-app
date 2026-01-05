import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface SensorHealth {
    sensorType: string
    hardwareId?: string
    status: 'connected' | 'stale' | 'offline'
    lastMeasurement: string | null
    timeSinceLastMeasurement: number | null
    expectedIntervalSeconds: number | null
    gapCount: number
    longestGapMinutes: number | null
}

export interface DeviceHealth {
    moduleId: string
    overallStatus: 'healthy' | 'degraded' | 'offline'
    uptimePercent24h: number
    sensors: SensorHealth[]
    lastUpdate: string
}

export interface UseDeviceHealthReturn {
    health: Ref<DeviceHealth | null>
    isLoading: Ref<boolean>
    error: Ref<Error | null>
    refresh: () => Promise<void>
    getSensorHealth: (sensorKey: string) => SensorHealth | null
    getConnectionStatus: (sensorKey: string) => 'connected' | 'stale' | 'offline' | 'unknown'
    getTimeSinceLastMeasurement: (sensorKey: string) => string | null
}

// Global cache to share health data across multiple components for the same module
const healthCache = new Map<string, {
    health: Ref<DeviceHealth | null>
    isLoading: Ref<boolean>
    error: Ref<Error | null>
    lastFetch: number
    refreshPromise: Promise<void> | null
}>()

// Cleanup interval to remove stale cache entries
if (process.client) {
    setInterval(() => {
        const now = Date.now()
        for (const [key, cache] of healthCache.entries()) {
            // Remove entries older than 5 minutes
            if (now - cache.lastFetch > 5 * 60 * 1000) {
                healthCache.delete(key)
            }
        }
    }, 60000) // Check every minute
}

/**
 * Composable to fetch and track device health status
 * Auto-refreshes every 30 seconds
 * Uses shared cache to prevent duplicate requests for the same module
 */
export function useDeviceHealth(moduleId: Ref<string> | string): UseDeviceHealthReturn {
    const moduleIdValue = computed(() => {
        return typeof moduleId === 'string' ? moduleId : moduleId.value
    })

    // Get or create cache entry for this module
    const getCacheEntry = () => {
        const id = moduleIdValue.value
        if (!healthCache.has(id)) {
            healthCache.set(id, {
                health: ref<DeviceHealth | null>(null),
                isLoading: ref(false),
                error: ref<Error | null>(null),
                lastFetch: 0,
                refreshPromise: null,
            })
        }
        return healthCache.get(id)!
    }

    const cache = computed(() => getCacheEntry())

    const fetchHealth = async () => {
        if (!moduleIdValue.value) return

        const entry = cache.value

        // If already fetching, wait for that promise
        if (entry.refreshPromise) {
            await entry.refreshPromise
            return
        }

        // If fetched recently (< 5 seconds ago), skip
        const now = Date.now()
        if (now - entry.lastFetch < 5000) {
            return
        }

        try {
            entry.isLoading.value = true
            entry.error.value = null

            entry.refreshPromise = $fetch<DeviceHealth>(`/api/modules/${moduleIdValue.value}/health`)
                .then((data) => {
                    entry.health.value = data
                    entry.lastFetch = Date.now()
                })
                .catch((e) => {
                    entry.error.value = e as Error
                    console.error('Failed to fetch device health:', e)
                })
                .finally(() => {
                    entry.isLoading.value = false
                    entry.refreshPromise = null
                })

            await entry.refreshPromise
        } catch (e) {
            // Error already handled in promise chain
        }
    }

    /**
     * Get health status for a specific sensor by composite key
     * @param sensorKey - Composite key format: "hardware:sensorType" (e.g., "scd41:co2")
     */
    const getSensorHealth = (sensorKey: string): SensorHealth | null => {
        if (!cache.value.health.value) return null

        // sensorKey might be "scd41:co2" or just "co2"
        // Try exact match first
        const exactMatch = cache.value.health.value.sensors.find((s) => s.sensorType === sensorKey)
        if (exactMatch) return exactMatch

        // Try matching by sensor type only (last part of composite key)
        const sensorType = sensorKey.includes(':') ? sensorKey.split(':')[1] : sensorKey
        return cache.value.health.value.sensors.find((s) => s.sensorType.endsWith(`:${sensorType}`)) || null
    }

    /**
     * Get connection status for a sensor
     */
    const getConnectionStatus = (sensorKey: string): 'connected' | 'stale' | 'offline' | 'unknown' => {
        const sensorHealth = getSensorHealth(sensorKey)
        return sensorHealth?.status || 'unknown'
    }

    /**
     * Get human-readable time since last measurement
     */
    const getTimeSinceLastMeasurement = (sensorKey: string): string | null => {
        const sensorHealth = getSensorHealth(sensorKey)
        if (!sensorHealth || !sensorHealth.timeSinceLastMeasurement) return null

        const ms = sensorHealth.timeSinceLastMeasurement
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days}j`
        if (hours > 0) return `${hours}h`
        if (minutes > 0) return `${minutes}m`
        return `${seconds}s`
    }

    const refresh = async () => {
        await fetchHealth()
    }

    // Auto-refresh every 30 seconds (only start one interval per module)
    onMounted(() => {
        fetchHealth()

        // Only set up interval if this is the first component for this module
        const entry = cache.value
        if (!entry.lastFetch) { // A simple heuristic to check if it's the first time this module is mounted
            const intervalId = setInterval(fetchHealth, 30000)

            onUnmounted(() => {
                clearInterval(intervalId)
            })
        }
    })

    return {
        health: cache.value.health,
        isLoading: cache.value.isLoading,
        error: cache.value.error,
        refresh,
        getSensorHealth,
        getConnectionStatus,
        getTimeSinceLastMeasurement,
    }
}
