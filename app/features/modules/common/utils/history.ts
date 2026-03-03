import type { SensorDataPoint } from '../types'

/**
 * Extracts and maps the historical data for a specific group of sensors
 * from the global module sensor history data.
 *
 * @param globalHistoryMap The global record containing all sensor historical data.
 * @param groupSensors An array of objects, each containing the 'key' (id) of a sensor in the group.
 * @returns A mapping specific to the group, where keys are sensor IDs and values are their corresponding historical data array.
 */
export const extractHistoryForGroup = (
  globalHistoryMap: Record<string, SensorDataPoint[]>,
  groupSensors: { key: string }[]
): Record<string, SensorDataPoint[]> => {
  const groupHistoryMap: Record<string, SensorDataPoint[]> = {}

  groupSensors.forEach(sensor => {
    groupHistoryMap[sensor.key] = globalHistoryMap[sensor.key] || []
  })

  return groupHistoryMap
}
