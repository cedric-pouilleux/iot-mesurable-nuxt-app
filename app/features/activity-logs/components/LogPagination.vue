<template>
  <div class="sticky bottom-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
      <div class="text-sm text-gray-700 dark:text-gray-300">
        {{ $t('logs.pagination.showing', { start: offset + 1, end: Math.min(offset + count, total), total: total }) }}
      </div>
      <div class="flex gap-2">
        <button
          :disabled="offset === 0"
          :class="{ 'opacity-50 cursor-not-allowed': offset === 0 }"
          class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          @click="$emit('previous')"
        >
          ← {{ $t('logs.pagination.previous') }}
        </button>
        <button
          :disabled="offset + count >= total"
          :class="{ 'opacity-50 cursor-not-allowed': offset + count >= total }"
          class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          @click="$emit('next')"
        >
          {{ $t('logs.pagination.next') }} →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  offset: number
  total: number
  count: number
}>()

defineEmits<{
  next: []
  previous: []
}>()
</script>
