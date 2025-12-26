<template>
    <div v-if="selectedSensor" class="mt-5">
      <SensorCardOpen
        :title="dynamicTitle"
        :color="dynamicColor"
        @close="$emit('close')"
      >
        <template #header-extra>
          <div class="flex items-center gap-3">
            <!-- Sensor selector chips -->
            <div v-if="enabledSensors && enabledSensors.length > 1" class="inline-flex items-stretch rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <template v-for="(sensor, index) in enabledSensors" :key="sensor.key">
                <!-- Separator -->
                <div 
                  v-if="index > 0" 
                  class="w-[1px] h-3/5 bg-gray-200 dark:bg-gray-700 self-center"
                ></div>
                
                <button
                  @click="toggleSensor(sensor.key)"
                  class="px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer h-full flex items-center gap-1.5 select-none"
                  :class="selectedSensorKeys.has(sensor.key) 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
                  :title="getSensorDisplayLabel(sensor)"
                >
                  <span 
                    class="w-1.5 h-1.5 rounded-full" 
                    :style="{ backgroundColor: getSensorShadeColor(index) }"
                  ></span>
                  {{ getSensorDisplayLabel(sensor) }}
                </button>
              </template>
            </div>

            <!-- Auto-zoom toggle -->
            <button
              @click="autoZoom = !autoZoom"
              class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer select-none border"
              :class="autoZoom 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
              title="Adapter l'échelle aux données"
            >
              <Icon name="tabler:zoom-in-area" class="w-3.5 h-3.5" />
              Auto-zoom
            </button>

            <!-- Smoothing toggle -->
            <button
              @click="smoothingEnabled = !smoothingEnabled"
              class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer select-none border"
              :class="smoothingEnabled 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
              title="Lisser les courbes pour atténuer les pics"
            >
              <Icon name="tabler:wave-sine" class="w-3.5 h-3.5" />
              Lissage
            </button>

            <!-- Time range selector -->
            <div class="inline-flex items-stretch rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <template v-for="(option, index) in durationOptions" :key="option.value">
                <div 
                  v-if="index > 0" 
                  class="w-[1px] h-3/5 bg-gray-200 dark:bg-gray-700 self-center"
                ></div>
                <button
                  @click="selectedDuration = option.value"
                  class="px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer h-full flex items-center select-none"
                  :class="selectedDuration === option.value 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
                  :title="option.label"
                >
                  {{ option.label }}
                </button>
              </template>
            </div>
          </div>
        </template>
        
        <ClientOnly>
          <Line v-if="chartData" :data="chartData" :options="chartOptions" />
          <template #fallback>
            <div class="h-full flex items-center justify-center text-[10px] text-gray-300">
              Chargement...
            </div>
          </template>
        </ClientOnly>
        <div v-if="!hasHistory" class="h-full flex items-center justify-center text-gray-400">
          Pas assez de données pour afficher le graphique détaillé.
        </div>
      </SensorCardOpen>
    </div>
</template>

<script setup lang="ts">
import type { SensorDataPoint } from '../types'
import type { ChartData, ChartOptions } from 'chart.js'
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
import { getSensorRange, getNormalizationRatio } from '../config/sensors'
import SensorCardOpen from './SensorCardOpen.vue'

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

interface SensorItem {
  key: string
  label: string
  value?: number
  status?: string
  model?: string
}

interface Props {
  selectedSensor: string | null
  initialActiveSensor?: string | null // Pre-select this sensor from the card
  history: SensorDataPoint[]
  sensorLabel: string
  sensorColor: string
  sensorUnit: string
  availableSensors?: SensorItem[]
  sensorHistoryMap?: Record<string, SensorDataPoint[]>
}

const props = withDefaults(defineProps<Props>(), {
  selectedSensor: null,
  initialActiveSensor: null,
  history: () => [],
  availableSensors: () => [],
  sensorHistoryMap: () => ({}),
})

defineEmits<{
  close: []
}>()

// Color mode detection for grid color
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// Filter out disabled sensors from the chip selector
const enabledSensors = computed(() => 
  (props.availableSensors || []).filter(s => s.status !== 'disabled')
)

// State for multi-sensor selection
const selectedSensorKeys = ref<Set<string>>(new Set())

// Auto-zoom state: when enabled, Y-axis adapts to data range instead of fixed range
const autoZoom = ref(false)

// Duration options for time range selector
const durationOptions = [
  { value: '1h', label: '1h', hours: 1 },
  { value: '6h', label: '6h', hours: 6 },
  { value: '24h', label: '24h', hours: 24 },
  { value: '7d', label: '7j', hours: 168 },
]

// Selected duration state (defaults to 24h)
const selectedDuration = ref('24h')

// Get hours from selected duration
const selectedDurationHours = computed(() => {
  const option = durationOptions.find(o => o.value === selectedDuration.value)
  return option?.hours || 24
})

// Filter data by selected duration
const filterByDuration = (data: SensorDataPoint[]): SensorDataPoint[] => {
  if (!data || data.length === 0) return []
  
  const now = Date.now()
  const cutoffMs = now - (selectedDurationHours.value * 60 * 60 * 1000)
  
  return data.filter(point => {
    const pointTime = point.time instanceof Date ? point.time.getTime() : new Date(point.time).getTime()
    return pointTime >= cutoffMs
  })
}

// Smoothing state: when enabled, applies moving average to smooth out spikes
const smoothingEnabled = ref(false)

// Smoothing window size based on duration (more points for longer durations)
const smoothingWindowSize = computed(() => {
  const hours = selectedDurationHours.value
  if (hours <= 1) return 3      // 1h: small window
  if (hours <= 6) return 5      // 6h: medium window  
  if (hours <= 24) return 7     // 24h: larger window
  return 11                     // 7d: largest window
})

// Apply moving average smoothing to data
const applySmoothing = (data: SensorDataPoint[]): SensorDataPoint[] => {
  if (!smoothingEnabled.value || data.length < 3) return data
  
  const windowSize = smoothingWindowSize.value
  const halfWindow = Math.floor(windowSize / 2)
  
  return data.map((point, index) => {
    // Calculate window bounds
    const start = Math.max(0, index - halfWindow)
    const end = Math.min(data.length - 1, index + halfWindow)
    
    // Calculate average of values in window
    let sum = 0
    let count = 0
    for (let i = start; i <= end; i++) {
      if (data[i].value !== null && data[i].value !== undefined) {
        sum += data[i].value
        count++
      }
    }
    
    const smoothedValue = count > 0 ? sum / count : point.value
    
    return {
      ...point,
      value: smoothedValue
    }
  })
}

// Initialize with the active sensor from the card (or fallback to primary sensor)
watch(() => [props.selectedSensor, props.initialActiveSensor] as const, ([selected, initial]) => {
  // Prefer initialActiveSensor from the card, otherwise use selectedSensor
  const sensorToSelect = initial || selected
  if (sensorToSelect) {
    selectedSensorKeys.value = new Set([sensorToSelect])
  }
}, { immediate: true })

// Toggle sensor selection
// VOC/TVOC are exclusive (can't combine different scales)
const exclusiveSensorGroups = [['voc', 'tvoc']]

const toggleSensor = (sensorKey: string) => {
  const parts = sensorKey.split(':')
  const sensorType = parts.length > 1 ? parts[1].toLowerCase() : sensorKey.toLowerCase()
  
  // Check if this sensor belongs to an exclusive group
  const exclusiveGroup = exclusiveSensorGroups.find(group => group.includes(sensorType))
  
  if (exclusiveGroup) {
    // Exclusive selection: replace the current selection with this sensor
    selectedSensorKeys.value = new Set([sensorKey])
    return
  }
  
  // Normal toggle behavior for other sensors
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

// Color shade multipliers for different sensors (index-based)
const shadeMultipliers = [1.0, 0.7, 1.3, 0.5, 1.5] // base, darker, lighter, darkest, lightest

// Get color shade for a sensor based on its index
const getSensorShadeColor = (index: number): string => {
  const baseColor = props.sensorColor
  const multiplier = shadeMultipliers[index % shadeMultipliers.length]
  
  // Parse hex color
  const r = parseInt(baseColor.slice(1, 3), 16)
  const g = parseInt(baseColor.slice(3, 5), 16)
  const b = parseInt(baseColor.slice(5, 7), 16)
  
  // Apply shade multiplier (clamp to 0-255)
  const adjustedR = Math.min(255, Math.max(0, Math.round(r * multiplier)))
  const adjustedG = Math.min(255, Math.max(0, Math.round(g * multiplier)))
  const adjustedB = Math.min(255, Math.max(0, Math.round(b * multiplier)))
  
  return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`
}

// Get sensor color by key (for chart datasets)
const getSensorColorByKey = (sensorKey: string): string => {
  const index = props.availableSensors?.findIndex(s => s.key === sensorKey) ?? 0
  return getSensorShadeColor(index)
}

// Get display label for a sensor (PM sensors show their type, others show model)
const getSensorDisplayLabel = (sensor: SensorItem): string => {
  // PM sensors: show the PM type (PM1.0, PM2.5, etc.) instead of the model
  const keyParts = sensor.key.split(':')
  const sensorType = keyParts.length > 1 ? keyParts[1] : sensor.key
  
  if (/^pm\d/.test(sensorType)) {
    return sensor.label
  }
  // Other sensors: prefer model name if available
  return sensor.model || sensor.label
}

// Dynamic title based on sensor type
// Only COV/TVOC sensors have dynamic titles, others use the group label
const dynamicTitle = computed(() => {
  const firstKey = Array.from(selectedSensorKeys.value)[0]
  if (!firstKey) return props.sensorLabel
  
  const parts = firstKey.split(':')
  const keyLower = parts.length > 1 ? parts[1].toLowerCase() : firstKey.toLowerCase()
  
  // COV sensors: show different titles based on active sensor
  if (keyLower === 'tvoc') {
    return 'Composés Organiques Volatils Totaux'
  }
  if (keyLower === 'voc') {
    return 'Composés Organiques Volatils'
  }
  
  // All other sensors (Temperature, Humidity, PM, etc.) use the group label
  return props.sensorLabel
})

// Dynamic color based on selected sensor
// Only changes for COV/TVOC (exclusive selection), otherwise uses the base group color
const dynamicColor = computed(() => {
  const firstKey = Array.from(selectedSensorKeys.value)[0]
  if (!firstKey) return props.sensorColor
  
  // Only COV/TVOC can change color (exclusive selection)
  const parts = firstKey.split(':')
  const keyLower = parts.length > 1 ? parts[1].toLowerCase() : firstKey.toLowerCase()
  
  if (keyLower === 'voc' || keyLower === 'tvoc') {
    return getSensorColorByKey(firstKey)
  }
  
  // All other sensors keep the base group color
  return props.sensorColor
})

const hasHistory = computed(() => props.history && props.history.length >= 2)

// Collect all data values for dynamic range calculation (uses filtered data)
const allDataValues = computed(() => {
  const values: number[] = []
  
  // Multi-sensor mode
  if (props.sensorHistoryMap && Object.keys(props.sensorHistoryMap).length > 0) {
    for (const sensorKey of selectedSensorKeys.value) {
      const rawHistory = props.sensorHistoryMap[sensorKey]
      const sensorHistory = filterByDuration(rawHistory || [])
      if (sensorHistory.length > 0) {
        const ratio = getNormalizationRatio(sensorKey)
        values.push(...sensorHistory.map(d => d.value / ratio).filter(v => v !== null && v !== undefined))
      }
    }
  } else if (props.history) {
    // Single sensor mode - also filter
    const filteredHistory = filterByDuration(props.history)
    values.push(...filteredHistory.map(d => d.value).filter(v => v !== null && v !== undefined))
  }
  
  return values
})

const graphMinMax = computed(() => {
  // If auto-zoom is enabled, calculate dynamic range based on actual data
  if (autoZoom.value) {
    const values = allDataValues.value
    if (values.length === 0) return { min: 0, max: 100 }
    
    const dataMin = Math.min(...values)
    const dataMax = Math.max(...values)
    const range = dataMax - dataMin || 1
    
    // Add 5% padding on each side for better visualization
    const padding = range * 0.05
    return {
      min: Math.floor(dataMin - padding),
      max: Math.ceil(dataMax + padding),
    }
  }
  
  // Fixed range mode: use the first selected sensor to determine the range
  const firstKey = Array.from(selectedSensorKeys.value)[0]
  const sensorType = (firstKey || props.selectedSensor)?.toLowerCase() || ''
  const range = getSensorRange(sensorType)
  
  if (range) {
    return range
  }

  // Fallback to dynamic calculation for unknown sensors
  if (!hasHistory.value) return { min: 0, max: 100 }
  const values = props.history.map(d => d.value).filter(v => v !== null && v !== undefined)
  if (values.length === 0) return { min: 0, max: 100 }
  let min = Math.min(...values)
  let max = Math.max(...values)

  const range2 = max - min || 1
  let minWithPadding = min - range2 * 0.1
  let maxWithPadding = max + range2 * 0.1

  return {
    min: minWithPadding,
    max: maxWithPadding,
  }
})

// Configuration Chart.js with multi-sensor support
const chartData = computed<ChartData<'line'> | null>(() => {
  const hexToRgba = (color: string, alpha: number): string => {
    // Handle both hex (#ffffff) and rgb(r, g, b) formats
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    } else if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
    }
    return color
  }

  // Check if we have multi-sensor data available
  const hasMultiSensorData = props.availableSensors && 
    props.availableSensors.length > 1 && 
    Object.keys(props.sensorHistoryMap || {}).length > 0

  if (hasMultiSensorData) {
    // Multi-sensor mode: create one dataset per selected sensor
    const datasets = []
    
    for (const sensorKey of selectedSensorKeys.value) {
      // Filter by selected duration
      const rawHistory = props.sensorHistoryMap?.[sensorKey]
      const sensorHistory = filterByDuration(rawHistory || [])
      if (sensorHistory.length < 2) continue
      
      const sensor = props.availableSensors?.find(s => s.key === sensorKey)
      const color = getSensorColorByKey(sensorKey)
      
      // Get normalization ratio for this sensor (e.g., TVOC / 100)
      const ratio = getNormalizationRatio(sensorKey)
      
      const sortedData = [...sensorHistory].sort((a, b) => {
        const timeA = a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime()
        const timeB = b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime()
        return timeA - timeB
      })
      
      // Apply smoothing if enabled
      const processedData = applySmoothing(sortedData)
      
      // Apply normalization ratio to values
      const normalizedData = processedData.map(m => ({ 
        x: m.time as unknown as number, 
        y: m.value / ratio 
      }))
      
      datasets.push({
        label: sensor ? getSensorDisplayLabel(sensor) : sensorKey,
        backgroundColor: hexToRgba(color, 0.1),
        borderColor: color,
        borderWidth: 2,
        data: normalizedData,
        tension: 0.2,
        fill: false, // No fill for multi-line to avoid overlap
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: color,
        hitRadius: 8,
        spanGaps: true,
      })
    }
    
    if (datasets.length === 0) return null
    return { datasets }
  }

  // Fallback: single sensor mode (original behavior)
  if (!hasHistory.value) return null

  // Filter by selected duration for single sensor mode
  const filteredHistory = filterByDuration(props.history)
  if (filteredHistory.length < 2) return null

  const sortedData = [...filteredHistory].sort((a, b) => {
    const timeA = a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime()
    const timeB = b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime()
    return timeA - timeB
  })

  // Apply smoothing if enabled
  const processedData = applySmoothing(sortedData)

  // Calculate average time gap to detect significant gaps
  const timeGaps: number[] = []
  for (let i = 1; i < processedData.length; i++) {
    const t1 = processedData[i-1].time instanceof Date ? processedData[i-1].time.getTime() : new Date(processedData[i-1].time).getTime()
    const t2 = processedData[i].time instanceof Date ? processedData[i].time.getTime() : new Date(processedData[i].time).getTime()
    timeGaps.push(t2 - t1)
  }
  
  // Gap threshold: 5x the median gap (or 10 min minimum)
  const medianGap = timeGaps.length > 0 ? timeGaps.sort((a, b) => a - b)[Math.floor(timeGaps.length / 2)] : 60000
  const gapThreshold = Math.max(medianGap * 5, 10 * 60 * 1000) // 10 min minimum

  // Pre-compute gap indices for segment styling
  const gapIndices = new Set<number>()
  for (let i = 1; i < processedData.length; i++) {
    const t1 = processedData[i-1].time instanceof Date ? processedData[i-1].time.getTime() : new Date(processedData[i-1].time).getTime()
    const t2 = processedData[i].time instanceof Date ? processedData[i].time.getTime() : new Date(processedData[i].time).getTime()
    if (t2 - t1 > gapThreshold) {
      gapIndices.add(i - 1)
    }
  }

  return {
    datasets: [
      {
        label: props.sensorLabel,
        backgroundColor: hexToRgba(props.sensorColor, 0.2),
        borderColor: props.sensorColor,
        borderWidth: 2,
        data: processedData.map(m => ({ x: m.time as unknown as number, y: m.value })),
        tension: 0.2,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 3,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: props.sensorColor,
        hitRadius: 10,
        spanGaps: true,
        segment: {
          borderDash: (ctx: { p0DataIndex: number }) => gapIndices.has(ctx.p0DataIndex) ? [6, 6] : undefined,
          borderColor: (ctx: { p0DataIndex: number }) => gapIndices.has(ctx.p0DataIndex) ? hexToRgba(props.sensorColor, 0.4) : undefined,
        },
      },
    ],
  }
})

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  interaction: {
    intersect: false,
    mode: 'nearest',
    axis: 'x',
  },
  scales: {
    x: {
      type: 'time' as const,
      display: true,
      time: {
        displayFormats: {
          minute: 'dd/MM HH:mm',
          hour: 'dd/MM HH:mm',
          day: 'dd/MM',
          month: 'MM/yyyy'
        }
      },
      border: { display: false },
      grid: { color: isDark.value ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6', drawBorder: false },
      ticks: {
        font: { family: "'Inter', sans-serif", size: 11 },
        color: '#9ca3af',
        maxTicksLimit: 8,
      },
    },
    y: {
      display: true,
      min: graphMinMax.value.min,
      max: graphMinMax.value.max,
      border: { display: false },
      grid: { color: isDark.value ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6', drawBorder: false },
      ticks: {
        color: props.sensorColor,
        font: { family: "'Inter', sans-serif", size: 11 },
        maxTicksLimit: 6,
        callback: function (value) {
          if (typeof value === 'number') {
            return Math.round(value).toString()
          }
          return String(value)
        },
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      backgroundColor: '#111827',
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      titleColor: '#f9fafb',
      bodyColor: '#f9fafb',
      borderColor: '#374151',
      borderWidth: 1,
      titleFont: {
        family: "'Inter', sans-serif",
        size: 12,
        weight: 'bold' as const,
      },
      bodyFont: {
        family: "'Inter', sans-serif",
        size: 13,
        weight: 'normal' as const,
      },
      callbacks: {
        title: context => {
          const date = new Date(context[0].parsed.x)
          return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        },
        label: context => {
          const value = context.parsed.y
          if (typeof value !== 'number') return ''
          const formattedValue = Number.isInteger(value)
            ? value.toString()
            : value.toFixed(1).replace(/\.0$/, '')
          const unit = props.sensorUnit || ''
          return `${props.sensorLabel}: ${formattedValue} ${unit}`.trim()
        },
      },
    },
  },
}))
</script>

<style scoped>


/* Shadow separator top (inverted - shadow goes down) */
.shadow-separator-top {
  background: radial-gradient(ellipse 70% 100% at center top, rgba(0, 0, 0, 0.08) 0%, transparent 100%);
}

:global(.dark) .shadow-separator-top {
  background: radial-gradient(ellipse 70% 100% at center top, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
}
</style>
