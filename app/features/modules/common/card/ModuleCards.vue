<template>
  <div
    class="grid gap-4 cards-transition"
    style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))"
    :class="{ 'cards-pushed': isOptionsPanelPushed }"
  >
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
      :is-panel-open="selectedGraphGroup?.type === group.type"
      @toggle-graph="(activeKey: string) => $emit('toggle-graph', group, activeKey)"
      @open-options="$emit('open-options')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UnifiedSensorCard from './UnifiedSensorCard.vue'
import type { SensorGroupInfo, SensorItem } from './composables/useSensorDetailGraphState'
import { extractHistoryForGroup } from '../utils/history'
import { useModuleContext } from '../composables/useModuleContext'
import { sensorGroupsDefinition } from '../../ModulesConfig'
import { getSensorTypeFromKey, getHardwareIdFromKey, getHardware } from '../config/sensors'
import { getSensorLabel } from '../utils/sensors'

defineProps<{
  isOptionsPanelPushed?: boolean
  selectedGraphGroup?: SensorGroupInfo
}>()

const { sensorData, deviceStatus, moduleId, graphDuration } = useModuleContext()

defineEmits<{
  (e: 'toggle-graph', group: SensorGroupInfo, activeKey: string): void
  (e: 'open-options'): void
}>()

const getHistoryMap = (group: { sensors: { key: string }[] }) => {
  return extractHistoryForGroup(sensorData.value, group.sensors)
}

const getDisplayLabel = (
  groupType: string,
  sensorLabel: string,
  hardwareName: string | null | undefined
): string => {
  if (groupType === 'pm') return sensorLabel
  if (groupType === 'co2' || groupType === 'voc') return hardwareName || sensorLabel
  if (hardwareName) return hardwareName
  return sensorLabel
}

const sensorGraphs = computed<SensorGroupInfo[]>(() => {
  return sensorGroupsDefinition
    .map(group => {
      // 1. Collect all keys for this group
      const dataKeys = Object.keys(sensorData.value || {}).filter(k =>
        group.sensorTypes.includes(getSensorTypeFromKey(k))
      )
      const statusKeys = Object.keys(deviceStatus.value?.sensors || {}).filter(k =>
        group.sensorTypes.includes(getSensorTypeFromKey(k))
      )
      const allKeys = new Set([...dataKeys, ...statusKeys])

      // 2. Build the sensors array
      const sensors: SensorItem[] = Array.from(allKeys)
        .map(key => {
          const type = getSensorTypeFromKey(key)
          const hardwareId = getHardwareIdFromKey(key)
          const hardware = hardwareId ? getHardware(hardwareId) : null

          const config = deviceStatus.value?.sensorsConfig?.sensors?.[key] || {}
          const status = deviceStatus.value?.sensors?.[key] || {}
          const history = sensorData.value?.[key] || []

          const lastValue = history.length > 0 ? history[history.length - 1]?.value : status.value

          const hardwareName = hardware?.name || config.model
          const sensorLabel = getSensorLabel(type)
          const displayLabel = getDisplayLabel(group.type, sensorLabel, hardwareName)

          return {
            key,
            label: displayLabel,
            sensorLabel,
            model: hardwareName,
            value: lastValue,
            status: status.status,
          }
        })
        .filter(s => s.status !== 'disabled')

      if (sensors.length === 0) return null

      const prefKey = `sensor-pref-${group.label}`
      const preferredSensorKey = deviceStatus.value?.preferences?.[prefKey] as string | undefined

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
    .filter((g): g is NonNullable<SensorGroupInfo> => g !== null)
})
</script>

<style scoped>
.cards-transition {
  transition: transform 0.1s linear;
}
</style>
