import type { SensorData, SensorDataPoint } from '~/features/modules/common/types'
import { getApiModulesIdStatus, getApiModulesIdHistory } from '#api/client'
import { extractAndProcessSensorsHistory } from '~/utils/data-processing'
import { GetApiModulesIdHistoryBucket, type GetApiModulesIdStatus200 } from '~/api/model'

export const useModuleServices = () => {
  const { handleApiResponse } = useApiErrorHandler()

  async function fetchModuleInfos(moduleId: string): Promise<GetApiModulesIdStatus200> {
    const response = await getApiModulesIdStatus(moduleId)
    return handleApiResponse(response)
  }

  async function fetchModuleSensorsGraphData(
    moduleId: string,
    duration: string = '24h',
    bucket: GetApiModulesIdHistoryBucket = 'auto'
  ): Promise<SensorData | null> {
    const response = await getApiModulesIdHistory(moduleId, {
      duration,
      bucket,
    })
    const rawData: Record<string, unknown> = handleApiResponse(response)
    return extractAndProcessSensorsHistory(rawData)
  }

  return {
    fetchModuleInfos,
    fetchModuleSensorsGraphData,
  }
}
