<template>
  <UIDropdown
    id="module-filter"
    dropdown-class="top-full left-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl mt-1 overflow-hidden border border-gray-200 dark:border-gray-700"
  >
    <template #trigger="{ isOpen }">
      <button
        class="px-2.5 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5"
        :class="isOpen || modelValue
          ? 'bg-gray-800 dark:bg-gray-700 text-white border-gray-800 dark:border-gray-600' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'"
      >
        <Icon name="tabler:box" class="w-3.5 h-3.5" />
        {{ modelValue ? getModuleLabel(modelValue) : 'Module' }}
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
          <span class="flex items-center gap-2">Tous</span>
          <Icon v-if="!modelValue" name="tabler:check" class="w-3.5 h-3.5 text-emerald-500" />
        </button>
        <button
          v-for="module in modules"
          :key="module.value"
          @click="$emit('update:modelValue', module.value); close()"
          class="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between"
          :class="modelValue === module.value 
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          <span class="flex items-center gap-2">
            <Icon :name="module.icon" class="w-3.5 h-3.5" :class="module.color" />
            {{ module.label }}
          </span>
          <Icon v-if="modelValue === module.value" name="tabler:check" class="w-3.5 h-3.5 text-emerald-500" />
        </button>
      </div>
    </template>
  </UIDropdown>
</template>

<script setup lang="ts">
import UIDropdown from '~/components/design-system/UIDropdown/UIDropdown.vue'

defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

// List of available modules - only real modules, not test/bootstrap artifacts
const modules = [
  { value: 'air-quality', label: 'Air Quality', icon: 'tabler:air-conditioning', color: 'text-green-500' },
  { value: 'air-quality-benchmark', label: 'Air Quality Benchmark', icon: 'tabler:flask', color: 'text-orange-500' },
]

const getModuleLabel = (value: string) => {
  const module = modules.find(m => m.value === value)
  return module ? module.label : value
}
</script>
