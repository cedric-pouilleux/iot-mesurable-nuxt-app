<template>
  <UIDropdown
    id="direction-filter"
    dropdown-class="top-full left-0 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl mt-1 overflow-hidden border border-gray-200 dark:border-gray-700"
  >
    <template #trigger="{ isOpen }">
      <button
        class="px-2.5 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5"
        :class="isOpen || modelValue
          ? 'bg-gray-800 dark:bg-gray-700 text-white border-gray-800 dark:border-gray-600' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'"
      >
        <Icon :name="modelValue === 'OUT' ? 'tabler:broadcast' : modelValue === 'IN' ? 'tabler:antenna' : 'tabler:transfer'" class="w-3.5 h-3.5" />
        {{ modelValue === 'OUT' ? 'Envoi' : modelValue === 'IN' ? 'Réception' : 'Direction' }}
        <Icon name="tabler:chevron-down" class="w-3 h-3" />
      </button>
    </template>
    <template #content="{ close }">
      <div class="py-1">
        <button
          @click="$emit('update:modelValue', ''); close()"
          class="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between"
          :class="!modelValue 
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          <span class="flex items-center gap-2">Toutes</span>
          <Icon v-if="!modelValue" name="tabler:check" class="w-3.5 h-3.5 text-emerald-500" />
        </button>
        <button
          @click="$emit('update:modelValue', 'OUT'); close()"
          class="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between"
          :class="modelValue === 'OUT' 
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          <span class="flex items-center gap-2">
            <Icon name="tabler:broadcast" class="w-3.5 h-3.5 text-orange-500" />
            Envoi
          </span>
          <Icon v-if="modelValue === 'OUT'" name="tabler:check" class="w-3.5 h-3.5 text-emerald-500" />
        </button>
        <button
          @click="$emit('update:modelValue', 'IN'); close()"
          class="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between"
          :class="modelValue === 'IN' 
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          <span class="flex items-center gap-2">
            <Icon name="tabler:antenna" class="w-3.5 h-3.5 text-cyan-500" />
            Réception
          </span>
          <Icon v-if="modelValue === 'IN'" name="tabler:check" class="w-3.5 h-3.5 text-emerald-500" />
        </button>
      </div>
    </template>
  </UIDropdown>
</template>

<script setup lang="ts">
import UIDropdown from '~/components/design-system/UIDropdown/UIDropdown.vue'

defineProps<{
  modelValue: '' | 'IN' | 'OUT'
}>()

defineEmits<{
  'update:modelValue': [value: '' | 'IN' | 'OUT']
}>()
</script>
