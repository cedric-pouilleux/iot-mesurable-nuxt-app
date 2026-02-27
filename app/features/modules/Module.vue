<template>
  <ModuleLayout
    :title="moduleTypeLabel"
    :is-online="isOnline"
    :loading="isLoading"
    :loading-text="$t('loading.moduleData', { name: module.name })"
    :options-panel-open="optionsPanelOpen"
    @toggle-options="optionsPanelOpen = !optionsPanelOpen"
  >
    <template #header-actions>
      <UIButton
        icon="tabler:settings"
        :icon-class="{ 'rotate-90': optionsPanelOpen }"
        :variant="optionsPanelOpen ? 'blue' : 'ghost'"
        size="small"
        :clickable="true"
        :label="$t('common.options')"
        :title="$t('common.options')"
        @click="optionsPanelOpen = !optionsPanelOpen"
      />
      <NuxtLink
        :to="localePath({ name: 'logs', query: { moduleId: moduleId, category: 'HARDWARE' } })"
        target="_blank"
        :title="$t('nav.logs')"
      >
        <UIButton
          icon="tabler:notes"
          variant="ghost"
          size="small"
          :label="$t('nav.logs')"
          :clickable="true"
        />
      </NuxtLink>
    </template>

    <template #options-panel>
      <SensorsModuleOptions
        :is-open="optionsPanelOpen"
        :device-status="deviceStatus"
        :module-id="moduleId"
        :sensor-history-map="sensorData"
        @zone-changed="$emit('zone-changed')"
        @open-zone-drawer="$emit('open-zone-drawer')"
      />
    </template>

    <template #cards>
      <UnifiedSensorCard
        v-for="group in sensorGraphs"
        :key="group.type"
        :label="group.label"
        :sensors="group.sensors"
        :history-map="getHistoryMap(group)"
        :module-id="moduleId"
        :color="group.color"
        :graph-duration="graphDuration"
        :initial-active-sensor-key="group.initialKey"
        :is-panel-open="isCardPanelOpen(group)"
        @toggle-graph="
          toggleGraph(group.sensors[0]?.key, activeSensorByGroup[group.type] || group.initialKey)
        "
        @update:active-sensor="handleActiveSensorChange(group.type, $event)"
        @open-options="optionsPanelOpen = true"
      />
    </template>

    <template #extra>
      <Transition name="slide-panel">
        <SensorDetailGraph
          v-if="selectedGraphSensor"
          :module-id="moduleId"
          :selected-sensor="selectedGraphSensor"
          :initial-active-sensor="selectedGraphActiveSensor"
          :history="getSensorHistory(selectedGraphSensor)"
          :sensor-label="selectedGraphGroup?.label || getSensorLabel(selectedGraphSensor)"
          :sensor-color="getSensorColor(selectedGraphSensor)"
          :sensor-unit="getSensorUnit(selectedGraphSensor)"
          :available-sensors="selectedGraphAvailableSensors"
          :sensor-history-map="selectedGraphHistoryMap"
          @close="selectedGraphSensor = null"
        />
      </Transition>
    </template>
  </ModuleLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SensorDataPoint } from './common/types'
import { useChartSettings } from '~/features/modules/common/module-panel/composables'
import ModuleLayout from './common/ModuleLayout.vue'
import SensorsModuleOptions from './common/module-panel/SensorsModuleOptions.vue'
import SensorDetailGraph from './common/card/SensorDetailGraph.vue'
import UnifiedSensorCard from './common/card/UnifiedSensorCard.vue'
import UIButton from '~/components/design-system/UIButton/UIButton.vue'
import { getSensorLabel, getSensorColor, getSensorUnit } from './common/utils/sensors'
import { getSensorTypeFromKey, getHardwareIdFromKey, getHardware } from './common/config/sensors'
import type { Module } from './common/types'
import { useModulesData } from './common/composables'
import { useDashboard } from '~/composables/useDashboard'

defineEmits<{
  (e: 'zone-changed'): void
  (e: 'open-zone-drawer'): void
}>()

const props = defineProps<{
  module: Module
}>()

const { getModuleSensorData, getModuleDeviceStatus } = useModulesData()

const moduleId = computed(() => props.module.id)
const sensorData = computed(() => getModuleSensorData(moduleId.value))
const deviceStatus = computed(() => getModuleDeviceStatus(moduleId.value))

const optionsPanelOpen = ref(false)

const isOnline = computed(() => deviceStatus.value.system?.online !== false)
const selectedGraphSensor = ref<string | null>(null)
const selectedGraphActiveSensor = ref<string | null>(null) // Active sensor from card to pre-select
const isToggling = ref(false)

const { debouncedGraphDuration: graphDuration } = useChartSettings(computed(() => moduleId.value))
const { loadDashboard, loadHistory } = useDashboard()
const { loadModuleDashboard } = useModulesData()

const { t } = useI18n()
const localePath = useLocalePath()

const isLoading = ref(true)

const moduleTypeLabel = computed(() => {
  const type = deviceStatus.value?.moduleType
  if (!type) return t('modules.types.unknown') || 'Module inconnu'
  return t(`modules.types.${type}`) || type
})

// Track active sensor per group type (updated by UnifiedSensorCard)
const activeSensorByGroup = reactive<Record<string, string>>({})

// Handler for when a card changes its active sensor
const handleActiveSensorChange = (groupType: string, sensorKey: string) => {
  activeSensorByGroup[groupType] = sensorKey
}

onMounted(async () => {
  isLoading.value = true
  const result = await loadDashboard(moduleId.value, graphDuration.value)
  if (result) {
    loadModuleDashboard(moduleId.value, result)
  }
  isLoading.value = false
})

watch(graphDuration, async (newDuration, oldDuration) => {
  if (newDuration === oldDuration) return
  isLoading.value = true
  const sensors = await loadHistory(moduleId.value, newDuration)
  if (sensors) {
    loadModuleDashboard(moduleId.value, { status: null, sensors })
  }
  isLoading.value = false
})

// Define groups by sensor_type (the keys come from composite keys now)
const sensorGroupsDefinition = [
  { type: 'temperature', label: 'Température', color: 'orange', sensorTypes: ['temperature'] },
  { type: 'humidity', label: 'Humidité', color: 'blue', sensorTypes: ['humidity'] },
  { type: 'co2', label: 'CO2', color: 'emerald', sensorTypes: ['co2', 'eco2'] },
  { type: 'co', label: 'CO', color: 'amber', sensorTypes: ['co'] },
  { type: 'voc', label: 'COV', color: 'pink', sensorTypes: ['voc', 'tvoc'] },
  { type: 'pressure', label: 'Pression', color: 'cyan', sensorTypes: ['pressure'] },
  {
    type: 'pm',
    label: 'Particules fines',
    color: 'violet',
    sensorTypes: ['pm1', 'pm25', 'pm4', 'pm10'],
  },
]

const getSensorData = (sensorName: string) => {
  const status = sensorData.value[sensorName] || {}
  const config = deviceStatus.value?.sensorsConfig?.sensors?.[sensorName] || {}
  return {
    ...status,
    ...(config.model && { model: config.model }),
    ...(config.interval && { interval: config.interval }),
  }
}

// Build active groups from both sensorData and deviceStatus
const sensorGraphs = computed(() => {
  return (
    sensorGroupsDefinition
      .map(group => {
        // Collect all composite keys from sensorData that match this group
        const dataKeys = Object.keys(sensorData.value).filter(compositeKey => {
          const type = getSensorTypeFromKey(compositeKey)
          return group.sensorTypes.includes(type)
        })

        // Also check deviceStatus.sensors for sensors that might not have data yet
        const statusSensorTypes = Object.keys(deviceStatus.value?.sensors || {}).filter(
          sensorType => group.sensorTypes.includes(sensorType)
        )

        // Create a set of all unique composite keys
        // For status sensors without data, create placeholder keys
        const allKeys = new Set<string>(dataKeys)
        statusSensorTypes.forEach(sensorType => {
          // Find if there's already a composite key for this sensor type
          const hasDataKey = dataKeys.some(k => getSensorTypeFromKey(k) === sensorType)
          if (!hasDataKey) {
            // Add a simple key (will work as fallback)
            allKeys.add(sensorType)
          }
        })

        const sensors = Array.from(allKeys)
          .map(compositeKey => {
            const sensorType = getSensorTypeFromKey(compositeKey)
            const hardwareId = getHardwareIdFromKey(compositeKey)
            const hardware = hardwareId ? getHardware(hardwareId) : null

            // Find the actual data key - if this is a simple key from status, find matching composite key
            let dataKey = compositeKey
            if (!hardwareId) {
              // This is a simple key from status, find matching composite key in sensorData
              const matchingKey = Object.keys(sensorData.value).find(
                k => getSensorTypeFromKey(k) === sensorType
              )
              if (matchingKey) {
                dataKey = matchingKey
              }
            }

            // Use dataKey (composite key) for status lookup since ESP32 now publishes with composite keys
            const statusData = getSensorData(dataKey)

            // Get the last value from sensorData history (use dataKey for lookup)
            const history = sensorData.value[dataKey] || []
            const lastValue =
              history.length > 0 ? history[history.length - 1]?.value : statusData.value

            // Get hardware name from composite key or from config model
            const hardwareName = hardware?.name || statusData.model
            const sensorLabel = getSensorLabel(sensorType)

            // Build display label based on group type
            let displayLabel: string
            if (group.type === 'pm') {
              // PM sensors: just sensor label (PM1.0, PM2.5, etc.)
              displayLabel = sensorLabel
            } else if (group.type === 'co2' || group.type === 'voc') {
              // CO2 and COV: just hardware name
              displayLabel = hardwareName || sensorLabel
            } else if (hardwareName) {
              // Other sensors with hardware: just hardware name
              displayLabel = hardwareName
            } else {
              // Fallback: just sensor label
              displayLabel = sensorLabel
            }

            const sensorObj = {
              key: dataKey, // Use the actual data key for history lookup
              label: displayLabel,
              sensorLabel, // Keep pure sensor label for card title
              model: hardwareName, // Add hardware name for dropdown display
              value: lastValue,
              status: statusData.status,
              interval: statusData.interval,
            }

            return sensorObj
          })
          .filter(s => s !== null)

        if (sensors.length === 0) return null

        // Determine initial active sensor from preferences
        const prefKey = `sensor-pref-${group.label}`
        const preferredSensorKey = deviceStatus.value?.preferences?.[prefKey]

        const initialKey =
          preferredSensorKey && sensors.find(s => s.key === preferredSensorKey)
            ? preferredSensorKey
            : sensors[0]?.key

        return {
          type: group.type,
          label: group.label,
          color: group.color,
          sensors,
          initialKey,
        }
      })
      .filter((g): g is NonNullable<typeof g> => g !== null)
      // Also hide groups where all sensors are disabled
      .filter(g => g.sensors.some(s => s.status !== 'disabled'))
  )
})

const getSensorHistory = (key: string) => {
  // Try direct lookup first (works for composite keys like "dht22:temperature")
  const directData = sensorData.value[key]
  if (directData && directData.length > 0) {
    return directData
  }

  // If key is not a composite key, search for matching composite key by sensor type
  const sensorType = getSensorTypeFromKey(key)
  if (sensorType === key) {
    // This is a simple key, find matching composite key in sensorData
    const matchingKey = Object.keys(sensorData.value).find(
      k => getSensorTypeFromKey(k) === sensorType
    )
    if (matchingKey && sensorData.value[matchingKey]?.length > 0) {
      return sensorData.value[matchingKey]
    }
  }

  return []
}

const getHistoryMap = (group: any) => {
  const map: Record<string, SensorDataPoint[]> = {}
  group.sensors.forEach((s: any) => {
    map[s.key] = getSensorHistory(s.key)
  })
  return map
}

const toggleGraph = (sensorType: string, activeSensorKey?: string) => {
  if (isToggling.value) return
  isToggling.value = true
  const normalizedType = getSensorTypeFromKey(sensorType)

  if (selectedGraphSensor.value === normalizedType) {
    selectedGraphSensor.value = null
    selectedGraphActiveSensor.value = null
  } else {
    selectedGraphSensor.value = normalizedType
    selectedGraphActiveSensor.value = activeSensorKey || sensorType
  }
  setTimeout(() => (isToggling.value = false), 100)
}

/**
 * Check if a card's panel is open (its sensor is selected for detail graph)
 */
const isCardPanelOpen = (group: { sensors: { key: string }[] }) => {
  if (!selectedGraphSensor.value) return false
  return group.sensors.some(s => getSensorTypeFromKey(s.key) === selectedGraphSensor.value)
}

const selectedGraphGroup = computed(() => {
  if (!selectedGraphSensor.value) return null
  return (
    sensorGraphs.value.find(g =>
      g.sensors.some(s => getSensorTypeFromKey(s.key) === selectedGraphSensor.value)
    ) || null
  )
})

const selectedGraphAvailableSensors = computed(() => {
  return selectedGraphGroup.value?.sensors || []
})

const selectedGraphHistoryMap = computed<Record<string, SensorDataPoint[]>>(() => {
  if (!selectedGraphGroup.value) return {}
  return getHistoryMap(selectedGraphGroup.value)
})
</script>
<style scoped>
.options-panel-transition {
  transition: all 0.3s linear;
}

.slide-panel-enter-active {
  transition: all 0.4s ease-out;
}

.slide-panel-leave-active {
  transition: all 0.3s ease-in;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
