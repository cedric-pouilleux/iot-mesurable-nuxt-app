<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
    >
      <Icon name="tabler:language" class="w-4 h-4" />
      <span class="uppercase">{{ locale }}</span>
      <Icon name="tabler:chevron-down" class="w-3 h-3" :class="{ 'rotate-180': isOpen }" />
    </button>
    
    <div
      v-if="isOpen"
      class="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
    >
      <button
        v-for="loc in locales"
        :key="loc.code"
        @click="switchLocale(loc.code)"
        class="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        :class="{ 'text-emerald-600 dark:text-emerald-400 font-medium': locale === loc.code }"
      >
        <span v-if="locale === loc.code">✓</span>
        <span v-else class="w-3"></span>
        {{ loc.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const isOpen = ref(false)

const switchLocale = async (code: string) => {
  await setLocale(code as 'fr' | 'en')
  isOpen.value = false
  // Persist to localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('i18n-locale', code)
  }
}

// Close on click outside
onMounted(() => {
  // Restore from localStorage
  if (typeof localStorage !== 'undefined') {
    const savedLocale = localStorage.getItem('i18n-locale')
    if (savedLocale && locales.value.some((l: any) => l.code === savedLocale)) {
      setLocale(savedLocale as 'fr' | 'en')
    }
  }
  
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      isOpen.value = false
    }
  })
})
</script>
