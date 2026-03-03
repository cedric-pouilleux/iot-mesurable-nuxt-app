<template>
  <div class="mb-6">
    <div class="py-2">
      <div class="flex flex-wrap flex-col sm:flex-row sm:items-center gap-4 mb-4 justify-between">
        <div class="flex items-center gap-4">
          <ModuleLayoutTitle :title="title" @click="$emit('toggle-options')" />
          <ModuleLayoutDiscoCTA v-if="!isOnline" />
        </div>
        <div class="flex items-center gap-2">
          <slot name="header-actions" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <slot name="loading">
        <SpinnerLoading :message="loadingText" />
      </slot>
    </div>

    <div v-else-if="error" class="flex justify-center py-12">
      <CriticalError :error="error" />
    </div>

    <template v-else>
      <slot name="options-panel" />
      <div
        class="grid gap-4 cards-transition"
        style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))"
        :class="{ 'cards-pushed': optionsPanelOpen }"
      >
        <slot name="cards" />
      </div>
      <slot name="extra" />
    </template>
  </div>
</template>

<script setup lang="ts">
import SpinnerLoading from '~/components/SpinnerLoading.vue'
import ModuleLayoutDiscoCTA from './ModuleLayoutDiscoCTA.vue'
import ModuleLayoutTitle from './ModuleLayoutTitle.vue'
import CriticalError from '~/components/CriticalError.vue'
import type { NuxtError } from '#app'

interface Props {
  title: string
  isOnline?: boolean
  loading?: boolean
  loadingText?: string
  optionsPanelOpen?: boolean
  error?: NuxtError
}

withDefaults(defineProps<Props>(), {
  isOnline: true,
  loading: false,
  loadingText: 'Chargement...',
  optionsPanelOpen: false,
  error: undefined,
})

defineEmits<{
  (e: 'toggle-options'): void
}>()
</script>
