<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="log"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click="$emit('close')"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700 transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Icon name="tabler:code" class="w-5 h-5 text-indigo-500" />
            Détails du Log
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Icon name="tabler:x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-auto custom-scrollbar">
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <pre class="whitespace-pre-wrap">{{ formattedDetails }}</pre>
          </div>
          
          <!-- Metadata -->
          <div v-if="log" class="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400">ID</span>
              <span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ log.id }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400">Timestamp</span>
              <span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ formatTime(log.time) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            @click="$emit('close')"
            class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { LogEntry } from '../types'

const props = defineProps<{
  log: LogEntry | null
}>()

defineEmits<{
  close: []
}>()

const formattedDetails = computed(() => {
  if (!props.log?.details) return ''
  return JSON.stringify(props.log.details, null, 2)
})

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + '.' + date.getMilliseconds().toString().padStart(3, '0')
}
</script>
