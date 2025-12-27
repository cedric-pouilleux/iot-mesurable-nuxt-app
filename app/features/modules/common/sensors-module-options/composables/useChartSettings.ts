/**
 * useChartSettings
 * 
 * Composable for managing chart display preferences.
 * Settings are persisted in localStorage.
 */

const STORAGE_KEY = 'iot-chart-settings'

interface ChartSettings {
  showCharts: boolean
  showThresholdLines: boolean
  colorThresholds: boolean
  showAlertThresholds: boolean
  minimalMode: boolean
  graphDuration: string
  useFixedScale: boolean
}

const defaultSettings: ChartSettings = {
  showCharts: true,
  showThresholdLines: false,
  colorThresholds: true,
  showAlertThresholds: true,
  minimalMode: false,
  graphDuration: '24h',
  useFixedScale: false
}

// Global reactive settings
const settings = ref<ChartSettings>({ ...defaultSettings })

// Load settings from localStorage on init
const loadSettings = () => {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        settings.value = { ...defaultSettings, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.warn('Failed to load chart settings:', e)
    }
  }
}

// Save settings to localStorage
const saveSettings = () => {
  if (import.meta.client) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    } catch (e) {
      console.warn('Failed to save chart settings:', e)
    }
  }
}

// Init on module load
loadSettings()

// Debounce logic for expensive chart updates
const debouncedGraphDuration = ref(settings.value.graphDuration)
const debouncedColorThresholds = ref(settings.value.colorThresholds)
const debouncedUseFixedScale = ref(settings.value.useFixedScale)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Watch for changes and debounce updates
watch(
  () => [settings.value.graphDuration, settings.value.colorThresholds, settings.value.useFixedScale],
  ([newDuration, newColorThresholds, newFixedScale]) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedGraphDuration.value = newDuration as string
      debouncedColorThresholds.value = newColorThresholds as boolean
      debouncedUseFixedScale.value = newFixedScale as boolean
    }, 500)
  }
)

export function useChartSettings() {
  const showCharts = computed({
    get: () => true, // Always show charts in normal mode
    set: () => { } // No-op
  })

  // ... (keep existing computed for UI) ...

  const graphDuration = computed({
    get: () => settings.value.graphDuration,
    set: (value: string) => {
      settings.value.graphDuration = value
      saveSettings()
    }
  })

  // ... (other setters)

  return {
    showCharts,
    // ...
    graphDuration,
    useFixedScale: computed({
      get: () => settings.value.useFixedScale,
      set: (val) => { settings.value.useFixedScale = val; saveSettings() }
    }),

    // Default immediate exports ...
    showThresholdLines: computed(() => false),
    colorThresholds: computed({
      get: () => settings.value.colorThresholds,
      set: (val) => { settings.value.colorThresholds = val; saveSettings() }
    }),
    showAlertThresholds: computed({
      get: () => settings.value.showAlertThresholds,
      set: (val) => { settings.value.showAlertThresholds = val; saveSettings() }
    }),
    minimalMode: computed({
      get: () => settings.value.minimalMode,
      set: (val) => { settings.value.minimalMode = val; saveSettings() }
    }),

    // Toggles ...
    toggleShowCharts: () => { showCharts.value = !showCharts.value },
    toggleThresholdLines: () => { },
    toggleColorThresholds: () => { settings.value.colorThresholds = !settings.value.colorThresholds; saveSettings() },
    toggleAlertThresholds: () => { settings.value.showAlertThresholds = !settings.value.showAlertThresholds; saveSettings() },
    toggleMinimalMode: () => { settings.value.minimalMode = !settings.value.minimalMode; saveSettings() },
    toggleFixedScale: () => { settings.value.useFixedScale = !settings.value.useFixedScale; saveSettings() },

    // EXPOSE DEBOUNCED VALUES FOR CHARTS
    debouncedGraphDuration: readonly(debouncedGraphDuration),
    debouncedColorThresholds: readonly(debouncedColorThresholds),
    debouncedUseFixedScale: readonly(debouncedUseFixedScale)
  }
}
