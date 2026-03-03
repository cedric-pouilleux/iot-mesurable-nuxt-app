<template>
  <UIButton
    icon="tabler:settings"
    :icon-class="{ 'rotate-90': optionsPanelOpen }"
    :variant="optionsPanelOpen ? 'blue' : 'ghost'"
    size="small"
    :clickable="true"
    :label="$t('common.options')"
    :title="$t('common.options')"
    @click="optionsPanelOpen = !optionsPanelOpen"
  />
  <NuxtLink
    :to="localePath({ name: 'logs', query: { moduleId, category: 'HARDWARE' } })"
    target="_blank"
    :title="$t('nav.logs')"
  >
    <UIButton
      icon="tabler:notes"
      variant="ghost"
      size="small"
      :label="$t('nav.logs')"
      :clickable="true"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
import UIButton from '~/components/design-system/UIButton/UIButton.vue'

import { useModuleContext } from './composables/useModuleContext'

const { moduleId } = useModuleContext()

const optionsPanelOpen = defineModel<boolean>('optionsPanelOpen', { required: true })
const localePath = useLocalePath()
</script>
