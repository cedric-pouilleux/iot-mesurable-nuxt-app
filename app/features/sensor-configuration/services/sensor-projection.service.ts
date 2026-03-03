/**
 * Service for managing sensor projections (user preferences)
 * This is NOT a composable - it's just plain async functions
 */

/**
 * Update sensor projection preference
 */
export async function updateSensorProjection(
  moduleId: string,
  slotName: string,
  sensorType: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/modules/${moduleId}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [`sensor-pref-${slotName}`]: sensorType,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return true
  } catch (error) {
    console.error('Failed to update sensor projection:', error)
    return false
  }
}
