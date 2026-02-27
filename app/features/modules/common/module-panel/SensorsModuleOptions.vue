<template>
  <div class="options-wrapper" :class="{ 'is-open': isOpen }">
    <div class="options-content">
      <div class="grid grid-cols-6 gap-4 mb-5 items-stretch">
        <DeviceInfoSection :device-status="deviceStatus" :module-id="moduleId" />
        <ModuleConfigurationSection
          :module-id="moduleId"
          @open-zone-drawer="$emit('open-zone-drawer')"
          @zone-changed="$emit('zone-changed')"
        />
        <SensorConfigSection
          :device-status="deviceStatus"
          :module-id="moduleId"
          :sensor-history-map="sensorHistoryMap"
          :db-size="dbSize"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import type { DeviceStatus, SensorDataPoint } from '../types'
import DeviceInfoSection from './DeviceInfoSection.vue'
import ModuleConfigurationSection from './ModuleConfigurationSection.vue'
import SensorConfigSection from '~/features/sensor-configuration/components/SensorConfigSection.vue'
import { useDatabase } from '~/features/modules/common/composables/useDatabase'

interface Props {
  isOpen: boolean
  moduleId: string
  deviceStatus: DeviceStatus | null
  sensorHistoryMap?: Record<string, SensorDataPoint[]>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'toggle-zone': [zoneId: string]
  'open-zone-drawer': []
  'zone-changed': []
}>()

const { dbSize, loadDbSize } = useDatabase()

watch(
  () => props.isOpen,
  isOpen => {
    if (isOpen) {
      loadDbSize()
    }
  }
)
</script>

<style scoped>
.options-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.options-wrapper.is-open {
  grid-template-rows: 1fr;
}

.options-content {
  min-height: 0;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.1s ease-out,
    visibility 0s 0.1s;
}

.options-wrapper.is-open .options-content {
  opacity: 1;
  visibility: visible;
  padding-bottom: 1.25rem;
  transition:
    opacity 0.3s ease-out 0.15s,
    visibility 0s 0s;
}
</style>
