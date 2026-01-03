import type { SensorConfigUpdate } from '../types/sensor-configuration.types'

/**
 * Service for managing sensor configuration via API
 * This is NOT a composable - it's just plain async functions
 */

/**
 * Update sensor interval
 */
export async function updateSensorInterval(
    moduleId: string,
    sensorType: string,
    intervalSeconds: number
): Promise<boolean> {
    try {
        const update: SensorConfigUpdate = {
            sensorType,
            intervalSeconds,
        }

        const response = await fetch(`/api/modules/${moduleId}/sensors/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        console.log(`Configuration updated: ${sensorType} interval set to ${intervalSeconds}s`)
        return true
    } catch (error) {
        console.error('Failed to update sensor interval:', error)
        return false
    }
}

/**
 * Toggle sensor enabled state
 */
export async function toggleSensorEnabled(
    moduleId: string,
    sensorType: string,
    enabled: boolean
): Promise<boolean> {
    try {
        const response = await fetch(`/api/modules/${moduleId}/sensors/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sensorType,
                enabled,
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        console.log(`Sensor ${enabled ? 'enabled' : 'disabled'}: ${sensorType}`)
        return true
    } catch (error) {
        console.error('Failed to toggle sensor:', error)
        return false
    }
}
