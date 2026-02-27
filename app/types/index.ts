// ============================================================================
// MQTT Types
// ============================================================================

export interface MqttMessage {
  topic: string
  value: number | null
  time: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Database Types
// ============================================================================

export interface DbSize {
  size?: number
  unit?: string
}
