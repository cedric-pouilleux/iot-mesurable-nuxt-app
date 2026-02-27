<template>
  <UIDropdown
    id="limit-filter"
    dropdown-class="top-full left-0 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-xl mt-1 overflow-hidden border border-gray-200 dark:border-gray-700"
  >
    <template #trigger="{ isOpen }">
      <button
        class="px-2.5 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5"
        :class="
          isOpen
            ? 'bg-gray-800 dark:bg-gray-700 text-white border-gray-800 dark:border-gray-600'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        "
      >
        <Icon name="tabler:list-numbers" class="w-3.5 h-3.5" />
        {{ modelValue }}
        <Icon name="tabler:chevron-down" class="w-3 h-3" />
      </button>
    </template>
    <template #content="{ close }">
      <div class="py-1">
        <button
          v-for="lim in LOG_LIMITS"
          :key="lim"
          class="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between"
          :class="
            modelValue === String(lim)
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          "
          @click="
            $emit('update:modelValue', String(lim))
            close()
          "
        >
          {{ lim }}
          <Icon
            v-if="modelValue === String(lim)"
            name="tabler:check"
            class="w-3.5 h-3.5 text-emerald-500"
          />
        </button>
      </div>
    </template>
  </UIDropdown>
</template>

<script setup lang="ts">
import UIDropdown from '~/components/design-system/UIDropdown/UIDropdown.vue'
import { LOG_LIMITS } from '../../config/constants'

defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
