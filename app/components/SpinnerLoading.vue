<template>
  <div>
    <div
      class="animate-spin w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full mx-auto mb-4"
    ></div>
    <div class="text-gray-400">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>
