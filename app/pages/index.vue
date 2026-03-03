<template>
  <div class="min-h-screen dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-4 sm:p-8">
    <ZoneDrawer
      :is-open="isZoneDrawerOpen"
      @close="isZoneDrawerOpen = false"
      @zone-changed="handleZoneChanged"
    />
    <div class="max-w-7xl mx-auto">
      <main>
        <SpinnerLoading v-if="isLoading" :message="$t('loading.modules')" />
        <CriticalError v-else-if="error" :error="error" />
        <div v-else-if="!modules.length" class="text-center py-8 text-gray-500">
          {{ $t('modules.empty') }}
        </div>
        <div v-else class="space-y-8">
          <ZoneGroup v-for="group in modulesByZone" :key="group.zoneId" :group="group">
            <div class="space-y-6">
              <Module
                v-for="module in group.modules"
                :key="module.id"
                :module="module"
                @zone-changed="handleZoneChanged"
                @open-zone-drawer="isZoneDrawerOpen = true"
              />
            </div>
          </ZoneGroup>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MqttMessage } from '../types'
import ZoneDrawer from '~/features/zones/components/ZoneDrawer.vue'
import { useModules, useModulesData } from '~/features/modules/common/composables'
import { useMqtt } from '~/features/mqtt/composables/useMqtt'
import { useZones } from '~/features/zones/composables/useZones'

import Module from '~/features/modules/Module.vue'
import ZoneGroup from '~/features/zones/components/ZoneGroup.vue'
import type { Module as ModuleType } from '~/features/modules/common/types'

export interface ModuleZones {
  zoneId: string | null
  zoneName: string
  modules: ModuleType[]
}

const { zones, fetchZones } = useZones()
const { t } = useI18n()
const { modules, error: modulesError, loadModules, addModuleFromTopic } = useModules()
const { handleModuleMessage, initializeModuleWithType } = useModulesData()

const isInitialLoading = ref(true)
const isLoading = computed(() => isInitialLoading.value)
const error = computed(() => modulesError.value)

const isZoneDrawerOpen = ref(false)

const modulesByZone = computed<ModuleZones[]>(() => {
  const groups: ModuleZones[] = zones.value
    .map(zone => ({
      zoneId: zone.id,
      zoneName: zone.name,
      modules: modules.value.filter(m => zone.devices?.some(d => d.moduleId === m.id)),
    }))
    .filter(group => group.modules.length)

  const assignedModuleIds = new Set(groups.flatMap(g => g.modules.map(m => m.id)))
  const unassigned = modules.value.filter(m => !assignedModuleIds.has(m.id))

  if (unassigned.length) {
    groups.push({
      zoneId: null,
      zoneName: t('zones.unassigned'),
      modules: unassigned,
    })
  }

  return groups
})

/**
 * Handle zone changes - refresh zones list only (status will update via MQTT/next refresh)
 */
const handleZoneChanged = async () => {
  // Refresh zones list only - avoid reloading all module data
  await fetchZones()
}

/**
 * Handle incoming MQTT message
 * Topics use mesurable/{chipId}/... format
 * Module IDs in the API now match chipId directly
 */
const handleMqttMessage = (message: MqttMessage): void => {
  const topicParts = message.topic.split('/')
  // New format: mesurable/{chipId}/{subtopic}/...
  if (topicParts.length < 3 || topicParts[0] !== 'mesurable') return

  const chipId = topicParts[1]

  // Find the matching module by chipId
  const matchingModule = modules.value.find(m => {
    // Module ID is chipId in new format, or could be moduleId@chipId in legacy
    const atIndex = m.id.indexOf('@')
    const moduleChipId = atIndex > 0 ? m.id.substring(atIndex + 1) : m.id
    return moduleChipId === chipId || m.id === chipId
  })

  if (!matchingModule) {
    addModuleFromTopic(message.topic)
    return
  }

  // Process message using the module ID
  handleModuleMessage(matchingModule.id, message)
}

// MQTT connection
const { connect: connectMqtt, disconnect: disconnectMqtt } = useMqtt({
  onMessage: handleMqttMessage,
})

onMounted(async () => {
  isInitialLoading.value = true
  await Promise.all([loadModules(), fetchZones()])

  // Initialize moduleType for each module from API /modules response
  // This ensures moduleType is available even if /status endpoint fails
  modules.value.forEach(module => {
    if (module.type && module.type !== 'unknown') {
      initializeModuleWithType(module.id, module.type)
    }
  })

  connectMqtt()
  isInitialLoading.value = false
})

onUnmounted(() => {
  disconnectMqtt()
})
</script>
