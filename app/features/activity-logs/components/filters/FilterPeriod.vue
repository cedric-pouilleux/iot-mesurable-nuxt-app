<template>
  <UIDropdown
    id="period-filter"
    dropdown-class="top-full left-0 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl mt-1 overflow-hidden border border-gray-200 dark:border-gray-700"
  >
    <template #trigger="{ isOpen }">
      <button
        class="px-2.5 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5"
        :class="isOpen 
          ? 'bg-gray-800 dark:bg-gray-700 text-white border-gray-800 dark:border-gray-600' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'"
      >
        <Icon name="tabler:clock" class="w-3.5 h-3.5" />
        {{ LOG_PERIODS.find(p => p.value === modelValue)?.label || 'Période' }}
        <Icon name="tabler:chevron-down" class="w-3 h-3" />
      </button>
    </template>
    <template #content="{ close }">
      <div class="py-1">
        <button
          v-for="period in LOG_PERIODS"
          :key="period.value"
          @click="$emit('update:modelValue', period.value); close()"
          class="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between"
          :class="modelValue === period.value 
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          {{ period.label }}
          <Icon v-if="modelValue === period.value" name="tabler:check" class="w-3.5 h-3.5 text-emerald-500" />
        </button>
      </div>
    </template>
  </UIDropdown>
</template>

<script setup lang="ts">
import UIDropdown from '~/components/design-system/UIDropdown/UIDropdown.vue'
import { LOG_PERIODS } from '../../config/constants'

defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
