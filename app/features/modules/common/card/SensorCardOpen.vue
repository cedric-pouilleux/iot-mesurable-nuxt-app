<template>
  <!-- Panel -->
  <div class="rounded-lg shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="py-2 border-b border-gray-100 dark:border-gray-700 relative z-10">
      <div class="flex items-center justify-between">
        <!-- Left: Title + Header Extra -->
        <div class="flex items-center gap-3 flex-wrap">
          <!-- Title -->
          <div class="flex items-center gap-2">
            <span class="font-bold text-2xl" :style="{ color: color }">{{ title }}</span>
          </div>
          
          <!-- Header Extra Slot (e.g., sensor chips) -->
          <div v-if="$slots['header-extra']" class="flex gap-1.5 ml-4">
            <slot name="header-extra" />
          </div>
        </div>
        
        <!-- Right: Actions + Close Button -->
        <div class="flex items-center gap-2">
          <!-- Actions Slot -->
          <div v-if="$slots.actions" class="flex items-center">
            <slot name="actions" />
          </div>

          <!-- Close button -->
          <button 
            @click="$emit('close')"
            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Fermer"
          >
            <Icon name="tabler:x" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Content (Chart or other) -->
    <div class="bg-gray-50 dark:bg-gray-800 h-80 w-full relative p-4">
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

defineProps<{
  title: string
  color: string
}>()

defineEmits<{
  close: []
}>()
</script>
