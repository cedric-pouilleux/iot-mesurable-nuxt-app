export interface LogEntry {
    id: string
    category: string
    source: string
    direction: string | null
    level: string
    msg: string
    time: string
    details: Record<string, unknown> | null
}

export interface LogFilters {
    categories: string[]
    source: '' | 'SYSTEM' | 'USER'
    direction: '' | 'IN' | 'OUT'
    levels: string[]
    search: string
    limit: string
}

export interface LogsResponse {
    logs: LogEntry[]
    total: number
    limit: number
    offset: number
}

export interface TimeRange {
    start: string
    end: string
}
