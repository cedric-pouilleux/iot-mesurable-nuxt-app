<template>
  <div class="py-2">
    <div class="flex flex-wrap items-center gap-4 mb-4">
      <div
        class="flex items-center gap-2 cursor-pointer group"
        title="Ouvrir les options"
        @click="$emit('toggle-options')"
      >
        <h2
          class="font-black text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-600 to-gray-800 dark:from-white dark:via-gray-200 dark:to-gray-500 filter drop-shadow-sm leading-none"
          style="
            font-family:
              'Inter',
              -apple-system,
              BlinkMacSystemFont,
              'Segoe UI',
              sans-serif;
          "
        >
          {{ moduleTypeLabel }}
        </h2>
      </div>
      <!-- Disconnect Badge -->
      <div
        v-if="!isOnline"
        class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20"
      >
        <Icon name="tabler:wifi-off" class="w-3.5 h-3.5 text-red-500" />
        <span class="text-xs font-medium text-red-500">{{
          $t('modules.status.disconnected')
        }}</span>
      </div>

      <!-- Right: Controls -->
      <div class="flex items-center gap-2">
        <!-- Options Button -->
        <UIButton
          icon="tabler:settings"
          :icon-class="{ 'rotate-90': optionsPanelOpen }"
          :variant="optionsPanelOpen ? 'blue' : 'ghost'"
          size="small"
          :clickable="true"
          :label="$t('common.options')"
          :title="$t('common.options')"
          @click="$emit('toggle-options')"
        />

        <NuxtLink
          :to="localePath({ name: 'logs', query: { moduleId: moduleId, category: 'HARDWARE' } })"
          target="_blank"
          :title="$t('nav.logs')"
        >
          <UIButton
            icon="tabler:notes"
            variant="ghost"
            size="small"
            :label="$t('nav.logs')"
            :clickable="true"
          />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DeviceStatus } from '../../common/types'
import UIButton from '~/components/design-system/UIButton/UIButton.vue'

const props = defineProps<{
  moduleName: string
  moduleId: string
  deviceStatus: DeviceStatus | null
  optionsPanelOpen?: boolean
  isOnline?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-options'): void
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const moduleTypeLabel = computed(() => {
  const type = props.deviceStatus?.moduleType
  if (!type) return t('modules.types.unknown') || 'Module inconnu'
  return t(`modules.types.${type}`) || type
})
</script>
