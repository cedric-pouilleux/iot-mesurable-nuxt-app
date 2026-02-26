import type { GetApiModules200Item } from '#api/model'
import { getApiModules } from '#api/client'

export const useModules = () => {
  const modules = ref<GetApiModules200Item[]>([])
  const error = ref<string | null>(null)

  const loadModules = async () => {
    try {
      const response = await getApiModules()
      if (response.data) {
        modules.value = response.data
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Erreur de connexion'
      error.value = `Impossible de charger les modules: ${errorMessage}`
      console.error('Erreur fetch modules:', e)
    }
  }

  const addModuleFromTopic = (topic: string) => {
    const topicParts = topic.split('/')
    // New format: mesurable/{chipId}/{subtopic}/...
    if (topicParts.length < 3 || topicParts[0] !== 'mesurable') return null

    const chipId = topicParts[1]

    // DISABLED: Automatic module addition from MQTT topics
    // We rely solely on the API (which uses chipId as module_id) as the source of truth.
    // Modules are loaded via loadModules() which fetches from /api/modules

    return null
  }

  return {
    modules: readonly(modules),
    error: readonly(error),
    loadModules,
    addModuleFromTopic,
  }
}
