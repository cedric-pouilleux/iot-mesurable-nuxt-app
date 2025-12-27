<template>
  <UIPanel title="Configuration des cartes">
    <!-- Minimalist Mode -->
    <div class="flex items-center justify-between mb-3 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
      <span class="text-xs font-medium text-gray-700 dark:text-gray-200">Affichage minimaliste</span>
      <UITooltip text="Masquer les graphiques et options avancées pour une vue compacte">
        <UIToggle v-model="minimalMode" size="small" />
      </UITooltip>
    </div>

    <!-- Threshold Indicators (Always Visible) -->
    <div 
      class="flex items-center justify-between"
      :class="!minimalMode ? 'mb-3 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700' : ''"
    >
      <span class="text-xs text-gray-700 dark:text-gray-200">Indicateurs de seuils</span>
      <UITooltip text="Afficher un point coloré (Vert/Orange/Rouge) selon la valeur">
        <UIToggle v-model="showAlertThresholds" size="small" />
      </UITooltip>
    </div>
    
    <!-- Standard options (hidden when minimal mode is on) -->
    <template v-if="!minimalMode">
      <div class="space-y-4">
        
        <!-- Graph Settings Group -->
        <div>
          <span class="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-2 block">Graphiques</span>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2">
            <!-- Duration -->
            <div class="col-span-2 flex items-center justify-between">
              <span class="text-xs text-gray-500 dark:text-gray-400">Période affichée</span>
              <UITooltip text="Plage de temps affichée sur les mini-charts">
                <UISelect
                  v-model="graphDuration"
                  :options="['1h', '6h', '12h', '24h', '7j']"
                  size="small"
                  class="w-24"
                  dropdown-class="right-0 origin-top-right"
                />
              </UITooltip>
            </div>

            <!-- Color Thresholds -->
            <div class="col-span-2 flex items-center justify-between">
              <span class="text-xs text-gray-500 dark:text-gray-400">Afficher les seuils</span>
              <UITooltip text="Colorer la courbe selon les seuils (Vert/Orange/Rouge)">
                <UIToggle v-model="colorThresholds" size="small" />
              </UITooltip>
            </div>

            <!-- Fixed Scale -->
            <div class="col-span-2 flex items-center justify-between">
              <span class="text-xs text-gray-500 dark:text-gray-400">Échelle fixe total</span>
              <UITooltip text="Utiliser une échelle Y fixe (0-100% ou max capteur) pour comparer visuellement">
                <UIToggle v-model="useFixedScale" size="small" />
              </UITooltip>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UIPanel>
</template>

<script setup lang="ts">
import { useChartSettings } from './composables'
import UIToggle from '~/components/design-system/UIToggle/UIToggle.vue'
import UISelect from '~/components/design-system/UISelect/UISelect.vue'
import UIPanel from '~/components/design-system/UIPanel/UIPanel.vue'
import UITooltip from '~/components/design-system/UITooltip/UITooltip.vue'

const { 
  showCharts, 
  showThresholdLines, 
  colorThresholds, 
  showAlertThresholds, 
  minimalMode,
  graphDuration,
  useFixedScale
} = useChartSettings()
</script>
