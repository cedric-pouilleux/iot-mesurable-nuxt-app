import type { SensorDataPoint } from '~/features/modules/common/types'

interface RawSensorDataPoint {
  time: string | Date
  value: number
}

const isSensorDataArray = (data: unknown): data is RawSensorDataPoint[] => {
  return Array.isArray(data)
}

export function processSensorData<T extends { time: string | Date }>(
  arr: T[] | null | undefined
): Array<T & { time: Date }> {
  return arr!.map(m => ({ ...m, time: new Date(m.time) })) as Array<T & { time: Date }>
}

export function extractAndProcessSensorsHistory(
  rawData: Record<string, unknown> | null | undefined
): Record<string, SensorDataPoint[]> {
  const result: Record<string, SensorDataPoint[]> = {}

  if (!rawData) return result

  Object.entries(rawData).forEach(([key, values]) => {
    if (isSensorDataArray(values)) {
      result[key] = processSensorData(values)
    }
  })

  return result
}
