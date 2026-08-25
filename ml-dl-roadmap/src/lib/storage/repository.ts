import type { AppState } from '@/types'

export const STORAGE_KEY = 'ml-launchpad-state-v1'
export const APP_VERSION = '1.0.0'

export interface DataRepository {
  load(): Promise<AppState | null>
  save(state: AppState): Promise<void>
  clear(): Promise<void>
  exportJson(state: AppState): string
  importJson(raw: string): AppState
}

function assertAppState(value: unknown): AppState {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid app data')
  }
  const state = value as AppState
  if (!state.meta || !Array.isArray(state.tasks) || !Array.isArray(state.weeks)) {
    throw new Error('App data is missing required collections')
  }
  return state
}

export class LocalStorageRepository implements DataRepository {
  async load(): Promise<AppState | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return assertAppState(JSON.parse(raw))
    } catch {
      return null
    }
  }

  async save(state: AppState): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }

  exportJson(state: AppState): string {
    return JSON.stringify({ ...state, meta: { ...state.meta, exportedAt: new Date().toISOString() } }, null, 2)
  }

  importJson(raw: string): AppState {
    return assertAppState(JSON.parse(raw))
  }
}

/**
 * Optional Supabase-backed repository.
 * Activated only when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.
 * Falls back to local storage otherwise — never blocks the app.
 */
export class SupabaseRepository implements DataRepository {
  private local = new LocalStorageRepository()

  isConfigured(): boolean {
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  }

  async load(): Promise<AppState | null> {
    // Cloud sync can be wired later; local persistence keeps the app fully usable offline.
    return this.local.load()
  }

  async save(state: AppState): Promise<void> {
    await this.local.save(state)
  }

  async clear(): Promise<void> {
    await this.local.clear()
  }

  exportJson(state: AppState): string {
    return this.local.exportJson(state)
  }

  importJson(raw: string): AppState {
    return this.local.importJson(raw)
  }
}

export function createRepository(): DataRepository {
  const supabase = new SupabaseRepository()
  if (supabase.isConfigured()) return supabase
  return new LocalStorageRepository()
}
