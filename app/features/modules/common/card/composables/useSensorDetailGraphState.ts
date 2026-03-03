import { computed, onMounted, ref, watch } from 'vue'
import type { DeviceStatus, SensorDataPoint } from '../../types'
import { getSensorTypeFromKey } from '../../config/sensors'
import { getSensorColor, getSensorUnit } from '../../utils/sensors'
import { useDashboard } from '~/composables/useModuleServices'

export interface SensorItem {
  key: string
  label: string
  value?: number
  status?: string
  model?: string
}

export interface SensorGroupInfo {
  type: string
  label: string
  color: string
  sensors: SensorItem[]
  initialKey: string
}

export interface SensorDetailGraphProps {
  moduleId: string
  group: SensorGroupInfo
  initialActiveSensor?: string | null
}

const shadeMultipliers = [1.0, 0.7, 1.3, 0.5, 1.5]

const durationOptions = [
  { value: '1h', label: '1h', hours: 1 },
  { value: '6h', label: '6h', hours: 6 },
  { value: '24h', label: '24h', hours: 24 },
  { value: '7d', label: '7j', hours: 168 },
]

const bucketOptions = [
  { value: 'auto', label: 'Auto', title: 'Lissage automatique selon la duree' },
  { value: '5min', label: '5m', title: 'Moyenne sur 5 minutes' },
  { value: '15min', label: '15m', title: 'Moyenne sur 15 minutes' },
  { value: '30min', label: '30m', title: 'Moyenne sur 30 minutes' },
  { value: '1hour', label: '1h', title: 'Moyenne sur 1 heure' },
]

const getSafeSensorType = (key: string): string => {
  return getSensorTypeFromKey(key || '').toLowerCase()
}

const parseHexColor = (hexColor: string): [number, number, number] => {
  const isHexColor = /^#[0-9A-Fa-f]{6}$/.test(hexColor)
  if (!isHexColor) return [156, 163, 175]

  return [
    parseInt(hexColor.slice(1, 3), 16),
    parseInt(hexColor.slice(3, 5), 16),
    parseInt(hexColor.slice(5, 7), 16),
  ]
}

const clampColor = (value: number): number => {
  return Math.min(255, Math.max(0, Math.round(value)))
}

export function useSensorDetailGraphState(props: SensorDetailGraphProps) {
  const { loadHistory, loadStatus } = useDashboard()

  const historyMap = ref<Record<string, SensorDataPoint[]>>({})
  const moduleStatus = ref<DeviceStatus | null>(null)
  const isLoadingData = ref(true)
  const chartVersion = ref(0)

  const selectedSensorKeys = ref<Set<string>>(new Set())
  const autoZoom = ref(false)
  const selectedDuration = ref('7d')
  const selectedBucket = ref('auto')

  const resolveSensorStatus = (sensor: SensorItem): string | undefined => {
    if (sensor.status) return sensor.status
    const sensorType = getSensorTypeFromKey(sensor.key)
    return (
      moduleStatus.value?.sensors?.[sensor.key]?.status ??
      moduleStatus.value?.sensors?.[sensorType]?.status
    )
  }

  const resolveSensorModel = (sensor: SensorItem): string | undefined => {
    if (sensor.model) return sensor.model
    const sensorType = getSensorTypeFromKey(sensor.key)
    return (
      moduleStatus.value?.sensorsConfig?.sensors?.[sensor.key]?.model ??
      moduleStatus.value?.sensorsConfig?.sensors?.[sensorType]?.model
    )
  }

  const enabledSensors = computed(() =>
    (props.group.sensors || []).filter(sensor => resolveSensorStatus(sensor) !== 'disabled')
  )

  const filteredDurationOptions = computed(() => {
    if (selectedBucket.value === '1hour') {
      return durationOptions.filter(option => option.value !== '1h')
    }
    return durationOptions
  })

  const filteredBucketOptions = computed(() => {
    if (selectedDuration.value === '1h') {
      return bucketOptions.filter(option => option.value !== '1hour')
    }
    return bucketOptions
  })

  const selectedDurationHours = computed(() => {
    const option = durationOptions.find(item => item.value === selectedDuration.value)
    return option?.hours || 24
  })

  const filterByDuration = (data: SensorDataPoint[]): SensorDataPoint[] => {
    if (!data || data.length === 0) return []

    const now = Date.now()
    const cutoffMs = now - selectedDurationHours.value * 60 * 60 * 1000

    return data.filter(point => {
      const pointTime =
        point.time instanceof Date ? point.time.getTime() : new Date(point.time).getTime()
      return pointTime >= cutoffMs
    })
  }

  const findHistoryByKey = (sensorKey: string | null | undefined): SensorDataPoint[] => {
    if (!sensorKey) return []

    const directMatch = historyMap.value[sensorKey]
    if (directMatch) return directMatch

    const sensorType = getSensorTypeFromKey(sensorKey)
    const typeMatch = historyMap.value[sensorType]
    if (typeMatch) return typeMatch

    const suffixMatch = Object.keys(historyMap.value).find(
      key => key.endsWith(`:${sensorType}`) || key.toLowerCase() === getSafeSensorType(sensorKey)
    )
    return suffixMatch ? historyMap.value[suffixMatch] : []
  }

  const getPrimaryHistory = (): SensorDataPoint[] => {
    const selectedKey = Array.from(selectedSensorKeys.value)[0]
    const historyFromSelected = findHistoryByKey(selectedKey)
    if (historyFromSelected.length > 0) return historyFromSelected

    const historyFromInitial = findHistoryByKey(props.initialActiveSensor)
    if (historyFromInitial.length > 0) return historyFromInitial

    const historyFromGroupInitial = findHistoryByKey(props.group.initialKey)
    if (historyFromGroupInitial.length > 0) return historyFromGroupInitial

    const firstKey = Object.keys(historyMap.value)[0]
    return firstKey ? historyMap.value[firstKey] : []
  }

  const hasMixedUnits = computed(() => {
    if (enabledSensors.value.length <= 1) return false

    const units = new Set(
      enabledSensors.value.map(sensor => {
        return getSensorUnit(getSafeSensorType(sensor.key)) || ''
      })
    )

    return units.size > 1
  })

  const setFallbackSelection = () => {
    const fallbackKey =
      props.initialActiveSensor || props.group.initialKey || enabledSensors.value[0]?.key

    if (fallbackKey) {
      selectedSensorKeys.value = new Set([fallbackKey])
    } else {
      selectedSensorKeys.value = new Set()
    }
  }

  watch(
    () => props.initialActiveSensor,
    value => {
      if (value) {
        selectedSensorKeys.value = new Set([value])
      } else if (selectedSensorKeys.value.size === 0) {
        setFallbackSelection()
      }
    },
    { immediate: true }
  )

  watch(
    enabledSensors,
    sensors => {
      const availableKeys = new Set(sensors.map(sensor => sensor.key))
      const selected = Array.from(selectedSensorKeys.value).filter(key => availableKeys.has(key))

      if (selected.length > 0) {
        selectedSensorKeys.value = new Set(selected)
        return
      }

      setFallbackSelection()
    },
    { immediate: true }
  )

  const toggleSensor = (sensorKey: string) => {
    if (hasMixedUnits.value) {
      selectedSensorKeys.value = new Set([sensorKey])
      return
    }

    const next = new Set(selectedSensorKeys.value)
    if (next.has(sensorKey)) {
      if (next.size > 1) {
        next.delete(sensorKey)
      }
    } else {
      next.add(sensorKey)
    }
    selectedSensorKeys.value = next
  }

  const baseHexColor = computed(() => getSensorColor(props.group.type))

  const getSensorShadeColor = (index: number): string => {
    const multiplier = shadeMultipliers[index % shadeMultipliers.length]
    const [r, g, b] = parseHexColor(baseHexColor.value)

    return `rgb(${clampColor(r * multiplier)}, ${clampColor(g * multiplier)}, ${clampColor(
      b * multiplier
    )})`
  }

  const getSensorColorByKey = (sensorKey: string): string => {
    const index = props.group.sensors.findIndex(sensor => sensor.key === sensorKey)
    return getSensorShadeColor(index >= 0 ? index : 0)
  }

  const getSensorDisplayLabel = (sensor: SensorItem): string => {
    const sensorType = getSafeSensorType(sensor.key)

    if (/^pm\d/.test(sensorType)) {
      return sensor.label
    }

    return resolveSensorModel(sensor) || sensor.label
  }

  const hasHistory = computed(() => {
    for (const key of selectedSensorKeys.value) {
      if ((historyMap.value[key]?.length || 0) >= 2) return true
    }
    return false
  })

  const currentRequestId = ref(0)

  const fetchGraphData = async () => {
    const requestId = ++currentRequestId.value
    isLoadingData.value = true

    try {
      const [status, history] = await Promise.all([
        loadStatus(props.moduleId),
        loadHistory(props.moduleId, selectedDuration.value, selectedBucket.value),
      ])

      if (requestId !== currentRequestId.value) return

      if (status) {
        moduleStatus.value = status
      }

      if (history) {
        historyMap.value = history
        chartVersion.value++
      }
    } catch (error) {
      console.error('[SensorDetailGraph] Error loading graph data:', error)
    } finally {
      if (requestId === currentRequestId.value) {
        isLoadingData.value = false
      }
    }
  }

  const selectBucket = async (bucket: string) => {
    if (bucket === selectedBucket.value) return
    selectedBucket.value = bucket
    await fetchGraphData()
  }

  watch(selectedDuration, () => {
    void fetchGraphData()
  })

  onMounted(() => {
    void fetchGraphData()
  })

  return {
    historyMap,
    moduleStatus,
    isLoadingData,
    chartVersion,
    enabledSensors,
    selectedSensorKeys,
    autoZoom,
    selectedDuration,
    selectedBucket,
    filteredDurationOptions,
    filteredBucketOptions,
    hasMixedUnits,
    hasHistory,
    baseHexColor,
    getPrimaryHistory,
    filterByDuration,
    toggleSensor,
    selectBucket,
    getSensorShadeColor,
    getSensorColorByKey,
    getSensorDisplayLabel,
  }
}
