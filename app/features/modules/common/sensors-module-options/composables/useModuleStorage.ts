
export interface ModuleStorageStats {
  rowCount: number
  estimatedSizeBytes: number
  oldestMeasurement: string | null
  newestMeasurement: string | null
  activeSensors: Array<{
    sensorType: string
    intervalSeconds: number | null
    rowCount: number
  }>
}

export function useModuleStorage(moduleId: Ref<string>) {
  const storageStats = ref<ModuleStorageStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const config = useRuntimeConfig()
  const apiUrl = config.public.apiBase || 'http://localhost:3001'

  const fetchStorageStats = async () => {
    if (!moduleId.value) return

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<ModuleStorageStats>(`${apiUrl}/api/modules/${moduleId.value}/storage`)

      if (data) {
        storageStats.value = data
      }
    } catch (e) {
      console.error('Failed to fetch storage stats:', e)
    } finally {
      loading.value = false
    }
  }

  // Calculate projections based on active sensors intervals
  // We accept optional mappings for overrides (optimistic UI)
  const projections = (
    customIntervals: Ref<Record<string, number> | undefined>,
    customEnabled: Ref<Record<string, boolean> | undefined>
  ) => computed(() => {
    if (!storageStats.value) return { daily: 0, monthly: 0, yearly: 0 }

    let dailyRows = 0

    // We iterate over active sensors from valid stats first
    storageStats.value.activeSensors.forEach(s => {
      // 1. Check if disabled via override (optimistic)
      // The s.sensorType might need mapping to hardwareKey if overrides are keyed by hardwareKey.
      // But activeSensors from backend has 'sensorType'.
      // intervalOverrides in parent are keyed by 'sensorType' (mapped from hardwareKey).
      // So customEnabled should also be keyed by 'sensorType'.

      const isEnabled = customEnabled.value?.[s.sensorType] !== undefined
        ? customEnabled.value[s.sensorType]
        : true

      if (customEnabled.value?.[s.sensorType] === false) {
        return // Skip this sensor
      }

      const override = customIntervals.value?.[s.sensorType]
      const interval = (override !== undefined) ? override : (s.intervalSeconds && s.intervalSeconds > 0 ? s.intervalSeconds : 60)

      const measurementsPerDay = (24 * 60 * 60) / interval
      dailyRows += measurementsPerDay
    })

    const bytesPerRow = 100 // Estimate

    const daily = dailyRows * bytesPerRow

    return {
      daily,
      monthly: daily * 30,
      yearly: daily * 365
    }
  })

  return {
    storageStats,
    projections, // Now a function that returns a computed
    loading,
    error,
    fetchStorageStats
  }
}
