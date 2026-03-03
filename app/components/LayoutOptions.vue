<template>
  <div class="fixed top-4 right-4 z-50 flex items-center gap-2">
    <LanguageSwitcher />
    <button
      class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300"
      :title="$t('common.toggleTheme') || 'Toggle theme'"
      @click="toggleColorMode"
    >
      <Icon
        :name="$colorMode.value === 'dark' ? 'tabler:sun' : 'tabler:moon'"
        class="w-6 h-6 transition-transform duration-500 hover:rotate-[360deg]"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import LanguageSwitcher from './design-system/LanguageSwitcher.vue'

const colorMode = useColorMode()

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
