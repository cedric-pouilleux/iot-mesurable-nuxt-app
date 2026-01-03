

import { ref, type Ref } from 'vue'
import { useModuleStorage } from './useModuleStorage'
import { HARDWARE_SENSORS } from '../config/hardwareSensors'

export function useSensorConfiguration(moduleId: Ref<string>) {
    // State for optimistic UI updates
    const intervalOverrides = ref<Record<string, number>>({})
    const enabledOverrides = ref<Record<string, boolean>>({})

    // Storage Integration
    const { fetchStorageStats, projections: calculateProjections } = useModuleStorage(moduleId)

    // Computed Projections (Live)
    const projectionsData = calculateProjections(intervalOverrides, enabledOverrides)

    /**
     * Helper to update overrides for both the simple sensor key (e.g., 'co2') 
     * and the composite key (e.g., 'mhz14a:co2') to ensure backend compatibility.
     */
    const updateOverrides = <T>(
        hardwareKey: string,
        value: T,
        targetMap: Record<string, T>
    ) => {
        const hwDef = HARDWARE_SENSORS.find(h => h.hardwareKey === hardwareKey)
        if (!hwDef) return

        hwDef.measurements.forEach(sensorType => {
            targetMap[sensorType] = value
            targetMap[`${hardwareKey}:${sensorType}`] = value
        })
    }

    // Actions
    const updateInterval = (hardwareKey: string, newInterval: number) => {
        updateOverrides(hardwareKey, newInterval, intervalOverrides.value)
    }

    const updateEnabled = (hardwareKey: string, isEnabled: boolean) => {
        // Trigger server-side update first/concurrently (handled by component or here?)
        // Component calls HardwareSensorRow -> emits event -> Component updates local state + fetches new stats.
        // fetchStorageStats is essentially "refresh valid state from server".
        fetchStorageStats()

        // Update local optimistic state
        updateOverrides(hardwareKey, isEnabled, enabledOverrides.value)
    }

    return {
        intervalOverrides,
        enabledOverrides,
        projectionsData,
        updateInterval,
        updateEnabled,
        fetchStorageStats // Expose if needed for manual refresh
    }
}
