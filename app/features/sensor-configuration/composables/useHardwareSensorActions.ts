import { ref, type Ref } from 'vue'
import { useSnackbar } from '~/components/design-system/UISnackbar/useSnackbar'
import { updateSensorInterval, toggleSensorEnabled, resetSensor as resetSensorAPI } from '../services/sensor-config.service'

/**
 * Composable for hardware sensor actions
 * 
 * Consolidates all API actions with their loading states:
 * - Reset sensor
 * - Toggle enabled/disabled
 * - Update interval
 */
export function useHardwareSensorActions(moduleId: Ref<string>) {
    const { showSnackbar } = useSnackbar()

    // Loading states
    const resetting = ref(false)
    const toggling = ref(false)
    const saving = ref(false)

    /**
     * Reset (reboot) a hardware sensor
     */
    const resetSensor = async (hardwareKey: string, name: string): Promise<boolean> => {
        if (resetting.value) return false

        resetting.value = true
        showSnackbar(`Reset ${name}...`, 'info')

        try {
            const success = await resetSensorAPI(moduleId.value, hardwareKey)

            if (success) {
                showSnackbar(`✓ ${name} reset envoyé`, 'success')
                return true
            } else {
                showSnackbar(`Erreur reset`, 'error')
                return false
            }
        } catch (err) {
            console.error('Failed to reset sensor:', err)
            showSnackbar(`Erreur reset ${name}`, 'error')
            return false
        } finally {
            resetting.value = false
        }
    }

    /**
     * Toggle sensor enabled/disabled state
     */
    const toggleEnabled = async (hardwareKey: string, currentState: boolean): Promise<boolean> => {
        if (toggling.value) return currentState

        const newState = !currentState
        toggling.value = true

        try {
            const success = await toggleSensorEnabled(moduleId.value, hardwareKey, newState)

            if (success) {
                showSnackbar(newState ? 'Capteur activé' : 'Capteur désactivé', 'success')
                return newState
            } else {
                showSnackbar('Erreur lors du changement de statut', 'error')
                return currentState
            }
        } catch (err) {
            console.error('Failed to toggle sensor:', err)
            showSnackbar('Erreur lors du changement de statut', 'error')
            return currentState
        } finally {
            toggling.value = false
        }
    }

    /**
     * Update sensor interval with debouncing
     */
    const updateInterval = async (hardwareKey: string, interval: number): Promise<boolean> => {
        if (saving.value) return false

        saving.value = true

        try {
            const success = await updateSensorInterval(moduleId.value, hardwareKey, interval)

            if (success) {
                showSnackbar('Intervalle sauvegardé', 'success')
                return true
            } else {
                showSnackbar('Erreur lors de la sauvegarde', 'error')
                return false
            }
        } catch (err) {
            console.error('Failed to update interval:', err)
            showSnackbar('Erreur lors de la sauvegarde', 'error')
            return false
        } finally {
            saving.value = false
        }
    }

    return {
        // Loading states
        resetting,
        toggling,
        saving,

        // Actions
        resetSensor,
        toggleEnabled,
        updateInterval
    }
}
