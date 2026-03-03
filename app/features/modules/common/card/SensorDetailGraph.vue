<template>
  <div v-if="group" class="mt-5">
    <SensorCardOpen :title="dynamicTitle" :color="dynamicColor" @close="$emit('close')">
      <template #header-extra>
        <div class="flex items-center gap-3">
          <div
            v-if="enabledSensors && enabledSensors.length > 1"
            class="inline-flex items-stretch rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <template v-for="(sensor, index) in enabledSensors" :key="sensor.key">
              <div
                v-if="index > 0"
                class="w-[1px] h-3/5 bg-gray-200 dark:bg-gray-700 self-center"
              ></div>

              <button
                class="px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer h-full flex items-center gap-1.5 select-none"
                :class="
                  selectedSensorKeys.has(sensor.key)
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                "
                :title="getSensorDisplayLabel(sensor)"
                @click="toggleSensor(sensor.key)"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: getSensorShadeColor(index) }"
                ></span>
                {{ getSensorDisplayLabel(sensor) }}
              </button>
            </template>
          </div>

          <!-- Auto-zoom toggle -->
          <button
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer select-none border"
            :class="
              autoZoom
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            "
            title="Adapter l'échelle aux données"
            @click="autoZoom = !autoZoom"
          >
            <Icon name="tabler:zoom-in-area" class="w-4 h-4" />
            Auto-zoom
          </button>

          <!-- Bucket selector (server-side smoothing) -->
          <UITooltip text="Lissage : intervalle de moyenne des points">
            <div
              class="inline-flex items-stretch rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <template v-for="(option, index) in filteredBucketOptions" :key="option.value">
                <div
                  v-if="index > 0"
                  class="w-[1px] h-3/5 bg-gray-200 dark:bg-gray-700 self-center"
                ></div>
                <button
                  class="px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer h-full flex items-center select-none"
                  :class="
                    selectedBucket === option.value
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  "
                  :title="option.title"
                  @click="selectBucket(option.value)"
                >
                  {{ option.label }}
                </button>
              </template>
            </div>
          </UITooltip>

          <!-- Time range selector -->
          <UITooltip text="Durée : période de temps affichée sur le graphique">
            <div
              class="inline-flex items-stretch rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <template v-for="(option, index) in filteredDurationOptions" :key="option.value">
                <div
                  v-if="index > 0"
                  class="w-[1px] h-3/5 bg-gray-200 dark:bg-gray-700 self-center"
                ></div>
                <button
                  class="px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer h-full flex items-center select-none"
                  :class="
                    selectedDuration === option.value
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  "
                  :title="option.label"
                  @click="selectedDuration = option.value"
                >
                  {{ option.label }}
                </button>
              </template>
            </div>
          </UITooltip>
        </div>
      </template>

      <ClientOnly>
        <div
          v-if="isLoadingData"
          class="h-full flex items-center justify-center text-[10px] text-gray-400"
        >
          Chargement des données détaillées...
        </div>
        <Line
          v-else-if="chartData"
          :key="chartVersion"
          :data="chartData"
          :options="chartOptions"
          :plugins="chartPlugins"
        />
        <template #fallback>
          <div class="h-full flex items-center justify-center text-[10px] text-gray-300">
            Chargement...
          </div>
        </template>
      </ClientOnly>
      <div
        v-if="!isLoadingData && !hasHistory"
        class="h-full flex items-center justify-center text-gray-400"
      >
        Pas assez de données pour afficher le graphique détaillé.
      </div>
    </SensorCardOpen>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Filler,
  Tooltip,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import 'chartjs-adapter-date-fns'
import annotationPlugin from 'chartjs-plugin-annotation'
import SensorCardOpen from './SensorCardOpen.vue'
import UITooltip from '~/components/design-system/UITooltip/UITooltip.vue'
import { useI18n } from 'vue-i18n'
import { getSensorUnit } from '../utils/sensors'

import { useSensorDetailData } from './composables/useSensorDetailData'
import { useSensorDetailChart } from './composables/useSensorDetailChart'
import type { SensorGroupInfo, SensorItem } from './composables/useSensorDetailGraphState'
import { useModuleContext } from '../composables/useModuleContext'

if (process.client) {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale,
    Filler,
    Tooltip
  )
}

const chartPlugins = [annotationPlugin]

interface Props {
  group: SensorGroupInfo
  initialActiveSensor?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  initialActiveSensor: null,
})

defineEmits<{
  close: []
}>()

const { moduleId } = useModuleContext()
const groupRef = computed(() => props.group)
const initialActiveSensorRef = computed(() => props.initialActiveSensor)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const { t } = useI18n()

// State for multi-sensor selection
const selectedSensorKeys = ref<Set<string>>(new Set())

// Initialize with the active sensor from the card (or fallback to primary sensor from group)
watch(
  () => props.initialActiveSensor,
  initial => {
    const sensorToSelect = initial || props.group.initialKey
    if (sensorToSelect) {
      selectedSensorKeys.value = new Set([sensorToSelect])
    }
  },
  { immediate: true }
)

const {
  historyMap,
  isLoadingData,
  autoZoom,
  filteredDurationOptions,
  selectedDuration,
  filteredBucketOptions,
  selectedBucket,
  getPrimaryHistory,
  filterByDuration,
  selectBucket,
  hasHistory,
} = useSensorDetailData(moduleId, groupRef, initialActiveSensorRef, selectedSensorKeys)

const {
  chartData,
  chartOptions,
  baseHexColor,
  getSensorDisplayLabel,
  getSensorShadeColor,
  getSensorColorByKey,
} = useSensorDetailChart(
  moduleId,
  groupRef,
  selectedSensorKeys,
  historyMap,
  autoZoom,
  hasHistory,
  isDark,
  filterByDuration,
  getPrimaryHistory
)

// Filter out disabled sensors from the chip selector
const enabledSensors = computed(() =>
  (props.group.sensors || []).filter((s: SensorItem) => s.status !== 'disabled')
)

const hasMixedUnits = computed(() => {
  if (!enabledSensors.value || enabledSensors.value.length <= 1) return false

  const units = new Set(
    enabledSensors.value.map((sensor: SensorItem) => {
      const parts = sensor.key.split(':')
      const sensorType = parts.length > 1 ? parts[1].toLowerCase() : sensor.key.toLowerCase()
      return getSensorUnit(sensorType) || ''
    })
  )

  return units.size > 1
})

const toggleSensor = (sensorKey: string) => {
  // If mixed units, behave like radio buttons (exclusive selection)
  if (hasMixedUnits.value) {
    selectedSensorKeys.value = new Set([sensorKey])
    return
  }

  // Normal toggle behavior for uniform units
  const newSet = new Set(selectedSensorKeys.value)
  if (newSet.has(sensorKey)) {
    // Don't allow deselecting the last sensor
    if (newSet.size > 1) {
      newSet.delete(sensorKey)
    }
  } else {
    newSet.add(sensorKey)
  }
  selectedSensorKeys.value = newSet
}

const dynamicTitle = computed(() => {
  if (!hasMixedUnits.value) return props.group.label

  const firstKey = Array.from(selectedSensorKeys.value)[0]
  if (!firstKey) return props.group.label

  const parts = firstKey.split(':')
  const keyLower = parts.length > 1 ? parts[1].toLowerCase() : firstKey.toLowerCase()

  return t(`sensors.${keyLower}`)
})

const dynamicColor = computed(() => {
  if (!hasMixedUnits.value) return baseHexColor.value

  const firstKey = Array.from(selectedSensorKeys.value)[0]
  if (!firstKey) return baseHexColor.value

  return getSensorColorByKey(firstKey)
})

// Version counter to force Chart.js re-render
const chartVersion = ref(0)
watch(
  historyMap,
  () => {
    chartVersion.value++
  },
  { deep: true }
)
</script>

<style scoped>
/* Shadow separator top (inverted - shadow goes down) */
.shadow-separator-top {
  background: radial-gradient(
    ellipse 70% 100% at center top,
    rgba(0, 0, 0, 0.08) 0%,
    transparent 100%
  );
}

:global(.dark) .shadow-separator-top {
  background: radial-gradient(
    ellipse 70% 100% at center top,
    rgba(0, 0, 0, 0.9) 0%,
    transparent 100%
  );
}
</style>
