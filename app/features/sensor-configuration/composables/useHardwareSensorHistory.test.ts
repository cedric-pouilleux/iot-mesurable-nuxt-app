import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useHardwareSensorHistory } from './useHardwareSensorHistory'

describe('useHardwareSensorHistory', () => {
    it('should return empty array when no sensor history available', () => {
        const hardwareKey = ref('BME280')
        const measureKey = ref('temperature')
        const sensorHistoryMap = ref({})

        const { history, lastUpdate } = useHardwareSensorHistory(
            hardwareKey,
            measureKey,
            sensorHistoryMap
        )

        expect(history.value).toEqual([])
        expect(lastUpdate.value).toBeNull()
    })

    it('should resolve history using composite key', () => {
        const hardwareKey = ref('BME280')
        const measureKey = ref('temperature')
        const sensorHistoryMap = ref({
            'BME280:temperature': [
                { time: new Date('2024-01-01T10:00:00Z'), value: 20.5 },
                { time: new Date('2024-01-01T10:01:00Z'), value: 21.0 }
            ]
        })

        const { history, lastUpdate } = useHardwareSensorHistory(
            hardwareKey,
            measureKey,
            sensorHistoryMap
        )

        expect(history.value).toHaveLength(2)
        expect(history.value[0].value).toBe(20.5)
        expect(history.value[1].value).toBe(21.0)
        expect(lastUpdate.value).toEqual(new Date('2024-01-01T10:01:00Z'))
    })

    it('should fallback to simple key when composite key not found', () => {
        const hardwareKey = ref('BME280')
        const measureKey = ref('temperature')
        const sensorHistoryMap = ref({
            'temperature': [
                { time: new Date('2024-01-01T11:00:00Z'), value: 22.0 }
            ]
        })

        const { history, lastUpdate } = useHardwareSensorHistory(
            hardwareKey,
            measureKey,
            sensorHistoryMap
        )

        expect(history.value).toHaveLength(1)
        expect(history.value[0].value).toBe(22.0)
        expect(lastUpdate.value).toEqual(new Date('2024-01-01T11:00:00Z'))
    })

    it('should not fallback to simple key if measure key contains colon', () => {
        const hardwareKey = ref('BME280')
        const measureKey = ref('BME280:temperature')
        const sensorHistoryMap = ref({
            'temperature': [
                { time: new Date('2024-01-01T11:00:00Z'), value: 22.0 }
            ]
        })

        const { history, lastUpdate } = useHardwareSensorHistory(
            hardwareKey,
            measureKey,
            sensorHistoryMap
        )

        // Should not find simple key because measureKey already has a colon
        expect(history.value).toEqual([])
        expect(lastUpdate.value).toBeNull()
    })

    it('should prefer composite key over simple key', () => {
        const hardwareKey = ref('BME280')
        const measureKey = ref('temperature')
        const sensorHistoryMap = ref({
            'BME280:temperature': [
                { time: new Date('2024-01-01T12:00:00Z'), value: 25.0 }
            ],
            'temperature': [
                { time: new Date('2024-01-01T11:00:00Z'), value: 20.0 }
            ]
        })

        const { history, lastUpdate } = useHardwareSensorHistory(
            hardwareKey,
            measureKey,
            sensorHistoryMap
        )

        // Should use composite key, not simple key
        expect(history.value).toHaveLength(1)
        expect(history.value[0].value).toBe(25.0)
        expect(lastUpdate.value).toEqual(new Date('2024-01-01T12:00:00Z'))
    })

    it('should return last element from sorted history array', () => {
        const hardwareKey = ref('BME280')
        const measureKey = ref('temperature')
        const sensorHistoryMap = ref({
            'BME280:temperature': [
                { time: new Date('2024-01-01T09:00:00Z'), value: 18.0 },
                { time: new Date('2024-01-01T10:00:00Z'), value: 19.0 },
                { time: new Date('2024-01-01T11:00:00Z'), value: 20.0 },
                { time: new Date('2024-01-01T12:00:00Z'), value: 21.0 }
            ]
        })

        const { lastUpdate } = useHardwareSensorHistory(
            hardwareKey,
            measureKey,
            sensorHistoryMap
        )

        // Should return the last (most recent) timestamp
        expect(lastUpdate.value).toEqual(new Date('2024-01-01T12:00:00Z'))
    })

    it('should handle empty measure key', () => {
        const hardwareKey = ref('BME280')
        const measureKey = ref('')
        const sensorHistoryMap = ref({
            'BME280:temperature': [
                { time: new Date('2024-01-01T10:00:00Z'), value: 20.5 }
            ]
        })

        const { history, lastUpdate } = useHardwareSensorHistory(
            hardwareKey,
            measureKey,
            sensorHistoryMap
        )

        expect(history.value).toEqual([])
        expect(lastUpdate.value).toBeNull()
    })

    it('should reactively update when sensor history map changes', () => {
        const hardwareKey = ref('BME280')
        const measureKey = ref('temperature')
        const sensorHistoryMap = ref({})

        const { history, lastUpdate } = useHardwareSensorHistory(
            hardwareKey,
            measureKey,
            sensorHistoryMap
        )

        expect(history.value).toEqual([])
        expect(lastUpdate.value).toBeNull()

        // Update the map
        sensorHistoryMap.value = {
            'BME280:temperature': [
                { time: new Date('2024-01-01T10:00:00Z'), value: 20.5 }
            ]
        }

        // Should reactively update
        expect(history.value).toHaveLength(1)
        expect(lastUpdate.value).toEqual(new Date('2024-01-01T10:00:00Z'))
    })
})
