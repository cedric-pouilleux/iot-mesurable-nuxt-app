<template>
  <UIDropdown
    id="category-filter"
    dropdown-class="top-full left-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl mt-1 overflow-hidden border border-gray-200 dark:border-gray-700"
  >
    <template #trigger="{ isOpen }">
      <button
        class="px-2.5 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5"
        :class="isOpen || modelValue.length > 0
          ? 'bg-gray-800 dark:bg-gray-700 text-white border-gray-800 dark:border-gray-600' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'"
      >
        <Icon name="tabler:category" class="w-3.5 h-3.5" />
        Catégorie
        <span v-if="modelValue.length > 0" class="bg-white/20 px-1 py-0.5 rounded text-[10px]">
          {{ modelValue.length }}
        </span>
        <Icon name="tabler:chevron-down" class="w-3 h-3" />
      </button>
    </template>
    <template #content>
      <div class="py-1">
        <button
          @click="$emit('update:modelValue', [])"
          class="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between"
          :class="modelValue.length === 0 
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          Toutes
          <Icon v-if="modelValue.length === 0" name="tabler:check" class="w-3.5 h-3.5 text-emerald-500" />
        </button>
        <button
          v-for="cat in LOG_CATEGORIES"
          :key="cat.value"
          @click="toggle(cat.value)"
          class="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between"
          :class="modelValue.includes(cat.value) 
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          <span class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: cat.color }"></div>
            {{ cat.label }}
          </span>
          <Icon v-if="modelValue.includes(cat.value)" name="tabler:check" class="w-3.5 h-3.5 text-emerald-500" />
        </button>
      </div>
    </template>
  </UIDropdown>
</template>

<script setup lang="ts">
import UIDropdown from '~/components/design-system/UIDropdown/UIDropdown.vue'
import { LOG_CATEGORIES } from '../../config/constants'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const toggle = (value: string) => {
  const list = [...props.modelValue]
  const index = list.indexOf(value)
  if (index > -1) {
    list.splice(index, 1)
  } else {
    list.push(value)
  }
  emit('update:modelValue', list)
}
</script>
