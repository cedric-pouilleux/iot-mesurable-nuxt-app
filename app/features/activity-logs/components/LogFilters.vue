<template>
  <div class="flex flex-wrap items-center gap-2 pb-2">
    <FilterPeriod
      :model-value="timeRange"
      @update:model-value="$emit('update:timeRange', $event)"
    />
    <FilterCategory
      :model-value="filters.categories"
      @update:model-value="updateFilters({ categories: $event })"
    />
    <FilterSource
      :model-value="filters.source"
      @update:model-value="updateFilters({ source: $event })"
    />
    <FilterDirection
      :model-value="filters.direction"
      @update:model-value="updateFilters({ direction: $event })"
    />
    <FilterLevel
      :model-value="filters.levels"
      @update:model-value="updateFilters({ levels: $event })"
    />
    <FilterLimit
      :model-value="filters.limit"
      @update:model-value="updateFilters({ limit: $event })"
    />
    <FilterSearch
      :model-value="filters.search"
      @update:model-value="updateFilters({ search: $event })"
    />
    <button
      @click="$emit('delete')"
      class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
      title="Vider les logs"
    >
      <Icon name="tabler:trash" class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import FilterPeriod from './filters/FilterPeriod.vue'
import FilterCategory from './filters/FilterCategory.vue'
import FilterSource from './filters/FilterSource.vue'
import FilterDirection from './filters/FilterDirection.vue'
import FilterLevel from './filters/FilterLevel.vue'
import FilterLimit from './filters/FilterLimit.vue'
import FilterSearch from './filters/FilterSearch.vue'
import type { LogFilters } from '../types'

const props = defineProps<{
  filters: LogFilters
  timeRange: string
}>()

const emit = defineEmits<{
  'update:filters': [filters: Partial<LogFilters>]
  'update:timeRange': [value: string]
  delete: []
}>()

const updateFilters = (partial: Partial<LogFilters>) => {
  emit('update:filters', { ...props.filters, ...partial })
}
</script>
