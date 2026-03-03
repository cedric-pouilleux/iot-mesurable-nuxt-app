import type { DeviceStatus, SensorData, SensorDataPoint } from '../types'
import type { MqttMessage } from '~/types'
import { useMqttMessageHandler } from '~/features/mqtt/composables/useMqttMessageHandler'
import { matchTopic } from '../config/sensors'

const MAX_DATA_POINTS = 5000

/**
 * Composable for managing module data (device status and sensor data)
 * Handles MQTT messages and dashboard data loading for multiple modules
 */
// Global state (Singleton)
const modulesDeviceStatus = ref<Map<string, DeviceStatus>>(new Map())
const modulesSensorData = ref<Map<string, SensorData>>(new Map())
// Version counter to force reactivity updates
const updateVersion = ref(0)

/**
 * Composable for managing module data (device status and sensor data)
 * Handles MQTT messages and dashboard data loading for multiple modules
 */
export const useModulesData = () => {
  const {
    MQTT_TOPICS,
    isStatusTopic,
    mergeSystemData,
    mergeSystemConfig,
    mergeSensorsStatus,
    mergeSensorsConfig,
    mergeHardwareConfig,
    mergeOnlineStatus,
  } = useMqttMessageHandler()

  /**
   * Get device status for a specific module
   * Depends on updateVersion to trigger reactivity
   */
  const getModuleDeviceStatus = (moduleId: string): DeviceStatus | null => {
    // Touch updateVersion to create dependency for Vue reactivity
    void updateVersion.value
    return modulesDeviceStatus.value.get(moduleId) || null
  }

  /**
   * Get sensor data for a specific module
   * Depends on updateVersion to trigger reactivity
   */
  const getModuleSensorData = (moduleId: string): SensorData => {
    // Touch updateVersion to create dependency for Vue reactivity
    void updateVersion.value
    return modulesSensorData.value.get(moduleId) || {}
  }

  /**
   * Initialize module data structures if they don't exist
   */
  const initializeModule = (moduleId: string): void => {
    if (!modulesDeviceStatus.value.has(moduleId)) {
      modulesDeviceStatus.value.set(moduleId, {
        system: {},
        sensors: {},
        hardware: {},
        sensorsConfig: {},
      })
    }
    if (!modulesSensorData.value.has(moduleId)) {
      modulesSensorData.value.set(moduleId, {})
    }
  }

  /**
   * Initialize module with type from /api/modules response
   * This ensures moduleType is available even if /status endpoint fails
   */
  const initializeModuleWithType = (moduleId: string, moduleType: string): void => {
    initializeModule(moduleId)
    const deviceStatus = modulesDeviceStatus.value.get(moduleId)!
    // Only set if not already defined (preserve value from API status)
    if (!deviceStatus.moduleType) {
      deviceStatus.moduleType = moduleType
      modulesDeviceStatus.value.set(moduleId, { ...deviceStatus })
      updateVersion.value++
    }
  }

  /**
   * Handle incoming MQTT message for a module
   */
  const handleModuleMessage = (moduleId: string, message: MqttMessage): void => {
    initializeModule(moduleId)

    const deviceStatus = modulesDeviceStatus.value.get(moduleId)!
    const sensorData = modulesSensorData.value.get(moduleId)!

    // Handle status/config messages
    if (isStatusTopic(message.topic) && message.metadata) {
      if (message.topic.endsWith(MQTT_TOPICS.SYSTEM)) {
        mergeSystemData(deviceStatus, message.metadata as Parameters<typeof mergeSystemData>[1])
      } else if (message.topic.endsWith(MQTT_TOPICS.SYSTEM_CONFIG)) {
        mergeSystemConfig(deviceStatus, message.metadata as Parameters<typeof mergeSystemConfig>[1])
      } else if (message.topic.endsWith(MQTT_TOPICS.SENSORS_STATUS)) {
        mergeSensorsStatus(
          deviceStatus,
          message.metadata as Parameters<typeof mergeSensorsStatus>[1]
        )
      } else if (message.topic.endsWith(MQTT_TOPICS.SENSORS_CONFIG)) {
        mergeSensorsConfig(
          deviceStatus,
          message.metadata as Parameters<typeof mergeSensorsConfig>[1]
        )
      } else if (message.topic.endsWith(MQTT_TOPICS.HARDWARE_CONFIG)) {
        mergeHardwareConfig(
          deviceStatus,
          message.metadata as Parameters<typeof mergeHardwareConfig>[1]
        )
      } else if (message.topic.endsWith(MQTT_TOPICS.ONLINE)) {
        mergeOnlineStatus(deviceStatus, message.metadata as Parameters<typeof mergeOnlineStatus>[1])
      }

      // Trigger reactivity
      modulesDeviceStatus.value.set(moduleId, { ...deviceStatus })
      updateVersion.value++
    }
    // Handle sensor measurement messages
    else if (message.value !== null) {
      const sensorKey = matchTopic(message.topic)

      if (sensorKey) {
        const newData: SensorDataPoint = {
          time: new Date(message.time),
          value: message.value,
        }

        if (!sensorData[sensorKey]) {
          sensorData[sensorKey] = []
        }

        // Immutable update for reactivity
        // We create a new array ref
        const newHistory = [...sensorData[sensorKey], newData]
        if (newHistory.length > MAX_DATA_POINTS) {
          newHistory.shift()
        }
        sensorData[sensorKey] = newHistory

        // Trigger reactivity for history
        modulesSensorData.value.set(moduleId, { ...sensorData })
        updateVersion.value++

        // ALSO update DeviceStatus value (Real-time Value)
        // Extract sensor type from composite key for status lookup
        const parts = sensorKey.split(':')
        const sensorType = parts.length === 2 ? parts[1] : sensorKey

        if (!deviceStatus.sensors) deviceStatus.sensors = {}
        if (!deviceStatus.sensors[sensorType]) deviceStatus.sensors[sensorType] = { status: 'ok' }

        deviceStatus.sensors[sensorType] = {
          ...deviceStatus.sensors[sensorType],
          value: message.value,
          status: 'ok',
        }

        // Update reactivity for status
        modulesDeviceStatus.value.set(moduleId, { ...deviceStatus })
        updateVersion.value++
      }
    }
  }

  /**
   * Update only sensor data for a module (replaces existing data)
   * Used when changing time range without reloading status
   */
  const updateModuleSensorData = (moduleId: string, sensors: SensorData): void => {
    initializeModule(moduleId)
    modulesSensorData.value.set(moduleId, { ...sensors })
    updateVersion.value++
  }

  return {
    modulesDeviceStatus: readonly(modulesDeviceStatus),
    modulesSensorData: readonly(modulesSensorData),
    getModuleDeviceStatus,
    getModuleSensorData,
    handleModuleMessage,
    updateModuleSensorData,
    initializeModuleWithType,
  }
}
