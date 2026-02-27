import type {
  DeviceStatus,
  SystemInfo,
  SensorStatus,
  SensorsConfigData,
  HardwareInfo,
} from '~/features/modules/common/types'

/**
 * MQTT Topic Constants
 */
export const MQTT_TOPICS = {
  SYSTEM: '/system',
  SYSTEM_CONFIG: '/system/config',
  SENSORS_STATUS: '/sensors/status',
  SENSORS_CONFIG: '/sensors/config',
  HARDWARE_CONFIG: '/hardware/config',
  ONLINE: '/online',
} as const

/**
 * Check if a topic is a status/config topic
 * @param topic - MQTT topic string
 * @returns True if topic is a status or config topic
 */
export function isStatusTopic(topic: string): boolean {
  return (
    topic.endsWith(MQTT_TOPICS.SYSTEM) ||
    topic.endsWith(MQTT_TOPICS.SYSTEM_CONFIG) ||
    topic.endsWith(MQTT_TOPICS.SENSORS_STATUS) ||
    topic.endsWith(MQTT_TOPICS.SENSORS_CONFIG) ||
    topic.endsWith(MQTT_TOPICS.HARDWARE_CONFIG) ||
    topic.endsWith(MQTT_TOPICS.ONLINE)
  )
}

/**
 * Merge system runtime data (RSSI, memory) into device status
 * @param status - Current device status
 * @param metadata - Incoming system metadata
 */
export function mergeSystemData(status: DeviceStatus, metadata: Partial<SystemInfo>): void {
  if (!status.system) status.system = {}

  if (metadata.rssi !== undefined) {
    status.system.rssi = metadata.rssi
  }

  if (metadata.memory) {
    if (!status.system.memory) status.system.memory = {}

    if (metadata.memory.heapFreeKb !== undefined) {
      status.system.memory.heapFreeKb = metadata.memory.heapFreeKb
    }
    if (metadata.memory.heapMinFreeKb !== undefined) {
      status.system.memory.heapMinFreeKb = metadata.memory.heapMinFreeKb
    }
    if (metadata.memory.psram) {
      status.system.memory.psram = {
        ...status.system.memory.psram,
        ...metadata.memory.psram,
      }
    }
  }
}

/**
 * Merge system configuration data (IP, MAC, flash, etc.) into device status
 * @param status - Current device status
 * @param metadata - Incoming system config metadata (includes moduleType from ESP32)
 */
export function mergeSystemConfig(
  status: DeviceStatus,
  metadata: Partial<SystemInfo> & { moduleType?: string }
): void {
  if (!status.system) status.system = {}

  if (metadata.ip) status.system.ip = metadata.ip
  if (metadata.mac) status.system.mac = metadata.mac
  if (metadata.uptimeStart !== undefined) status.system.uptimeStart = metadata.uptimeStart
  if (metadata.flash) status.system.flash = metadata.flash

  // Extract moduleType from ESP32 system/config message
  if (metadata.moduleType) status.moduleType = metadata.moduleType

  // Internal tracking for uptime calculation
  status.system._configReceivedAt = Math.floor(Date.now() / 1000)
  status.system._uptimeStartOffset = metadata.uptimeStart

  if (metadata.memory) {
    if (!status.system.memory) status.system.memory = {}

    if (metadata.memory.heapTotalKb !== undefined) {
      status.system.memory.heapTotalKb = metadata.memory.heapTotalKb
    }
    if (metadata.memory.psram) {
      status.system.memory.psram = metadata.memory.psram
    }
  }
}

/**
 * Merge sensor status data into device status
 * @param status - Current device status
 * @param metadata - Incoming sensors status metadata
 */
export function mergeSensorsStatus(
  status: DeviceStatus,
  metadata: Record<string, SensorStatus>
): void {
  if (!status.sensors) status.sensors = {}

  Object.entries(metadata).forEach(([sensorName, sensorData]) => {
    if (!status.sensors![sensorName]) {
      status.sensors![sensorName] = {}
    }

    status.sensors![sensorName] = {
      ...status.sensors![sensorName],
      status: sensorData.status,
      value: sensorData.value,
    }
  })
}

/**
 * Merge sensor configuration data into device status
 * @param status - Current device status
 * @param metadata - Incoming sensors config metadata
 */
export function mergeSensorsConfig(status: DeviceStatus, metadata: SensorsConfigData): void {
  if (!status.sensorsConfig) status.sensorsConfig = { sensors: {} }
  if (!status.sensorsConfig.sensors) status.sensorsConfig.sensors = {}

  if (metadata.sensors) {
    Object.entries(metadata.sensors).forEach(([sensorName, sensorConfig]) => {
      // Create nested object if it doesn't exist
      if (!status.sensorsConfig!.sensors![sensorName]) {
        status.sensorsConfig!.sensors![sensorName] = {}
      }

      // Merge properties individually to preserve existing ones (like model)
      status.sensorsConfig!.sensors![sensorName] = {
        ...status.sensorsConfig!.sensors![sensorName],
        ...sensorConfig,
      }
    })
  }
}

/**
 * Merge hardware configuration data into device status
 * @param status - Current device status
 * @param metadata - Incoming hardware metadata
 */
export function mergeHardwareConfig(status: DeviceStatus, metadata: HardwareInfo): void {
  status.hardware = {
    ...status.hardware,
    ...metadata,
  }
}

/**
 * Merge online/offline status (from LWT) into device status
 * @param status - Current device status
 * @param metadata - Incoming online status {online: boolean}
 */
export function mergeOnlineStatus(status: DeviceStatus, metadata: { online: boolean }): void {
  if (!status.system) status.system = {}
  status.system.online = metadata.online

  if (!metadata.online) {
    // When device goes offline, clear bootedAt and record disconnect time
    status.system.bootedAt = null
    status.system.disconnectedAt = new Date().toISOString()
  } else {
    // When device comes back online, clear disconnectedAt
    status.system.disconnectedAt = null
  }
}

/**
 * Composable for handling MQTT messages with shared logic
 * Provides utilities for parsing and merging MQTT data into device status
 */
export function useMqttMessageHandler() {
  return {
    MQTT_TOPICS,

    isStatusTopic,
    mergeSystemData,
    mergeSystemConfig,
    mergeSensorsStatus,
    mergeSensorsConfig,
    mergeHardwareConfig,
    mergeOnlineStatus,
  }
}
