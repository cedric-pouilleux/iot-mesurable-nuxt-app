import { ref, computed, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import type { SensorDataPoint } from '../../types'
import type { SensorGroupInfo } from './useSensorDetailGraphState'
import { useModuleServices } from '~/composables/useModuleServices'
import type { GetApiModulesIdHistoryBucket } from '~/api/model'

export function useSensorDetailData(
  moduleId: Ref<string>,
  group: Ref<SensorGroupInfo>,
  initialActiveSensor: Ref<string | null>,
  selectedSensorKeys: Ref<Set<string>>
) {
  const { fetchModuleSensorsGraphData } = useModuleServices()

  const historyMap = ref<Record<string, SensorDataPoint[]>>({})
  const isLoadingData = ref(true)

  // Auto-zoom state: when enabled, Y-axis adapts to data range instead of fixed range
  const autoZoom = ref(false)

  // Duration options for time range selector
  const durationOptions = [
    { value: '1h', label: '1h', hours: 1 },
    { value: '6h', label: '6h', hours: 6 },
    { value: '24h', label: '24h', hours: 24 },
    { value: '7d', label: '7j', hours: 168 },
  ]

  // Selected duration state (defaults to 7d)
  const selectedDuration = ref('7d')

  const selectedDurationHours = computed(() => {
    const option = durationOptions.find(o => o.value === selectedDuration.value)
    return option?.hours || 24
  })

  // Bucket options for server-side smoothing (TimescaleDB time_bucket)
  const bucketOptions = [
    { value: 'auto', label: 'Auto', title: 'Lissage automatique selon la durée' },
    { value: '5min', label: '5m', title: 'Moyenne sur 5 minutes' },
    { value: '15min', label: '15m', title: 'Moyenne sur 15 minutes' },
    { value: '30min', label: '30m', title: 'Moyenne sur 30 minutes' },
    { value: '1hour', label: '1h', title: 'Moyenne sur 1 heure' },
  ]

  // Selected bucket state (defaults to auto for server-side default smoothing)
  const selectedBucket = ref<GetApiModulesIdHistoryBucket>('auto')

  // Filter duration options: hide 1h when 1hour bucket is selected (doesn't make sense)
  const filteredDurationOptions = computed(() => {
    if (selectedBucket.value === '1hour') {
      return durationOptions.filter(o => o.value !== '1h')
    }
    return durationOptions
  })

  // Filter bucket options: hide 1h bucket when 1h duration is selected (doesn't make sense)
  const filteredBucketOptions = computed(() => {
    if (selectedDuration.value === '1h') {
      return bucketOptions.filter(o => o.value !== '1hour')
    }
    return bucketOptions
  })

  const getPrimaryHistory = (): SensorDataPoint[] => {
    if (Object.keys(historyMap.value).length > 0) {
      const selectedKey = initialActiveSensor.value || group.value.initialKey
      if (selectedKey) {
        if (historyMap.value[selectedKey]) return historyMap.value[selectedKey]
        const sensorType = selectedKey.includes(':') ? selectedKey.split(':')[1] : selectedKey
        if (historyMap.value[sensorType]) return historyMap.value[sensorType]
        const suffixMatch = Object.keys(historyMap.value).find(
          k => k.endsWith(':' + sensorType) || k.toLowerCase() === sensorType.toLowerCase()
        )
        if (suffixMatch) return historyMap.value[suffixMatch]
      }
      const firstKey = Object.keys(historyMap.value)[0]
      if (firstKey) return historyMap.value[firstKey]
    }
    return []
  }

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

  const fetchGraphData = async () => {
    isLoadingData.value = true

    try {
      const newData = await fetchModuleSensorsGraphData(
        moduleId.value,
        selectedDuration.value,
        selectedBucket.value
      )

      if (newData) {
        historyMap.value = newData
      }
    } catch (error) {
      console.error('[SensorDetailGraph] Error loading bucket data:', error)
    } finally {
      isLoadingData.value = false
    }
  }

  const selectBucket = async (bucket: GetApiModulesIdHistoryBucket) => {
    if (bucket === selectedBucket.value) return
    selectedBucket.value = bucket
    await fetchGraphData()
  }

  watch(selectedDuration, () => {
    fetchGraphData()
  })

  // Initial load when the component opens
  onMounted(() => {
    fetchGraphData()
  })

  const hasHistory = computed(() => {
    for (const key of selectedSensorKeys.value) {
      if ((historyMap.value?.[key]?.length || 0) >= 2) return true
    }
    return false
  })

  return {
    historyMap,
    isLoadingData,
    autoZoom,
    durationOptions,
    selectedDuration,
    filteredDurationOptions,
    bucketOptions,
    selectedBucket,
    filteredBucketOptions,
    getPrimaryHistory,
    filterByDuration,
    fetchGraphData,
    selectBucket,
    hasHistory,
  }
}
