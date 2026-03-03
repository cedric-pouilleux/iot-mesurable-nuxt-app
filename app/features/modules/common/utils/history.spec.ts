import { describe, it, expect } from 'vitest'
import { extractHistoryForGroup } from './history'
import type { SensorDataPoint } from '../types'

describe('extractHistoryForGroup', () => {
  it('should extract history data for only the sensors in the specified group', () => {
    // Arrange
    const globalHistoryMap: Record<string, SensorDataPoint[]> = {
      pm1_0: [
        { time: new Date('2023-01-01'), value: 10 },
        { time: new Date('2023-01-02'), value: 12 },
      ],
      pm25_0: [{ time: new Date('2023-01-01'), value: 25 }],
      temperature_0: [{ time: new Date('2023-01-01'), value: 20 }],
    }

    const groupSensors = [
      { key: 'pm1_0' },
      { key: 'pm25_0' },
      // pm10_0 doesn't exist in global map yet!
      { key: 'pm10_0' },
    ]

    // Act
    const result = extractHistoryForGroup(globalHistoryMap, groupSensors)

    // Assert
    expect(result).toEqual({
      pm1_0: [
        { time: new Date('2023-01-01'), value: 10 },
        { time: new Date('2023-01-02'), value: 12 },
      ],
      pm25_0: [{ time: new Date('2023-01-01'), value: 25 }],
      pm10_0: [], // Should default to empty array when no data exists
    })
  })

  it('should return an empty map if no group sensors are provided', () => {
    const globalHistoryMap: Record<string, SensorDataPoint[]> = {
      pm1_0: [{ time: new Date('2023-01-01'), value: 10 }],
    }

    const result = extractHistoryForGroup(globalHistoryMap, [])
    expect(result).toEqual({})
  })
})
