import { computed, type Ref } from 'vue'
import type { SensorDataPoint } from '~/features/modules/common/types'

/**
 * Composable for resolving sensor history data
 * 
 * Handles the complex logic of finding sensor data by:
 * 1. Trying composite key (hardware:measurement)
 * 2. Falling back to simple measurement key
 * 
 * This logic was previously duplicated in timeAgo and computedStatus.
 */
export function useHardwareSensorHistory(
    hardwareKey: Ref<string>,
    measureKey: Ref<string>,
    sensorHistoryMap: Ref<Record<string, SensorDataPoint[]>>
) {
    /**
     * Resolved sensor history array
     */
    const history = computed<SensorDataPoint[]>(() => {
        const key = measureKey.value
        if (!key) return []

        // 1. Try composite key (hardware:measurement)
        const compositeKey = `${hardwareKey.value}:${key}`
        let data = sensorHistoryMap.value?.[compositeKey]

        // 2. Fallback to simple key (for backward compatibility)
        if ((!data || data.length === 0) && !key.includes(':')) {
            data = sensorHistoryMap.value?.[key]
        }

        return data || []
    })

    /**
     * Last update timestamp from history
     * History is sorted ASC (oldest first), so take the last element
     */
    const lastUpdate = computed<Date | null>(() => {
        const data = history.value
        if (!data || data.length === 0) return null
        return data[data.length - 1].time
    })

    return {
        history,
        lastUpdate
    }
}
