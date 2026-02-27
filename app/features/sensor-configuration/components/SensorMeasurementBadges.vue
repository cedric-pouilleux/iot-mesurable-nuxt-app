<template>
  <!--
    SensorMeasurementBadges
    Displays measurement type badges for a sensor
    When disabled, badges are shown with reduced opacity to indicate last known values
  -->
  <div
    class="flex items-center gap-1 flex-shrink-0 transition-opacity"
    :class="{ 'opacity-40': !isEnabled }"
  >
    <UITag
      v-for="m in measurements"
      :key="m.key"
      :variant="getVariant(m.status)"
      size="xs"
      :light="true"
    >
      {{ m.label }}
    </UITag>
  </div>
</template>

<script setup lang="ts">
import UITag from '~/components/design-system/UITag/UITag.vue'
import { getMeasurementVariant } from '../utils/status-helpers'

interface Measurement {
  key: string
  label: string
  status: 'ok' | 'missing' | 'unknown' | 'disabled'
  value?: number
}

interface Props {
  measurements: Measurement[]
  isEnabled: boolean
}

defineProps<Props>()

const getVariant = (status: string) => getMeasurementVariant(status)
</script>
