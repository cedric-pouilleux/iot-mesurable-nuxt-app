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
        // Backend expects: { sensors: { [hardware_key]: { interval: number } } }
        const payload = {
            sensors: {
                [sensorType]: {
                    interval: intervalSeconds
                }
            }
        }

        const response = await fetch(`/api/modules/${moduleId}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
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
        const response = await fetch(`/api/modules/${moduleId}/hardware/enable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hardware: sensorType,
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

/**
 * Reset (reboot) a hardware sensor
 */
export async function resetSensor(
    moduleId: string,
    sensorKey: string
): Promise<boolean> {
    try {
        const response = await fetch(`/api/modules/${encodeURIComponent(moduleId)}/reset-sensor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor: sensorKey }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        return data.success === true
    } catch (error) {
        console.error('Failed to reset sensor:', error)
        return false
    }
}
