<template>
  <section data-testid="modules-list">
    <SpinnerLoading v-if="isLoading" :message="$t('loading.modules')" />
    <CriticalError v-else-if="error" :error="error" />
    <div v-else-if="modules.length === 0" class="text-center py-8 text-gray-500">
      {{ $t('modules.empty') }}
    </div>
    <div v-else class="space-y-8">
      <div v-for="group in modulesByZone" :key="group.zoneId ?? 'unassigned'" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
          <Icon name="tabler:map-pin" class="w-5 h-5" />
          {{ group.zoneName }}
          <span class="text-sm font-normal text-gray-400">({{ group.modules.length }})</span>
        </h2>

        <div class="space-y-6">
          <ModulePanel
            v-for="module in group.modules"
            :key="module.id"
            :module-id="module.id"
            :module-name="module.name"
            :device-status="getModuleDeviceStatus(module.id)"
            :sensor-data="getModuleSensorData(module.id)"
            :is-history-loading="isHistoryLoading"
            @zone-changed="handleZoneChanged"
            @open-zone-drawer="openZoneDrawer"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ modules: typeof modules.value }>()
</script>
