<template>
  <div class="col-span-6 lg:col-span-3 flex flex-col space-y-3">
    <UIPanel :title="$t('modules.sensorConfig.title')">
      <template #options>
        <template v-if="dbSize">
          <div class="flex items-center gap-2">
            <UITooltip :text="$t('modules.sensorConfig.dbSizeTooltip')">
              <UITag variant="blue" size="xs" icon="tabler:database">
                {{ formatBytes(dbSize.totalSizeBytes) }}
              </UITag>
            </UITooltip>
          </div>
        </template>

        <!-- Projections (Grouped) -->
        <UITagList
          v-if="projectionsData"
          :items="[
            {
              label: `${formatBytes(projectionsData.daily)}/${$t('modules.sensorConfig.daily')}`,
              tooltip: $t('modules.sensorConfig.projectionTooltip', {
                period: $t('modules.sensorConfig.daily'),
              }),
            },
            {
              label: `${formatBytes(projectionsData.monthly)}/${$t('modules.sensorConfig.monthly')}`,
              tooltip: $t('modules.sensorConfig.projectionTooltip', {
                period: $t('modules.sensorConfig.monthly'),
              }),
            },
            {
              label: `${formatBytes(projectionsData.yearly)}/${$t('modules.sensorConfig.yearly')}`,
              tooltip: $t('modules.sensorConfig.projectionTooltip', {
                period: $t('modules.sensorConfig.yearly'),
              }),
            },
          ]"
        />
      </template>

      <div>
        <HardwareSensorRow
          v-for="(sensor, index) in hardwareSensorList"
          :key="sensor.hardwareKey"
          :hardware="sensor"
          :module-id="moduleId"
          :sensor-history-map="sensorHistoryMap"
          :class="{
            'border-b border-dashed border-gray-200 dark:border-gray-700 pb-1 mb-1':
              index < hardwareSensorList.length - 1,
          }"
          @interval-change="onIntervalChange"
          @enabled-change="onEnabledChange"
        />

        <!-- Empty State -->
        <div v-if="hardwareSensorList.length === 0" class="p-4 text-center text-xs text-gray-400">
          {{ $t('modules.sensorConfig.noSensors') }}
        </div>
      </div>
    </UIPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import HardwareSensorRow from './HardwareSensorRow.vue'
import UITag from '~/components/design-system/UITag/UITag.vue'
import UITooltip from '~/components/design-system/UITooltip/UITooltip.vue'
import UIPanel from '~/components/design-system/UIPanel/UIPanel.vue'
import UITagList from '~/components/design-system/UITagList/UITagList.vue'
import { HARDWARE_SENSORS } from '../config/hardwareSensors'

interface Measurement {
  key: string
  label: string
  status: 'ok' | 'missing' | 'unknown' | 'disabled'
  value?: number
}

interface HardwareData {
  hardwareKey: string
  name: string
  measurements: Measurement[]
  interval: number
  status: 'ok' | 'partial' | 'missing' | 'unknown' | 'disabled'
  enabled: boolean
}

interface Props {
  dbSize?: { totalSizeBytes: number } | null
}

defineProps<Props>()

import { useModuleContext } from '../../modules/common/composables/useModuleContext'
const { deviceStatus, moduleId, sensorData: sensorHistoryMap } = useModuleContext()

// Use new composable for configuration logic
import { useSensorConfiguration } from '../composables/useSensorConfiguration'
const { projectionsData, updateInterval, updateEnabled, fetchStorageStats } =
  useSensorConfiguration(moduleId)

onMounted(() => {
  fetchStorageStats()
})

watch(moduleId, () => {
  fetchStorageStats()
})

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Build hardware sensor list from device status AND manifest
import { useModuleManifest } from '~/features/modules/common/module-panel/composables/useModuleManifest'

const moduleType = computed(() => deviceStatus.value?.moduleType)
const { manifest } = useModuleManifest(moduleType)

const hardwareSensorList = computed<HardwareData[]>(() => {
  const sensors = deviceStatus.value?.sensors
  const sensorsConfig = deviceStatus.value?.sensorsConfig?.sensors

  if (!sensors) return []

  // Filter available hardware based on manifest if available
  let availableHardware = HARDWARE_SENSORS
  if (manifest.value) {
    const manifestHardwareKeys = new Set(manifest.value.hardware.map(h => h.key))
    availableHardware = HARDWARE_SENSORS.filter(hw => manifestHardwareKeys.has(hw.hardwareKey))
  }

  return availableHardware.map(hw => {
    // Check if we have received any sensor data yet
    const hasSensors =
      deviceStatus.value?.sensors && Object.keys(deviceStatus.value.sensors).length > 0

    // Check if any measurement from this hardware exists in history
    const measurements: Measurement[] = hw.measurements.map(measureKey => {
      // 1. Try composite key (e.g. "dht22:temperature")
      const compositeKey = `${hw.hardwareKey}:${measureKey}`
      let history = sensorHistoryMap.value?.[compositeKey]

      // 2. Fallback to simple key (e.g. "co2") if composite not found
      // This handles legacy sensors (MHZ14A, SGP40) that map to simple keys
      if ((!history || history.length === 0) && !measureKey.includes(':')) {
        history = sensorHistoryMap.value?.[measureKey]
      }

      // Get latest value (assuming history is sorted ASCENDING by useModulesData)
      const lastPoint = history && history.length > 0 ? history[history.length - 1] : null

      // Determine status: Strictly use explicit status from deviceStatus
      // User Requirement: Data presence in history does NOT imply hardware status is OK.
      // If no sensor data received yet (empty sensors object), show loader
      let status: 'ok' | 'missing' | 'unknown' | 'disabled' = 'unknown'

      if (hasSensors) {
        const deviceSensor =
          deviceStatus.value?.sensors?.[compositeKey] || deviceStatus.value?.sensors?.[measureKey]

        if (deviceSensor && deviceSensor.status) {
          status = deviceSensor.status as 'ok' | 'missing' | 'unknown' | 'disabled'
        }
      }
      // If hasSensors is false, status remains 'unknown' (Loader shown)

      return {
        key: measureKey,
        label: hw.measurementLabels[measureKey] || measureKey,
        value: lastPoint?.value,
        status,
      }
    })

    // Determine overall status and enabled state
    const disabledCount = measurements.filter(m => m.status === 'disabled').length
    const okCount = measurements.filter(m => m.status === 'ok').length

    // If all measurements are disabled, hardware is disabled
    const enabled = disabledCount < measurements.length

    let status: 'ok' | 'partial' | 'missing' | 'disabled' | 'unknown' = 'unknown'
    if (disabledCount === measurements.length) {
      status = 'disabled'
    } else if (okCount === measurements.length) {
      status = 'ok'
    } else if (okCount > 0) {
      status = 'partial'
    } else if (hasSensors) {
      // Only mark as missing if we have received sensor data but this hardware is absent
      status = 'missing'
    }

    // Get interval from sensorsConfig (prefer composite key, fallback to simple)
    const firstKey = hw.measurements[0]
    const compositeKey = `${hw.hardwareKey}:${firstKey}`
    const intervalMs =
      sensorsConfig?.[compositeKey]?.interval || sensorsConfig?.[firstKey]?.interval || 60

    return {
      hardwareKey: hw.hardwareKey,
      name: hw.name,
      measurements,
      interval: intervalMs,
      status,
      enabled,
    }
  })
})

const onIntervalChange = (hardwareKey: string, newInterval: number) => {
  updateInterval(hardwareKey, newInterval)
}

const onEnabledChange = (hardwareKey: string, isEnabled: boolean) => {
  updateEnabled(hardwareKey, isEnabled)
}
</script>
