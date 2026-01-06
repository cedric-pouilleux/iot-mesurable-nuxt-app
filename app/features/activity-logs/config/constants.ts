export const LOG_CATEGORIES = [
    { value: 'HARDWARE', label: 'Hardware', color: '#6366f1' },
    { value: 'MQTT', label: 'MQTT', color: '#f97316' },
    { value: 'DB', label: 'DB', color: '#06b6d4' },
    { value: 'API', label: 'API', color: '#ec4899' },
    { value: 'WEBSOCKET', label: 'WebSocket', color: '#fb923c' },
    { value: 'DATA_GAP', label: 'Data Gap', color: '#f59e0b' },
]

export const LOG_PERIODS = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7 jours' },
]

export const LOG_LEVELS = [
    { value: 'trace', label: 'Trace', color: '#6b7280' },
    { value: 'success', label: 'Success', color: '#22c55e' },
    { value: 'info', label: 'Info', color: '#10b981' },
    { value: 'warn', label: 'Warn', color: '#f59e0b' },
    { value: 'error', label: 'Error', color: '#ef4444' },
    { value: 'fatal', label: 'Fatal', color: '#a855f7' },
]

export const LOG_LIMITS = [50, 100, 200, 500]

export const LEVEL_CLASSES: Record<string, string> = {
    trace: 'text-gray-500',
    debug: 'text-blue-500',
    success: 'text-green-500 font-semibold',
    info: 'text-emerald-500',
    warn: 'text-amber-500',
    error: 'text-red-500',
    fatal: 'text-purple-500',
}

export const CATEGORY_CLASSES: Record<string, string> = {
    HARDWARE: 'text-indigo-500',
    ESP32: 'text-indigo-500',
    MQTT: 'text-orange-500',
    DB: 'text-cyan-500',
    API: 'text-pink-500',
    SYSTEM: 'text-slate-400',
    WEBSOCKET: 'text-orange-400',
    DATA_GAP: 'text-amber-500',
}

