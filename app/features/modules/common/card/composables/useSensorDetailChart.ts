import { computed, type Ref } from 'vue'
import { getSensorRange, getNormalizationRatio } from '../../config/sensors'
import { getSensorUnit, getSensorColor } from '../../utils/sensors'
import type { ChartData, ChartOptions } from 'chart.js'
import type { SensorDataPoint } from '../../types'
import { useThresholds } from '~/features/modules/common/card/composables'
import { useChartSettings } from '~/features/modules/common/module-panel/composables'
import type { SensorGroupInfo, SensorItem } from './useSensorDetailGraphState'

export function useSensorDetailChart(
  moduleId: Ref<string>,
  group: Ref<SensorGroupInfo>,
  selectedSensorKeys: Ref<Set<string>>,
  historyMap: Ref<Record<string, SensorDataPoint[]>>,
  autoZoom: Ref<boolean>,
  hasHistory: Ref<boolean>,
  isDark: Ref<boolean>,
  filterByDuration: (data: SensorDataPoint[]) => SensorDataPoint[],
  getPrimaryHistory: () => SensorDataPoint[]
) {
  const { getThresholdDefinition } = useThresholds()
  const { showThresholdLines } = useChartSettings(moduleId)

  const baseHexColor = computed(() => getSensorColor(group.value.type))
  const shadeMultipliers = [1.0, 0.7, 1.3, 0.5, 1.5]

  const getSensorShadeColor = (index: number): string => {
    const baseColor = baseHexColor.value
    const multiplier = shadeMultipliers[index % shadeMultipliers.length]
    const r = parseInt(baseColor.slice(1, 3), 16)
    const g = parseInt(baseColor.slice(3, 5), 16)
    const b = parseInt(baseColor.slice(5, 7), 16)
    const adjustedR = Math.min(255, Math.max(0, Math.round(r * multiplier)))
    const adjustedG = Math.min(255, Math.max(0, Math.round(g * multiplier)))
    const adjustedB = Math.min(255, Math.max(0, Math.round(b * multiplier)))
    return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`
  }

  const getSensorColorByKey = (sensorKey: string): string => {
    const index = group.value.sensors?.findIndex((s: SensorItem) => s.key === sensorKey) ?? 0
    return getSensorShadeColor(index)
  }

  const getSensorDisplayLabel = (sensor: SensorItem): string => {
    const keyParts = sensor.key.split(':')
    const sensorType = keyParts.length > 1 ? keyParts[1] : sensor.key
    if (/^pm\d/.test(sensorType)) {
      return sensor.label
    }
    return sensor.model || sensor.label
  }

  const allDataValues = computed(() => {
    const values: number[] = []
    const hasMultiSensorData =
      group.value.sensors &&
      group.value.sensors.length >= 1 &&
      Object.keys(historyMap.value || {}).length > 0

    if (hasMultiSensorData) {
      for (const sensorKey of selectedSensorKeys.value) {
        const rawHistory = historyMap.value?.[sensorKey]
        const sensorHistory = filterByDuration(rawHistory || [])
        if (sensorHistory.length > 0) {
          const ratio = getNormalizationRatio(sensorKey)
          values.push(
            ...sensorHistory.map(d => d.value / ratio).filter(v => v !== null && v !== undefined)
          )
        }
      }
    } else {
      const filteredHistory = filterByDuration(getPrimaryHistory())
      values.push(...filteredHistory.map(d => d.value).filter(v => v !== null && v !== undefined))
    }
    return values
  })

  // Determine global min/max for Y axis
  const graphMinMax = computed(() => {
    const isNegativeAllowed = (() => {
      if (
        group.value.sensors &&
        group.value.sensors.length >= 1 &&
        selectedSensorKeys.value.size > 0
      ) {
        for (const key of selectedSensorKeys.value) {
          if (key.toLowerCase().includes('temp')) return true
        }
        return false
      }
      const currentSensor = group.value.initialKey || ''
      return (
        currentSensor.toLowerCase().includes('temp') || currentSensor.toLowerCase().includes('rssi')
      )
    })()

    if (autoZoom.value) {
      const values = allDataValues.value
      if (values.length === 0) return { min: 0, max: 100 }

      const dataMin = Math.min(...values)
      const dataMax = Math.max(...values)
      const range = dataMax - dataMin || 1
      const padding = range * 0.05

      let min = Math.floor(dataMin - padding)
      if (!isNegativeAllowed && min < 0) {
        min = 0
      }

      return {
        min,
        max: Math.ceil(dataMax + padding),
      }
    }

    const firstKey = Array.from(selectedSensorKeys.value)[0]
    const sensorType = firstKey || group.value.initialKey
    const range = getSensorRange(sensorType)

    if (range) {
      return range
    }

    if (!hasHistory.value) return { min: 0, max: 100 }

    const historyData = getPrimaryHistory()
    const values = historyData.map(d => d.value).filter(v => v !== null && v !== undefined)
    if (values.length === 0) return { min: 0, max: 100 }
    const min = Math.min(...values)
    const max = Math.max(...values)

    const range2 = max - min || 1
    let minWithPadding = min - range2 * 0.1
    const maxWithPadding = max + range2 * 0.1

    if (!isNegativeAllowed && minWithPadding < 0) {
      minWithPadding = 0
    }

    return {
      min: minWithPadding,
      max: maxWithPadding,
    }
  })

  const hexToRgba = (color: string, alpha: number): string => {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    } else if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
    }
    return color
  }

  const chartData = computed<ChartData<'line'> | null>(() => {
    const hasMultiSensorData =
      group.value.sensors &&
      group.value.sensors.length >= 1 &&
      Object.keys(historyMap.value || {}).length > 0

    if (hasMultiSensorData) {
      const datasets = []
      for (const sensorKey of selectedSensorKeys.value) {
        const rawHistory = historyMap.value?.[sensorKey]
        const sensorHistory = filterByDuration(rawHistory || [])
        if (sensorHistory.length < 2) continue

        const sensor = group.value.sensors?.find((s: SensorItem) => s.key === sensorKey)
        const color = getSensorColorByKey(sensorKey)
        const ratio = getNormalizationRatio(sensorKey)

        const sortedData = [...sensorHistory].sort((a, b) => {
          const timeA = a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime()
          const timeB = b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime()
          return timeA - timeB
        })

        const normalizedData = sortedData.map(m => ({
          x: m.time as unknown as number,
          y: m.value / ratio,
        }))

        const timeGaps: number[] = []
        for (let i = 1; i < sortedData.length; i++) {
          const t1 =
            sortedData[i - 1].time instanceof Date
              ? sortedData[i - 1].time.getTime()
              : new Date(sortedData[i - 1].time).getTime()
          const t2 =
            sortedData[i].time instanceof Date
              ? sortedData[i].time.getTime()
              : new Date(sortedData[i].time).getTime()
          timeGaps.push(t2 - t1)
        }

        const medianGap =
          timeGaps.length > 0
            ? timeGaps.sort((a, b) => a - b)[Math.floor(timeGaps.length / 2)]
            : 60000
        const gapThreshold = Math.max(medianGap * 5, 10 * 60 * 1000)

        const gapIndices = new Set<number>()
        for (let i = 1; i < sortedData.length; i++) {
          const t1 =
            sortedData[i - 1].time instanceof Date
              ? sortedData[i - 1].time.getTime()
              : new Date(sortedData[i - 1].time).getTime()
          const t2 =
            sortedData[i].time instanceof Date
              ? sortedData[i].time.getTime()
              : new Date(sortedData[i].time).getTime()
          if (t2 - t1 > gapThreshold) {
            gapIndices.add(i - 1)
          }
        }

        datasets.push({
          label: sensor ? getSensorDisplayLabel(sensor) : sensorKey,
          backgroundColor: hexToRgba(color, 0.1),
          borderColor: color,
          borderWidth: 2,
          data: normalizedData,
          tension: 0.2,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 2,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: color,
          hitRadius: 8,
          spanGaps: true,
          segment: {
            borderDash: (ctx: { p0DataIndex: number }) =>
              gapIndices.has(ctx.p0DataIndex) ? [6, 6] : undefined,
            borderColor: (ctx: { p0DataIndex: number }) =>
              gapIndices.has(ctx.p0DataIndex) ? hexToRgba(color, 0.4) : undefined,
          },
        })
      }
      if (datasets.length === 0) return null
      return { datasets }
    }

    if (!hasHistory.value) return null

    const filteredHistory = filterByDuration(getPrimaryHistory())
    if (filteredHistory.length < 2) return null

    const sortedData = [...filteredHistory].sort((a, b) => {
      const timeA = a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime()
      const timeB = b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime()
      return timeA - timeB
    })

    const timeGaps: number[] = []
    for (let i = 1; i < sortedData.length; i++) {
      const t1 =
        sortedData[i - 1].time instanceof Date
          ? sortedData[i - 1].time.getTime()
          : new Date(sortedData[i - 1].time).getTime()
      const t2 =
        sortedData[i].time instanceof Date
          ? sortedData[i].time.getTime()
          : new Date(sortedData[i].time).getTime()
      timeGaps.push(t2 - t1)
    }

    const medianGap =
      timeGaps.length > 0 ? timeGaps.sort((a, b) => a - b)[Math.floor(timeGaps.length / 2)] : 60000
    const gapThreshold = Math.max(medianGap * 5, 10 * 60 * 1000)

    const gapIndices = new Set<number>()
    for (let i = 1; i < sortedData.length; i++) {
      const t1 =
        sortedData[i - 1].time instanceof Date
          ? sortedData[i - 1].time.getTime()
          : new Date(sortedData[i - 1].time).getTime()
      const t2 =
        sortedData[i].time instanceof Date
          ? sortedData[i].time.getTime()
          : new Date(sortedData[i].time).getTime()
      if (t2 - t1 > gapThreshold) {
        gapIndices.add(i - 1)
      }
    }

    return {
      datasets: [
        {
          label: group.value.label,
          backgroundColor: hexToRgba(baseHexColor.value, 0.2),
          borderColor: baseHexColor.value,
          borderWidth: 2,
          data: sortedData.map(m => ({ x: m.time as unknown as number, y: m.value })),
          tension: 0.2,
          fill: 'start',
          pointRadius: 0,
          pointHoverRadius: 8,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: baseHexColor.value,
          hitRadius: 10,
          spanGaps: true,
          segment: {
            borderDash: (ctx: { p0DataIndex: number }) =>
              gapIndices.has(ctx.p0DataIndex) ? [6, 6] : undefined,
            borderColor: (ctx: { p0DataIndex: number }) =>
              gapIndices.has(ctx.p0DataIndex) ? hexToRgba(baseHexColor.value, 0.4) : undefined,
          },
        },
      ],
    }
  })

  const chartOptions = computed<ChartOptions<'line'>>(() => {
    const plugins: Record<string, unknown> = {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: '#111827',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: '#374151',
        borderWidth: 1,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: 'bold' as const,
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13,
          weight: 'normal' as const,
        },
        callbacks: {
          title: context => {
            const date = new Date(context[0].parsed.x)
            return date.toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          },
          label: context => {
            const value = context.parsed.y
            if (typeof value !== 'number') return ''
            const formattedValue = Number.isInteger(value)
              ? value.toString()
              : value.toFixed(1).replace(/\.0$/, '')

            const activeKey = Array.from(selectedSensorKeys.value)[0] || group.value.initialKey
            const unit = getSensorUnit(activeKey) || ''
            return `${context.dataset.label}: ${formattedValue} ${unit}`.trim()
          },
        },
      },
    }

    if (showThresholdLines.value && selectedSensorKeys.value.size === 1) {
      const sensorKey = Array.from(selectedSensorKeys.value)[0]
      const thresholds = getThresholdDefinition(sensorKey)
      if (thresholds) {
        plugins.annotation = {
          annotations: {
            moderateLine: {
              type: 'line',
              yMin: thresholds.good,
              yMax: thresholds.good,
              borderColor: 'rgba(245, 158, 11, 0.6)',
              borderWidth: 1,
              borderDash: [4, 4],
              label: { display: false },
            },
            poorLine: {
              type: 'line',
              yMin: thresholds.moderate,
              yMax: thresholds.moderate,
              borderColor: 'rgba(249, 115, 22, 0.6)',
              borderWidth: 1,
              borderDash: [4, 4],
              label: { display: false },
            },
            hazardousLine: {
              type: 'line',
              yMin: thresholds.poor,
              yMax: thresholds.poor,
              borderColor: 'rgba(239, 68, 68, 0.6)',
              borderWidth: 1,
              borderDash: [4, 4],
              label: { display: false },
            },
          },
        }
      }
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      interaction: {
        intersect: false,
        mode: 'nearest',
        axis: 'x',
      },
      scales: {
        x: {
          type: 'time' as const,
          display: true,
          time: {
            displayFormats: {
              minute: 'dd/MM HH:mm',
              hour: 'dd/MM HH:mm',
              day: 'dd/MM',
              month: 'MM/yyyy',
            },
          },
          border: { display: false },
          grid: { color: isDark.value ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6', drawBorder: false },
          ticks: {
            font: { family: "'Inter', sans-serif", size: 11 },
            color: '#9ca3af',
            maxTicksLimit: 8,
          },
        },
        y: {
          display: true,
          min: graphMinMax.value.min,
          max: graphMinMax.value.max,
          border: { display: false },
          grid: { color: isDark.value ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6', drawBorder: false },
          ticks: {
            color: baseHexColor.value,
            font: { family: "'Inter', sans-serif", size: 11 },
            maxTicksLimit: 6,
            callback: function (value) {
              if (typeof value === 'number') {
                return Math.round(value).toString()
              }
              return String(value)
            },
          },
        },
      },
      plugins,
    }
  })

  return {
    chartData,
    chartOptions,
    baseHexColor,
    getSensorDisplayLabel,
    getSensorShadeColor,
    getSensorColorByKey,
  }
}
