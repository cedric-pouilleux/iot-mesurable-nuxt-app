/**
 * Status display helpers for sensor UI
 * 
 * Pure functions that return CSS classes, labels, and variants
 * based on sensor status. Extracted from HardwareSensorRow component.
 */

type SensorStatus = 'ok' | 'missing' | 'unknown' | 'disabled'

/**
 * Get CSS class for status indicator dot background
 */
export function getStatusClass(status: SensorStatus): string {
    switch (status) {
        case 'ok':
            return 'bg-green-500'
        case 'missing':
            return 'bg-red-500'
        case 'disabled':
            return 'bg-gray-400'
        default: // unknown
            return 'bg-gray-400'
    }
}

/**
 * Get CSS class for status text color
 */
export function getStatusTextClass(status: SensorStatus): string {
    switch (status) {
        case 'ok':
            return 'text-gray-700 dark:text-gray-200'
        case 'missing':
            return 'text-red-600 dark:text-red-400'
        case 'disabled':
            return 'text-gray-400 dark:text-gray-500'
        default: // unknown
            return 'text-gray-500 dark:text-gray-400'
    }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: SensorStatus): string {
    switch (status) {
        case 'ok':
            return 'OK'
        case 'missing':
            return 'Données anciennes (> 2× interval)'
        case 'disabled':
            return 'Arrêté'
        default: // unknown
            return 'En attente...'
    }
}

/**
 * Get UITag variant for measurement badge
 */
export function getMeasurementVariant(status: string): 'success' | 'error' {
    switch (status) {
        case 'ok':
            return 'success'
        case 'missing':
        default:
            return 'error'
    }
}
