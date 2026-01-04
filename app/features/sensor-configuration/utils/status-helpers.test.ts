import { describe, it, expect } from 'vitest'
import {
    getStatusClass,
    getStatusTextClass,
    getStatusLabel,
    getMeasurementVariant
} from './status-helpers'

describe('status-helpers', () => {
    describe('getStatusClass', () => {
        it('should return green background for ok status', () => {
            expect(getStatusClass('ok')).toBe('bg-green-500')
        })

        it('should return red background for missing status', () => {
            expect(getStatusClass('missing')).toBe('bg-red-500')
        })

        it('should return gray background for disabled status', () => {
            expect(getStatusClass('disabled')).toBe('bg-gray-400')
        })

        it('should return gray background for unknown status', () => {
            expect(getStatusClass('unknown')).toBe('bg-gray-400')
        })
    })

    describe('getStatusTextClass', () => {
        it('should return normal text color for ok status', () => {
            expect(getStatusTextClass('ok')).toBe('text-gray-700 dark:text-gray-200')
        })

        it('should return red text color for missing status', () => {
            expect(getStatusTextClass('missing')).toBe('text-red-600 dark:text-red-400')
        })

        it('should return muted text color for disabled status', () => {
            expect(getStatusTextClass('disabled')).toBe('text-gray-400 dark:text-gray-500')
        })

        it('should return muted text color for unknown status', () => {
            expect(getStatusTextClass('unknown')).toBe('text-gray-500 dark:text-gray-400')
        })
    })

    describe('getStatusLabel', () => {
        it('should return "OK" for ok status', () => {
            expect(getStatusLabel('ok')).toBe('OK')
        })

        it('should return descriptive message for missing status', () => {
            expect(getStatusLabel('missing')).toBe('Données anciennes (> 2× interval)')
        })

        it('should return "Arrêté" for disabled status', () => {
            expect(getStatusLabel('disabled')).toBe('Arrêté')
        })

        it('should return "En attente..." for unknown status', () => {
            expect(getStatusLabel('unknown')).toBe('En attente...')
        })
    })

    describe('getMeasurementVariant', () => {
        it('should return success variant for ok status', () => {
            expect(getMeasurementVariant('ok')).toBe('success')
        })

        it('should return error variant for missing status', () => {
            expect(getMeasurementVariant('missing')).toBe('error')
        })

        it('should return error variant for unknown status', () => {
            expect(getMeasurementVariant('unknown')).toBe('error')
        })

        it('should return error variant for any other status', () => {
            expect(getMeasurementVariant('invalid')).toBe('error')
        })
    })
})
