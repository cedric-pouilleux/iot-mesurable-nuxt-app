<template>
  <div class="flex items-center gap-2 cursor-pointer group" title="Ouvrir les options">
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
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
