<template>
  <!-- Panel -->
  <div>
    <!-- Header -->
    <div class="pb-4 relative z-10">
      <div class="flex items-center justify-between">
        <!-- Left: Title only -->
        <div class="flex items-center gap-2">
          <span class="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-600 to-gray-800 dark:from-white dark:via-gray-200 dark:to-gray-500 filter drop-shadow-sm leading-none">{{ title }}</span>
        </div>
        
        <!-- Right: Header Extra (filters) + Actions + Close Button -->
        <div class="flex items-center gap-3">
          <!-- Header Extra Slot (e.g., sensor chips, filters) -->
          <div v-if="$slots['header-extra']" class="flex gap-1.5">
            <slot name="header-extra" />
          </div>

          <!-- Actions Slot -->
          <div v-if="$slots.actions" class="flex items-center">
            <slot name="actions" />
          </div>

          <!-- Close button -->
          <UIButton
            icon="tabler:x"
            :label="$t('common.close')"
            variant="ghost"
            size="middle"
            :clickable="true"
            @click="$emit('close')"
          />
        </div>
      </div>
    </div>
    
    <!-- Content (Chart or other) -->
    <div class="h-80 w-full relative">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SensorCardOpen.vue
 * ==================
 * Reusable "shell" for an expanded sensor card.
 * Provides consistent styling for title, header, and content container.
 */
import UIButton from '~/components/design-system/UIButton/UIButton.vue'

defineProps<{
  title: string
  color: string
}>()

defineEmits<{
  close: []
}>()
</script>
