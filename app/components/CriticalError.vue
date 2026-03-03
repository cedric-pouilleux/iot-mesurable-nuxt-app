<template>
  <div class="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
    <div class="text-lg font-semibold mb-2 text-red-700">{{ $t('error.title') }}</div>
    <div class="text-sm text-red-600">{{ error.message }}</div>
    <button
      class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      @click="reloadPage"
    >
      {{ $t('common.retry') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

const reloadPage = () => {
  location.reload()
}
</script>
