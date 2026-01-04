<template>
  <!--
    HardwareSensorRow.vue
    =====================
    Compact row for hardware sensor with measurements, interval control, and reset button.
    All elements on a single line for maximum density.
    
    REFACTORED: Extracted logic into composables and sub-components for better maintainability.
  -->
  <div class="flex items-center gap-2">
    
    <!-- Status Indicator -->
    <SensorStatusIndicator 
      :status="computedStatus"
      :isEnabled="isEnabled"
    />
    
    <!-- Hardware Name -->
    <span 
      class="text-xs font-semibold flex-shrink-0" 
      :class="isEnabled ? statusTextClass : 'text-gray-400 dark:text-gray-500'"
    >
      {{ hardware.name }}
    </span>
    
    <!-- Measurement badges (only when enabled) -->
    <SensorMeasurementBadges 
      :measurements="hardware.measurements"
      :isEnabled="isEnabled"
    />
    
    <!-- Spacer -->
    <div class="flex-1"></div>
    
    <!-- Time Counter (only when enabled) -->
    <span 
      v-if="isEnabled"
      class="text-[10px] text-gray-400 dark:text-gray-300 flex-shrink-0"
    >
      {{ timeAgo || '--' }}
    </span>
    
    <!-- Action Buttons (stop/play/reset) -->
    <SensorActionButtons
      :isEnabled="isEnabled"
      :toggling="toggling"
      :resetting="resetting"
      @toggle="handleToggle"
      @reset="handleReset"
    />
    
    <!-- Interval Control (disabled when stopped) -->
    <UITooltip text="Intervalle de lecture (sec)">
      <UISlider
        v-model="localInterval"
        :min="10"
        :max="300"
        :step="10"
        suffix="s"
        :disabled="!isEnabled || hardware.status === 'missing'"
        @change="handleIntervalChange"
      />
    </UITooltip>
  </div>
</template>

<script setup lang="ts">
/**
 * HardwareSensorRow - Compact single-line row for hardware sensor
 * 
 * REFACTORED to use:
 * - useHardwareSensorHistory: for data resolution
 * - useHardwareSensorActions: for API actions
 * - status-helpers: for display logic
 * - Sub-components: for UI elements
 */
import { ref, computed, watch, toRef } from 'vue'
import { useTimeAgo } from '~/composables/useTimeAgo'
import type { SensorDataPoint } from '~/features/modules/common/types'
import UISlider from '~/components/design-system/UISlider/UISlider.vue'
import UITooltip from '~/components/design-system/UITooltip/UITooltip.vue'
import { calculateSensorStatus } from '../utils/status-calculator'
import { getStatusTextClass } from '../utils/status-helpers'
import { useHardwareSensorHistory } from '../composables/useHardwareSensorHistory'
import { useHardwareSensorActions } from '../composables/useHardwareSensorActions'
import SensorStatusIndicator from './SensorStatusIndicator.vue'
import SensorMeasurementBadges from './SensorMeasurementBadges.vue'
import SensorActionButtons from './SensorActionButtons.vue'

// ============================================================================
// Types
// ============================================================================

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
  enabled: boolean  // From backend/ESP32 state
}

interface Props {
  hardware: HardwareData
  moduleId: string
  sensorHistoryMap?: Record<string, SensorDataPoint[]>
}

// ============================================================================
// Props & State
// ============================================================================

const props = withDefaults(defineProps<Props>(), {
  sensorHistoryMap: () => ({})
})

const emit = defineEmits<{
  'interval-change': [hardwareKey: string, interval: number]
  'enabled-change': [hardwareKey: string, enabled: boolean]
}>()

const localInterval = ref(props.hardware.interval)
const isEnabled = ref(props.hardware.enabled)

// Sync isEnabled when props change (e.g., after ESP32 status update)
watch(() => props.hardware.enabled, (newEnabled) => {
  if (!toggling.value) {
    isEnabled.value = newEnabled
  }
})

watch(() => props.hardware.interval, (newVal) => {
  localInterval.value = newVal
})

// ============================================================================
// History Resolution (using composable)
// ============================================================================

const firstMeasurement = computed(() => props.hardware.measurements[0])
const measureKey = computed(() => firstMeasurement.value?.key || '')

const { lastUpdate } = useHardwareSensorHistory(
  toRef(props.hardware, 'hardwareKey'),
  measureKey,
  toRef(props, 'sensorHistoryMap')
)

// ============================================================================
// Status Calculation
// ============================================================================

const computedStatus = computed(() => {
  if (!firstMeasurement.value) return 'unknown'
  if (!lastUpdate.value) return 'unknown'
  return calculateSensorStatus(lastUpdate.value, props.hardware.interval)
})

const statusTextClass = computed(() => getStatusTextClass(computedStatus.value))

// ============================================================================
// Time Ago
// ============================================================================

const timeAgo = useTimeAgo(() => lastUpdate.value)

// ============================================================================
// Actions (using composable)
// ============================================================================

const { resetting, toggling, saving, resetSensor, toggleEnabled, updateInterval } = 
  useHardwareSensorActions(toRef(props, 'moduleId'))

const handleToggle = async () => {
  const previousState = isEnabled.value
  const newState = await toggleEnabled(props.hardware.hardwareKey, isEnabled.value)
  
  if (newState !== previousState) {
    isEnabled.value = newState
    emit('enabled-change', props.hardware.hardwareKey, newState)
  }
}

const handleReset = async () => {
  await resetSensor(props.hardware.hardwareKey, props.hardware.name)
}

// ============================================================================
// Interval Change with Debounce
// ============================================================================

let intervalDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(localInterval, (newVal) => {
  if (intervalDebounceTimer) clearTimeout(intervalDebounceTimer)
  intervalDebounceTimer = setTimeout(() => {
    emit('interval-change', props.hardware.hardwareKey, newVal)
  }, 100)
})

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null

const handleIntervalChange = async () => {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  
  saveDebounceTimer = setTimeout(async () => {
    await updateInterval(props.hardware.hardwareKey, localInterval.value)
  }, 500)
}
</script>
