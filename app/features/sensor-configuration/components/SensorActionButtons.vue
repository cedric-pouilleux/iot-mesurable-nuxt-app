<template>
  <!--
    SensorActionButtons
    Action buttons for controlling a hardware sensor (stop/play/reset)
  -->
  <div class="flex items-center gap-0 flex-shrink-0">
    <!-- Stop/Play Button -->
    <UITooltip :text="isEnabled ? 'Arrêter le capteur' : 'Démarrer le capteur'">
      <button
        @click="$emit('toggle')"
        :disabled="toggling"
        class="p-1 rounded transition-colors"
        :class="[
          isEnabled 
            ? 'hover:bg-orange-50 dark:hover:bg-orange-900/30 text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400' 
            : 'hover:bg-green-50 dark:hover:bg-green-900/30 text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300',
          { 'opacity-50': toggling }
        ]"
      >
        <Icon 
          :name="toggling ? 'tabler:loader' : (isEnabled ? 'tabler:player-stop' : 'tabler:player-play')" 
          class="w-3.5 h-3.5" 
          :class="{ 'animate-spin': toggling }" 
        />
      </button>
    </UITooltip>
    
    <!-- Reset Button (only when enabled) -->
    <UITooltip v-if="isEnabled" text="Redémarrer le capteur">
      <button
        @click="$emit('reset')"
        :disabled="resetting"
        class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        :class="{ 'animate-spin': resetting }"
      >
        <Icon 
          :name="resetting ? 'tabler:loader' : 'tabler:refresh'" 
          class="w-3.5 h-3.5" 
        />
      </button>
    </UITooltip>
  </div>
</template>

<script setup lang="ts">
import UITooltip from '~/components/design-system/UITooltip/UITooltip.vue'

interface Props {
  isEnabled: boolean
  toggling: boolean
  resetting: boolean
}

defineProps<Props>()

defineEmits<{
  'toggle': []
  'reset': []
}>()
</script>
