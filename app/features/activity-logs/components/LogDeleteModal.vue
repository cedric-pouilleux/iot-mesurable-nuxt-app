<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    @click="$emit('cancel')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700" @click.stop>
      <h3 class="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Confirmer la suppression</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-6">
        Êtes-vous sûr de vouloir supprimer tous les logs ? Cette action est irréversible.
        <span class="font-semibold">{{ total }} logs</span> seront supprimés.
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          @click="$emit('cancel')"
        >
          Annuler
        </button>
        <button
          :disabled="deleting"
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('confirm')"
        >
          {{ deleting ? 'Suppression...' : 'Supprimer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  total: number
  deleting: boolean
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
