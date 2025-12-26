<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
    <!-- Loading State -->
    <div v-if="loading" class="p-8 text-center">
      <div class="animate-spin w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full mx-auto mb-4"></div>
      <p class="text-gray-500 dark:text-gray-400">Chargement des logs...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-8 text-center text-red-600 dark:text-red-400">
      <p>{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        @click="$emit('retry')"
      >
        Réessayer
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="logs.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
      Aucun log trouvé
    </div>

    <!-- Logs Table -->
    <div v-else>
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="log in logs" 
            :key="log.id"
            :class="{'bg-red-50 dark:bg-red-900/10': log.level === 'error' || log.level === 'fatal', 'bg-amber-50 dark:bg-amber-900/10': log.level === 'warn'}"
          >
            <td class="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono">
              {{ formatTime(log.time) }}
            </td>
            <td class="text-center">
              <Icon 
                :name="log.source === 'USER' ? 'tabler:user' : 'tabler:settings'" 
                class="w-4 h-4"
                :class="log.source === 'USER' ? 'text-indigo-500' : 'text-slate-400'"
                :title="log.source === 'USER' ? 'Action utilisateur' : 'Système'"
              />
            </td>
            <td class="text-center">
              <Icon 
                v-if="log.direction"
                :name="log.direction === 'OUT' ? 'tabler:broadcast' : 'tabler:antenna'" 
                class="w-4 h-4"
                :class="log.direction === 'OUT' ? 'text-orange-500' : 'text-cyan-500'"
                :title="log.direction === 'OUT' ? 'Envoi' : 'Réception'"
              />
            </td>
            <td class="whitespace-nowrap">
              <span
                :class="CATEGORY_CLASSES[log.category] || 'text-gray-500'"
                class="px-2 py-0.5 text-xs font-medium rounded"
              >
                {{ formatCategory(log.category) }}
              </span>
            </td>
            <td v-if="showHardwareColumn" class="whitespace-nowrap text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {{ log.details?.moduleId || '-' }}
            </td>
            <td class="whitespace-nowrap">
              <span
                :class="LEVEL_CLASSES[log.level] || 'text-gray-500'"
                class="text-xs font-medium"
              >
                {{ log.level }}
              </span> 
            </td>
            <td class="text-sm text-gray-900 dark:text-gray-300">
              <UIDropdown
                v-if="log.category === 'DB' && log.details?.details"
                :id="`log-${log.id}`"
                dropdown-class="top-full left-0 w-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl mt-1 overflow-hidden border border-gray-200 dark:border-gray-700 p-2"
              >
                <template #trigger>
                  <span class="cursor-pointer border-b border-dotted border-gray-400 dark:border-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400">
                    {{ log.msg }}
                  </span>
                </template>
                <template #content>
                  <div class="text-xs space-y-1">
                    <div v-for="(line, i) in (log.details.details as string[])" :key="i" class="flex gap-1">
                      <span class="text-gray-500 dark:text-gray-400">{{ line.split('=')[0] }}:</span>
                      <span class="font-bold text-gray-900 dark:text-white">{{ line.split('=')[1] }}</span>
                    </div>
                  </div>
                </template>
              </UIDropdown>
              <span v-else>
                {{ log.msg }}
              </span>
            </td>
            <td class="text-right">
              <button
                v-if="log.details && Object.keys(log.details).length > 0"
                @click="$emit('openDetails', log)"
                class="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Voir les détails"
              >
                <Icon name="tabler:code" class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import UIDropdown from '~/components/design-system/UIDropdown/UIDropdown.vue'
import { LEVEL_CLASSES, CATEGORY_CLASSES } from '../config/constants'
import type { LogEntry } from '../types'

defineProps<{
  logs: LogEntry[]
  loading: boolean
  error: string | null
  showHardwareColumn: boolean
}>()

defineEmits<{
  openDetails: [log: LogEntry]
  retry: []
}>()

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

const formatCategory = (category: string) => {
  if (category === 'HARDWARE') return 'Hardware'
  if (category === 'ESP32') return 'Hardware'
  if (category === 'MQTT') return 'MQTT'
  if (category === 'DB') return 'DB'
  if (category === 'API') return 'API'
  if (category === 'SYSTEM') return 'System'
  if (category === 'WEBSOCKET') return 'WebSocket'
  return category.charAt(0) + category.slice(1).toLowerCase()
}
</script>
