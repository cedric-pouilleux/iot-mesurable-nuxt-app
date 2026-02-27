<template>
  <!--
    SensorStatusIndicator
    Displays the visual status indicator for a hardware sensor
  -->
  <div v-if="!isEnabled" class="w-2 h-2 rounded-sm bg-red-500 flex-shrink-0" :title="statusLabel" />
  <div
    v-else-if="status !== 'unknown'"
    class="w-2 h-2 rounded-full flex-shrink-0"
    :class="statusClass"
    :title="statusLabel"
  />
  <Icon
    v-else
    name="tabler:loader"
    class="w-3 h-3 text-gray-400 animate-spin flex-shrink-0"
    :title="statusLabel"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getStatusClass, getStatusLabel } from '../utils/status-helpers'

interface Props {
  status: 'ok' | 'missing' | 'unknown'
  isEnabled: boolean
}

const props = defineProps<Props>()

const statusClass = computed(() => getStatusClass(props.isEnabled ? props.status : 'disabled'))
const statusLabel = computed(() => getStatusLabel(props.isEnabled ? props.status : 'disabled'))
</script>
