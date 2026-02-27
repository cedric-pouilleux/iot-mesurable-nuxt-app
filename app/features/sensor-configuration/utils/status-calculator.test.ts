import { describe, it, expect } from 'vitest'
import { calculateSensorStatus, validateInterval, formatInterval } from './status-calculator'

describe('calculateSensorStatus', () => {
  const NOW = new Date('2024-01-01T12:00:00Z').getTime()

  it('should return "unknown" when lastUpdate is null', () => {
    const result = calculateSensorStatus(null, 60, NOW)
    expect(result).toBe('unknown')
  })

  it('should return "ok" when data is recent (within timeout)', () => {
    const lastUpdate = new Date('2024-01-01T11:59:00Z') // 60s ago
    const result = calculateSensorStatus(lastUpdate, 60, NOW)
    expect(result).toBe('ok')
  })

  it('should return "ok" when exactly at 2× interval', () => {
    const lastUpdate = new Date('2024-01-01T11:58:00Z') // Exactly 120s (2min) ago
    const result = calculateSensorStatus(lastUpdate, 60, NOW)
    expect(result).toBe('ok') // Should be 'ok' since 120s < 130s
  })

  it('should return "missing" when timeout exceeded', () => {
    const lastUpdate = new Date('2024-01-01T10:00:00Z') // 2 hours ago
    const result = calculateSensorStatus(lastUpdate, 60, NOW)
    expect(result).toBe('missing')
  })

  it('should handle 90s interval correctly', () => {
    // 90s interval → timeout = 180s + 10s = 190s
    const lastUpdate = new Date('2024-01-01T11:57:00Z') // 180s ago
    const result = calculateSensorStatus(lastUpdate, 90, NOW)
    expect(result).toBe('ok') // Still within grace period
  })

  it('should return "missing" after grace period for 90s interval', () => {
    // 90s interval → timeout = 180s + 10s = 190s
    const lastUpdate = new Date('2024-01-01T11:56:00Z') // 240s ago
    const result = calculateSensorStatus(lastUpdate, 90, NOW)
    expect(result).toBe('missing')
  })

  it('should handle string dates', () => {
    const lastUpdate = '2024-01-01T11:59:00Z' // 60s ago
    const result = calculateSensorStatus(lastUpdate, 60, NOW)
    expect(result).toBe('ok')
  })

  it('should use default interval when not provided', () => {
    const lastUpdate = new Date('2024-01-01T11:59:00Z') // 60s ago
    const result = calculateSensorStatus(lastUpdate, 0, NOW) // 0 → defaults to 60s
    expect(result).toBe('ok')
  })

  it('should account for grace period correctly', () => {
    // 60s interval → timeout = 120s + 10s = 130s
    const lastUpdate = new Date('2024-01-01T11:57:55Z') // 125s ago
    const result = calculateSensorStatus(lastUpdate, 60, NOW)
    expect(result).toBe('ok') // Within grace period
  })
})

describe('validateInterval', () => {
  it('should accept valid intervals', () => {
    expect(validateInterval(10)).toBe(true) // Min
    expect(validateInterval(60)).toBe(true) // Middle
    expect(validateInterval(300)).toBe(true) // Max
  })

  it('should reject too short intervals', () => {
    expect(validateInterval(5)).toBe(false)
    expect(validateInterval(9)).toBe(false)
  })

  it('should reject too long intervals', () => {
    expect(validateInterval(301)).toBe(false)
    expect(validateInterval(600)).toBe(false)
  })

  it('should reject edge cases', () => {
    expect(validateInterval(0)).toBe(false)
    expect(validateInterval(-10)).toBe(false)
  })
})

describe('formatInterval', () => {
  it('should format seconds only', () => {
    expect(formatInterval(10)).toBe('10s')
    expect(formatInterval(45)).toBe('45s')
  })

  it('should format minutes', () => {
    expect(formatInterval(60)).toBe('1min')
    expect(formatInterval(120)).toBe('2min')
    expect(formatInterval(300)).toBe('5min')
  })

  it('should format minutes and seconds', () => {
    expect(formatInterval(90)).toBe('1min 30s')
    expect(formatInterval(135)).toBe('2min 15s')
  })
})
