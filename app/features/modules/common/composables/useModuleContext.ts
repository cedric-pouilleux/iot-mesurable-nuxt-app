import { inject } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import type { DeviceStatus, SensorDataPoint } from '../types'

export interface ModuleContext {
  moduleId: Ref<string>
  deviceStatus: Ref<DeviceStatus> // ensure it is non-null if we provide it or wait, deviceStatus is computed, it might be empty object but not null usually? Actually useModulesData returns a reactive object or empty.
  sensorData: Ref<Record<string, SensorDataPoint[]>>
  graphDuration: Ref<string>
}

export const ModuleContextKey: InjectionKey<ModuleContext> = Symbol('ModuleContext')

export function useModuleContext() {
  const context = inject(ModuleContextKey)
  if (!context) {
    throw new Error('useModuleContext must be used within a component wrapped by ModuleProvider')
  }
  return context
}
