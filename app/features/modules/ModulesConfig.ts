export interface SensorGroupDefinition {
  type: string
  label: string
  color: string
  sensorTypes: string[]
}
export const sensorGroupsDefinition: SensorGroupDefinition[] = [
  { type: 'temperature', label: 'Température', color: 'orange', sensorTypes: ['temperature'] },
  { type: 'humidity', label: 'Humidité', color: 'blue', sensorTypes: ['humidity'] },
  { type: 'co2', label: 'CO2', color: 'emerald', sensorTypes: ['co2', 'eco2'] },
  { type: 'co', label: 'CO', color: 'amber', sensorTypes: ['co'] },
  { type: 'voc', label: 'COV', color: 'pink', sensorTypes: ['voc', 'tvoc'] },
  { type: 'pressure', label: 'Pression', color: 'cyan', sensorTypes: ['pressure'] },
  {
    type: 'pm',
    label: 'Particules fines',
    color: 'violet',
    sensorTypes: ['pm1', 'pm25', 'pm4', 'pm10'],
  },
]
