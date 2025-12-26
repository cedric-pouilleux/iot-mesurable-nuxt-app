import type { LogEntry, LogFilters, LogsResponse, TimeRange } from '../types'

export function useLogs() {
    const logs = ref<LogEntry[]>([])
    const total = ref(0)
    const offset = ref(0)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const filters = ref<LogFilters>({
        categories: [],
        source: '',
        direction: '',
        levels: [],
        search: '',
        limit: '100',
    })

    const timeRange = ref('24h')
    const timeSelection = ref<TimeRange | null>(null)

    const currentRange = computed(() => {
        const end = new Date()
        const start = new Date()

        if (timeRange.value === '24h') {
            start.setHours(start.getHours() - 24)
        } else if (timeRange.value === '7d') {
            start.setDate(start.getDate() - 7)
        }

        return {
            start: start.toISOString(),
            end: end.toISOString(),
        }
    })

    const loadLogs = async () => {
        loading.value = true
        error.value = null

        try {
            const params = new URLSearchParams({
                limit: filters.value.limit,
                offset: String(offset.value),
            })

            filters.value.categories.forEach((cat) => params.append('category', cat))
            filters.value.levels.forEach((lvl) => params.append('level', lvl))

            if (filters.value.source) params.append('source', filters.value.source)
            if (filters.value.direction) params.append('direction', filters.value.direction)
            if (filters.value.search) params.append('search', filters.value.search)

            if (timeSelection.value) {
                params.append('startDate', timeSelection.value.start)
                params.append('endDate', timeSelection.value.end)
            } else {
                params.append('startDate', currentRange.value.start)
                params.append('endDate', currentRange.value.end)
            }

            const response = await fetch(`/api/logs?${params}`)
            if (!response.ok) throw new Error('Failed to load logs')

            const data: LogsResponse = await response.json()
            logs.value = data.logs
            total.value = data.total
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Unknown error'
        } finally {
            loading.value = false
        }
    }

    const nextPage = () => {
        offset.value += Number(filters.value.limit)
        loadLogs()
    }

    const previousPage = () => {
        offset.value = Math.max(0, offset.value - Number(filters.value.limit))
        loadLogs()
    }

    const resetOffset = () => {
        offset.value = 0
    }

    const handleSelectionUpdate = (selection: TimeRange | null) => {
        timeSelection.value = selection
        resetOffset()
        loadLogs()
    }

    // Watch filters to reload
    watch(
        () => [
            filters.value.categories,
            filters.value.levels,
            filters.value.source,
            filters.value.direction,
            filters.value.search,
            filters.value.limit,
        ],
        () => {
            resetOffset()
            loadLogs()
        },
        { deep: true }
    )

    watch(timeRange, () => {
        timeSelection.value = null
        resetOffset()
        loadLogs()
    })

    return {
        logs,
        total,
        offset,
        loading,
        error,
        filters,
        timeRange,
        timeSelection,
        currentRange,
        loadLogs,
        nextPage,
        previousPage,
        handleSelectionUpdate,
    }
}
