<template>
  <div class="flex-1 min-w-[150px]">
    <div class="relative">
      <Icon
        name="tabler:search"
        class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
      />
      <input
        :value="modelValue"
        type="text"
        placeholder="Rechercher..."
        class="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
