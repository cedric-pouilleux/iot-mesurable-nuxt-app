<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
      <Icon name="tabler:map-pin" class="w-5 h-5" />
      {{ group.zoneName }}
      <span class="text-sm font-normal text-gray-400">({{ group.modules.length }})</span>
    </h2>

    <div class="space-y-6">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Module } from '~/features/modules/common/types'

interface ModuleGroup {
  zoneId: string | null
  zoneName: string
  modules: readonly Module[]
}
defineProps<{
  group: ModuleGroup
}>()
</script>
