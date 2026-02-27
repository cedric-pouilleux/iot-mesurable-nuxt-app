<template>
  <div class="mb-6">
    <!-- Header -->
    <div class="py-2">
      <div class="flex flex-wrap flex-col sm:flex-row sm:items-center gap-4 mb-4 justify-between">
        <div class="flex items-center gap-4">
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
              {{ title }}
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
        </div>

        <!-- Right: Controls -->
        <div class="flex items-center gap-2">
          <slot name="header-actions" />
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <slot name="loading">
        <SpinnerLoading :message="loadingText" />
      </slot>
    </div>

    <template v-else>
      <!-- Options Panel (collapsible) -->
      <slot name="options-panel" />

      <!-- Main Content (Cards Grid) -->
      <div
        class="grid gap-4 cards-transition"
        style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))"
        :class="{ 'cards-pushed': optionsPanelOpen }"
      >
        <slot name="cards" />
      </div>

      <!-- Extra (e.g Detailed Graph) -->
      <slot name="extra" />
    </template>
  </div>
</template>

<script setup lang="ts">
import SpinnerLoading from '~/components/SpinnerLoading.vue'

interface Props {
  title: string
  isOnline?: boolean
  loading?: boolean
  loadingText?: string
  optionsPanelOpen?: boolean
}

withDefaults(defineProps<Props>(), {
  isOnline: true,
  loading: false,
  loadingText: 'Chargement...',
  optionsPanelOpen: false,
})

defineEmits<{
  (e: 'toggle-options'): void
}>()
</script>

<style scoped>
.cards-transition {
  transition: transform 0.1s linear;
}

.cards-pushed {
  /* You can add specific styles here if needed when options panel is open */
}
</style>
