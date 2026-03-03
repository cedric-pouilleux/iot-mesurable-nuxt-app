<template>
  <ModuleLayout
    :title="$t(`modules.types.${module.type}`)"
    :is-online="deviceStatus?.system?.online"
    :error="error"
    :loading="pending"
    :loading-text="$t('loading.moduleData', { name: module.name })"
    :options-panel-open="optionsPanelOpen"
    @toggle-options="optionsPanelOpen = !optionsPanelOpen"
  >
    <template #header-actions>
      <ModuleHeaderActions v-model:options-panel-open="optionsPanelOpen" />
    </template>

    <template #options-panel>
      <SensorsModuleOptions
        :module-id="moduleId"
        :is-open="optionsPanelOpen"
        @zone-changed="$emit('zone-changed')"
        @open-zone-drawer="$emit('open-zone-drawer')"
      />
    </template>

    <template #cards>
      <ModuleCards
        :is-options-panel-pushed="optionsPanelOpen"
        :selected-graph-group="selectedGraphGroup"
        @toggle-graph="(group, activeKey) => toggleGraph(group, activeKey)"
        @open-options="optionsPanelOpen = true"
      />
    </template>

    <template #extra>
      <SensorDetailGraph
        v-if="selectedGraphGroup"
        :group="selectedGraphGroup"
        :initial-active-sensor="selectedGraphActiveSensor"
        @close="selectedGraphGroup = null"
      />
    </template>
  </ModuleLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch, provide } from 'vue'
import type { SensorGroupInfo } from './common/card/composables/useSensorDetailGraphState'
import ModuleLayout from './common/layout/ModuleLayout.vue'
import ModuleHeaderActions from './common/ModuleHeaderActions.vue'
import SensorsModuleOptions from './common/module-panel/SensorsModuleOptions.vue'
import ModuleCards from './common/card/ModuleCards.vue'
import SensorDetailGraph from './common/card/SensorDetailGraph.vue'
import { useChartSettings } from '~/features/modules/common/module-panel/composables'
import { ModuleContextKey } from './common/composables/useModuleContext'
import type { Module } from './common/types'
import { useModuleServices } from '~/composables/useModuleServices'

defineEmits<{
  (e: 'zone-changed'): void
  (e: 'open-zone-drawer'): void
}>()

const props = defineProps<{
  module: Module
}>()

const { fetchModuleInfos, fetchModuleSensorsGraphData } = useModuleServices()

const deviceStatus = ref()
const sensorData = ref()
const optionsPanelOpen = ref(false)
const selectedGraphGroup = ref<SensorGroupInfo | null>(null)
const selectedGraphActiveSensor = ref<string | null>(null)

const moduleId = computed(() => props.module.id)

const { debouncedGraphDuration: graphDuration } = useChartSettings(computed(() => moduleId.value))

const { pending, error } = useAsyncData(`module-${moduleId.value}`, async () => {
  deviceStatus.value = await fetchModuleInfos(moduleId.value)
  sensorData.value = await fetchModuleSensorsGraphData(moduleId.value)
})

// move graph duration fetch responsability
watch(graphDuration, async newDuration => {
  const sensors = await fetchModuleSensorsGraphData(moduleId.value, newDuration)
  if (sensors) {
    sensorData.value = sensors
  }
})

// TODO => remove sensorGraphs, deep dive and refactor

const toggleGraph = (group: SensorGroupInfo, activeSensorKey: string) => {
  if (selectedGraphGroup.value?.type === group.type) {
    selectedGraphGroup.value = null
    selectedGraphActiveSensor.value = null
  } else {
    selectedGraphGroup.value = group
    selectedGraphActiveSensor.value = activeSensorKey
  }
}

provide(ModuleContextKey, {
  moduleId,
  deviceStatus,
  sensorData,
  graphDuration,
})
</script>

<style scoped>
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
