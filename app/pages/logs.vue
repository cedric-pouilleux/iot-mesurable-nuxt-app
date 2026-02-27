<template>
  <div
    class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col"
  >
    <!-- Sticky Header (Histogram + Filters) -->
    <div
      class="sticky top-0 z-30 bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-2">
        <!-- Histogram -->
        <div class="w-full">
          <LogHistogram
            :range="currentRange"
            :filters="{
              category: filters.categories.join(','),
              level: filters.levels.join(','),
              search: filters.search,
            }"
            :selection="timeSelection"
            @update:selection="handleSelectionUpdate"
          />
        </div>

        <!-- Filters Row -->
        <LogFilters
          :filters="filters"
          :time-range="timeRange"
          @update:filters="onFiltersUpdate"
          @update:time-range="timeRange = $event"
          @delete="showDeleteConfirm = true"
        />
      </div>
    </div>

    <!-- Main Content (Table) -->
    <div class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
      <LogTable
        :logs="logs"
        :loading="loading"
        :error="error"
        @open-details="openDetails"
        @retry="loadLogs"
      />
    </div>

    <!-- Pagination -->
    <LogPagination
      :offset="offset"
      :total="total"
      :count="logs.length"
      @next="nextPage"
      @previous="previousPage"
    />

    <!-- Delete Confirmation Modal -->
    <LogDeleteModal
      :show="showDeleteConfirm"
      :total="total"
      :deleting="deleting"
      @confirm="deleteAllLogs"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Details Modal -->
    <LogDetailsModal :log="selectedLog" @close="closeDetails" />
  </div>
</template>

<script setup lang="ts">
import LogHistogram from '~/features/activity-logs/components/LogHistogram.vue'
import LogFilters from '~/features/activity-logs/components/LogFilters.vue'
import LogTable from '~/features/activity-logs/components/LogTable.vue'
import LogPagination from '~/features/activity-logs/components/LogPagination.vue'
import LogDeleteModal from '~/features/activity-logs/components/LogDeleteModal.vue'
import LogDetailsModal from '~/features/activity-logs/components/LogDetailsModal.vue'
import { useLogs } from '~/features/activity-logs/composables/useLogs'
import type { LogEntry, LogFilters as LogFiltersType } from '~/features/activity-logs/types'

const {
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
} = useLogs()

// Modal state
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const selectedLog = ref<LogEntry | null>(null)

// Handlers
const onFiltersUpdate = (newFilters: Partial<LogFiltersType>) => {
  Object.assign(filters.value, newFilters)
}

const openDetails = (log: LogEntry) => {
  selectedLog.value = log
}

const closeDetails = () => {
  selectedLog.value = null
}

const deleteAllLogs = async () => {
  if (total.value === 0) return

  deleting.value = true
  try {
    const response = await fetch('/api/logs', { method: 'DELETE' })
    if (response.ok) {
      showDeleteConfirm.value = false
      loadLogs()
    }
  } catch (err) {
    console.error('Failed to delete logs:', err)
  } finally {
    deleting.value = false
  }
}

// Initial load
onMounted(() => {
  loadLogs()
})
</script>
