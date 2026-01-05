<template>
  <!--
    UnifiedSensorCard.vue
    =====================
    Compact sensor card displaying title, value, status, and optional mini chart.
    Refactored to use sub-components for better maintainability.
  -->
  <div
    class="relative rounded-lg group/card dark:border-gray-700 flex flex-col justify-between flex-1 min-w-0 transition-all duration-300"
    :class="[
      isPanelOpen 
        ? openBgClass 
        : 'bg-gray-50 dark:bg-gray-900'
    ]"
  >
    <!-- MINIMALIST MODE -->
    <Transition name="mode-switch" mode="out-in">
      <div 
        v-if="minimalMode" 
        key="minimal" 
        class="p-3 flex flex-col justify-start cursor-pointer"
        @click="$emit('toggle-graph')"
      >
        <!-- Title + Trend Row -->
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-medium" :class="isPanelOpen ? 'text-white' : darkerValueColorClass">{{ currentTitle }}</span>
          <!-- Trend Arrow (only if connected) -->
          <Icon
            v-if="shouldShowTrend"
            :name="trend === 'up' ? 'tabler:triangle-filled' : 'tabler:triangle-inverted-filled'"
            class="w-2 h-2"
            :class="trendColorClass"
            :title="trendTooltip"
          />
        </div>
        
        <!-- Value + Unit -->
        <div class="flex items-baseline">
          <span class="text-3xl font-bold tracking-tight" :class="isPanelOpen ? 'text-white' : valueColorClass">
            {{ displayValue }}
          </span>
          <span v-if="connectionStatus === 'connected'" class="text-base font-medium ml-1" :class="isPanelOpen ? 'text-white/70' : lightValueColorClass">{{ unit }}</span>
          <span v-else class="text-sm font-medium ml-1 opacity-60" :class="isPanelOpen ? 'text-white/50' : 'text-gray-500 dark:text-gray-400'">{{ timeSinceLastMeasurement }}</span>
        </div>
        
        <!-- Threshold Alert -->
        <SensorCardThreshold v-if="showAlertThresholds" :threshold="thresholdAlert" :isPanelOpen="isPanelOpen" />
      </div>

      <!-- NORMAL MODE -->
      <div v-else key="normal" class="flex flex-col h-full justify-between">
        <div class="pl-2" :class="showCharts && !minimalMode ? 'pb-0' : 'pb-3'">
          <!-- Header Row -->
          <div class="flex justify-between">
            <div class="flex items-center gap-1">
              <UITooltip :text="statusTooltip" position="top">
                <Icon
                  :name="statusIcon"
                  class="w-3 h-3"
                  :class="isPanelOpen ? 'text-white' : statusColor"
                />
              </UITooltip>
              <span 
                :class="[isPanelOpen ? 'text-white' : darkerValueColorClass, 'font-bold']" 
                class="text-[13px] cursor-pointer hover:opacity-80 transition-opacity"
                @click="$emit('toggle-graph')"
              >
                {{ currentTitle }}
              </span>
            </div>

            <div class="flex">
              <SensorDropdown
                :sensors="enabledSensors"
                :activeSensorKey="activeSensorKey"
                :moduleId="moduleId"
                :groupLabel="label"
                :color="color"
                :isPanelOpen="isPanelOpen"
                @select="selectSensor"
              />
            </div>
          </div>

          <!-- Value Display -->
          <SensorCardValue
            :value="displayRawValue"
            :unit="connectionStatus === 'connected' ? unit : ''"
            :trend="trend"
            :sensorKey="activeSensorKey"
            :color="color"
            :isPanelOpen="isPanelOpen"
            :showTrend="shouldShowTrend"
            :timeSince="connectionStatus !== 'connected' ? timeSinceLastMeasurement : null"
            class="cursor-pointer hover:opacity-80 transition-opacity"
            @click="$emit('toggle-graph')"
          />
          
          <!-- Threshold Alert -->
          <SensorCardThreshold 
            v-if="showAlertThresholds"
            :threshold="thresholdAlert" 
            :isPanelOpen="isPanelOpen" 
          />
        </div>

        <SensorMiniChart
          :history="activeHistory"
          :sensorKey="activeSensorKey"
          :label="label"
          :color="color"
          :moduleId="moduleId"
          :isPanelOpen="isPanelOpen"
          :isLoading="isLoading"
          :graphDuration="graphDuration"
          @maximize="$emit('toggle-graph')"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * UnifiedSensorCard - Main card component for sensor display.
 * Uses sub-components for value, threshold, dropdown, and chart.
 */
import { ref, computed, watch } from 'vue'
import type { SensorDataPoint } from '../types'
import { formatValue } from '~/utils/format'
import { useThresholds, useCardColors, useCountUp } from './composables'
import { useChartSettings } from '~/features/modules/common/module-panel/composables'

// Sub-components
import SensorCardValue from './SensorCardValue.vue'
import SensorCardThreshold from './SensorCardThreshold.vue'
import SensorDropdown from './SensorDropdown.vue'
import SensorMiniChart from './SensorMiniChart.vue'
import UITooltip from '~/components/design-system/UITooltip/UITooltip.vue'

// Health monitoring
import { useDeviceHealth } from '~/features/modules/common/composables/useDeviceHealth'

// ============================================================================
// Types
// ============================================================================

interface SensorItem {
  key: string
  label: string
  sensorLabel?: string // Pure sensor type label for card title (CO2, eCO2, PM1.0)
  value?: number
  status?: string
  model?: string
}

interface Props {
  label: string
  sensors: SensorItem[]
  historyMap: Record<string, SensorDataPoint[]>
  moduleId: string
  color: string
  isLoading?: boolean
  initialActiveSensorKey?: string
  graphDuration?: string
  isPanelOpen?: boolean
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  graphDuration: '24h',
  isPanelOpen: false,
})

const emit = defineEmits<{
  'toggle-graph': []
  'update:active-sensor': [key: string]
  'open-options': []
}>()

// ============================================================================
// Color Classes (from composable)
// ============================================================================

const {
  valueColorClass,
  lightValueColorClass,
  darkerValueColorClass,
  openBgClass,
  hoverShadowColor,
} = useCardColors(computed(() => props.color))

// ============================================================================
// Chart & Threshold Settings
// ============================================================================

const { evaluateThreshold, isTrendPositive } = useThresholds()
const { showCharts, showAlertThresholds, minimalMode } = useChartSettings(computed(() => props.moduleId))

// ============================================================================
// State
// ============================================================================

const activeSensorKey = ref(props.initialActiveSensorKey || props.sensors[0]?.key)

// Filter out disabled sensors for dropdown and graph
const enabledSensors = computed(() => 
  props.sensors.filter(s => s.status !== 'disabled')
)

// Ensure valid sensor key (must be from enabled sensors)
if (!enabledSensors.value.find(s => s.key === activeSensorKey.value)) {
  activeSensorKey.value = enabledSensors.value[0]?.key
}

// ============================================================================
// Health Monitoring
// ============================================================================

const { getConnectionStatus, getTimeSinceLastMeasurement } = useDeviceHealth(computed(() => props.moduleId))

const connectionStatus = computed(() => {
  if (!activeSensorKey.value) return 'unknown'
  return getConnectionStatus(activeSensorKey.value)
})

const timeSinceLastMeasurement = computed(() => {
  if (!activeSensorKey.value) return null
  return getTimeSinceLastMeasurement(activeSensorKey.value)
})

// ============================================================================
// Persist Sensor Selection
// ============================================================================

watch(activeSensorKey, async (newVal, oldVal) => {
  // Only save if the value actually changed (not just initialized)
  if (process.client && newVal && newVal !== oldVal) {
    emit('update:active-sensor', newVal)
    
    try {
      const prefKey = `sensor-pref-${props.label}`
      await $fetch(`/api/modules/${props.moduleId}/preferences`, {
        method: 'PATCH',
        body: { [prefKey]: newVal }
      })
    } catch (e) {
      console.error('Failed to save preference', e)
    }
  }
})

// ============================================================================
// Computed: Active Sensor
// ============================================================================

const activeSensor = computed(() => 
  props.sensors.find(s => s.key === activeSensorKey.value) || props.sensors[0]
)

const activeHistory = computed(() => 
  props.historyMap[activeSensorKey.value] || []
)

// ============================================================================
// Trend Calculation
// ============================================================================

const trend = computed<'up' | 'down' | 'stable'>(() => {
  const history = activeHistory.value
  if (!history || history.length < 6) return 'stable'
  
  const sorted = [...history]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6)
  
  const recentAvg = (sorted[0].value + sorted[1].value + sorted[2].value) / 3
  const olderAvg = (sorted[3].value + sorted[4].value + sorted[5].value) / 3
  
  const threshold = Math.abs(olderAvg) * 0.01 || 0.5
  const diff = recentAvg - olderAvg
  
  if (diff > threshold) return 'up'
  if (diff < -threshold) return 'down'
  return 'stable'
})

const trendColorClass = computed(() => {
  if (trend.value === 'stable') return 'text-gray-400'
  const isPositive = isTrendPositive(activeSensorKey.value, trend.value)
  if (isPositive === true) return 'text-emerald-500'
  if (isPositive === false) return 'text-red-500'
  return 'text-gray-400'
})

const trendTooltip = computed(() => {
  if (trend.value === 'stable') return ''
  const direction = trend.value === 'up' ? 'En hausse' : 'En baisse'
  const isPositive = isTrendPositive(activeSensorKey.value, trend.value)
  if (isPositive === true) return `${direction} (positif)`
  if (isPositive === false) return `${direction} (négatif)`
  return direction
})

// ============================================================================
// Actions
// ============================================================================

const selectSensor = (key: string) => {
  activeSensorKey.value = key
}

// ============================================================================
// Value Display (for minimalist mode which doesn't use sub-component)
// ============================================================================

const rawValue = computed(() => {
  const sensor = activeSensor.value
  if (!sensor || sensor.status === 'missing' || sensor.value === undefined) {
    return undefined
  }
  return sensor.value
})

// Only show trend if sensor is actually connected (not stale or offline)
const shouldShowTrend = computed(() => {
  if (connectionStatus.value !== 'connected') return false
  if (activeSensor.value?.status === 'missing') return false
  if (trend.value === 'stable') return false
  return true
})

// Display value: show '--' if not connected, otherwise show the value
const displayRawValue = computed(() => {
  if (connectionStatus.value !== 'connected') return undefined
  return rawValue.value
})

const animatedValue = useCountUp(displayRawValue, { duration: 400, threshold: 0.05 })

const formattedValue = computed(() => {
  if (animatedValue.value === undefined || animatedValue.value === null) {
    return '--'
  }
  return formatValue(animatedValue.value)
})

// Display value for minimalist mode (with time since last measurement if not connected)
const displayValue = computed(() => {
  if (connectionStatus.value === 'connected') {
    return formattedValue.value
  }
  // Show '--' for offline/stale sensors
  return '--'
})

// ============================================================================
// Unit Helper
// ============================================================================

import { getUnit as getUnitFromConfig, getSensorTypeFromKey } from '~/features/modules/common/config/sensors'

const getUnit = (sensorKey: string) => {
  if (!sensorKey) return ''
  // Extract sensor type from composite key (e.g., "dht22:temperature" -> "temperature")
  const sensorType = getSensorTypeFromKey(sensorKey)
  return getUnitFromConfig(sensorType)
}

const unit = computed(() => activeSensor.value ? getUnit(activeSensor.value.key) : '')

// ============================================================================
// Title Logic
// ============================================================================

const { t } = useI18n()

const currentTitle = computed(() => {
  // Helper to translate sensor type
  const translateType = (key: string) => {
    const type = getSensorTypeFromKey(key)
    return t(`sensors.${type}`)
  }

  // Helper to translate specific hardcoded labels if they match keys
  // This handles cases where we might have just a label string
  const translateLabel = (label: string) => {
    // Try to find matching key in SENSORS config by label (reverse lookup)
    // Or just check known labels
    if (label === 'Température') return t('sensors.temperature')
    if (label === 'Humidité') return t('sensors.humidity')
    if (label === 'Pression') return t('sensors.pressure')
    if (label === 'CO2') return t('sensors.co2')
    if (label === 'COV') return t('sensors.voc')
    if (label === 'Particules fines') return t('sensors.pm25') // Generic PM
    return label
  }

  // Use the active sensor key to determine the title
  if (activeSensor.value) {
    // For PM: show specific PM type 
    if (activeSensor.value.key.includes('pm')) {
      return translateType(activeSensor.value.key)
    }
    
    // For CO2/VOC: specific types
    if (activeSensor.value.key.includes('co2') || activeSensor.value.key.includes('voc')) {
      return translateType(activeSensor.value.key)
    }

    // Default to the translated label of the sensor type
    return translateType(activeSensor.value.key)
  }

  return translateLabel(props.label)
})

// ============================================================================
// Threshold Alert
// ============================================================================

const thresholdAlert = computed(() => {
  const sensor = activeSensor.value
  if (!sensor) return null
  return evaluateThreshold(sensor.key, sensor.value)
})

// ============================================================================
// Status Display
// ============================================================================

// Use health status for the status indicator (pastille)
const statusIcon = computed(() => {
  const healthStatus = connectionStatus.value
  if (healthStatus === 'connected') return 'tabler:circle-check-filled'
  if (healthStatus === 'stale') return 'tabler:alert-circle-filled'
  if (healthStatus === 'offline') return 'tabler:circle-x-filled'
  
  // Fallback to sensor status if health not available
  const sensor = activeSensor.value
  if (sensor?.status === 'ok') return 'tabler:circle-check-filled'
  if (sensor?.status === 'missing') return 'tabler:circle-x-filled'
  return 'tabler:circle-check-filled'
})

const statusColor = computed(() => {
  const healthStatus = connectionStatus.value
  if (healthStatus === 'connected') return valueColorClass.value
  if (healthStatus === 'stale') return 'text-amber-500'
  if (healthStatus === 'offline') return 'text-red-500'
  
  // Fallback to sensor status
  const sensor = activeSensor.value
  if (sensor?.status === 'ok') return valueColorClass.value
  if (sensor?.status === 'missing') return 'text-red-500'
  return valueColorClass.value
})

const statusTooltip = computed(() => {
  const model = activeSensor.value?.model || activeSensor.value?.label || 'Capteur'
  const healthStatus = connectionStatus.value
  const timeSince = timeSinceLastMeasurement.value
  
  if (healthStatus === 'connected') {
    return `${model}: Connecté ${timeSince ? `(il y a ${timeSince})` : ''}`
  }
  if (healthStatus === 'stale') {
    return `${model}: Ralenti ${timeSince ? `(il y a ${timeSince})` : ''}`
  }
  if (healthStatus === 'offline') {
    return `${model}: Hors ligne ${timeSince ? `(dernière mesure il y a ${timeSince})` : ''}`
  }
  
  // Fallback
  return `${model}: ${activeSensor.value?.status || 'Unknown'}`
})
</script>

<style scoped>
/* Card shadow when open */
.card-open-shadow {
  box-shadow: 0 4px 20px var(--shadow-color);
}

/* Mode switch animation */
.mode-switch-enter-active,
.mode-switch-leave-active {
  transition: all 0.25s ease-out;
}

.mode-switch-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.mode-switch-leave-to {
  opacity: 0;
  transform: scale(1.02);
}
</style>
