
export interface ManifestHardware {
    key: string
    name: string
    type: string
    sensors: string[]
}

export interface ModuleManifest {
    id: string
    name: string
    version: string
    type?: string
    hardware: ManifestHardware[]
    sensors: any[] // We can define strict types if needed
    actions: any[]
}

export function useModuleManifest(moduleType: Ref<string | undefined | null>) {
    const manifest = ref<ModuleManifest | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const config = useRuntimeConfig()
    // In production, use relative URLs (nginx proxy). In dev, use localhost:3001
    const apiUrl = config.public.apiBase ?? (process.dev ? 'http://localhost:3001' : '')

    const fetchManifest = async () => {
        const type = moduleType.value
        if (!type || type === 'unknown') {
            manifest.value = null
            return
        }

        isLoading.value = true
        error.value = null

        try {
            // Fetch manifest from API
            // Route: GET /modules/types/:type/manifest
            const data = await $fetch<ModuleManifest>(`${apiUrl}/api/modules/types/${type}/manifest`)
            manifest.value = data
        } catch (e) {
            console.error(`Failed to fetch manifest for type ${type}:`, e)
            error.value = 'Impossible de charger le manifest'
        } finally {
            isLoading.value = false
        }
    }

    // Watch for module type changes
    watch(moduleType, () => {
        fetchManifest()
    }, { immediate: true })

    return {
        manifest,
        isLoading,
        error,
        fetchManifest
    }
}
