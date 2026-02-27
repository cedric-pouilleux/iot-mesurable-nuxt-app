/**
 * Re-export types from common module types
 * This avoids duplication and ensures we use the same types across the app
 */
export type {
  SensorStatus,
  SensorIntervalConfig as SensorConfig,
} from '~/features/modules/common/types'

/**
 * Types specific to sensor configuration feature
 */
export interface SensorConfigUpdate {
  sensorType: string
  intervalSeconds: number
}

export interface SensorProjection {
  slotName: string
  sensorType: string
}
