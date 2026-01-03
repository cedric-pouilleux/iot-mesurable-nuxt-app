import type { SensorStatus } from '../types/sensor-configuration.types'
import { calculateSensorStatus } from '../utils/status-calculator'

/**
 * Composable for calculating sensor status
 * 
 * Uses interval-aware logic to determine if sensors are ok/missing/unknown
 */
export function useSensorStatus() {
    /**
     * Calculate status for a single sensor
     */
    const getStatus = (
        lastUpdate: Date | string | null,
        intervalSeconds: number
    ): SensorStatus['status'] => {
        return calculateSensorStatus(lastUpdate, intervalSeconds)
    }

    /**
     * Get status color for UI display
     */
    const getStatusColor = (status: SensorStatus['status']): string => {
        switch (status) {
            case 'ok':
                return 'green'
            case 'missing':
                return 'red'
            case 'unknown':
                return 'gray'
            default:
                return 'gray'
        }
    }

    /**
     * Get status label for UI display
     */
    const getStatusLabel = (status: SensorStatus['status']): string => {
        switch (status) {
            case 'ok':
                return 'Connecté'
            case 'missing':
                return 'Déconnecté'
            case 'unknown':
                return 'Inconnu'
            default:
                return 'Inconnu'
        }
    }

    return {
        getStatus,
        getStatusColor,
        getStatusLabel,
    }
}
