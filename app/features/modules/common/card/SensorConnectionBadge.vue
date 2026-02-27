<template>
  <div class="flex items-center gap-1.5">
    <!-- Connection status indicator -->
    <div
      class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all"
      :class="badgeClasses"
      :title="tooltipText"
    >
      <div class="w-1.5 h-1.5 rounded-full" :class="dotClasses" />
      <span v-if="showLabel">{{ statusLabel }}</span>
      <span v-if="timeSince" class="opacity-80">{{ timeSince }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'connected' | 'stale' | 'offline' | 'unknown'
  timeSince?: string | null
  showLabel?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: false,
  compact: false,
})

const badgeClasses = computed(() => {
  const base = 'border'

  switch (props.status) {
    case 'connected':
      return `${base} bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400`
    case 'stale':
      return `${base} bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400`
    case 'offline':
      return `${base} bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400`
    default:
      return `${base} bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400`
  }
})

const dotClasses = computed(() => {
  switch (props.status) {
    case 'connected':
      return 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
    case 'stale':
      return 'bg-amber-500 dark:bg-amber-400'
    case 'offline':
      return 'bg-red-500 dark:bg-red-400'
    default:
      return 'bg-gray-400 dark:bg-gray-500'
  }
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'connected':
      return 'Connecté'
    case 'stale':
      return 'Ralenti'
    case 'offline':
      return 'Hors ligne'
    default:
      return 'Inconnu'
  }
})

const tooltipText = computed(() => {
  let text = statusLabel.value
  if (props.timeSince) {
    text += ` • Dernière mesure: il y a ${props.timeSince}`
  }

  switch (props.status) {
    case 'connected':
      return `${text} • Le capteur fonctionne normalement`
    case 'stale':
      return `${text} • Délai de réponse plus long que prévu`
    case 'offline':
      return `${text} • Aucune donnée reçue récemment`
    default:
      return text
  }
})
</script>
