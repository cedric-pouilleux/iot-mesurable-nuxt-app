<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    @click="$emit('cancel')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700" @click.stop>
      <h3 class="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">{{ $t('logs.deleteConfirmTitle') }}</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-6">
        {{ $t('logs.deleteConfirmMessage') }}
        <span class="font-semibold">{{ $t('logs.logsWillBeDeleted', { count: total }) }}</span>
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          @click="$emit('cancel')"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          :disabled="deleting"
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('confirm')"
        >
          {{ deleting ? $t('common.deleting') : $t('common.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  total: number
  deleting: boolean
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
