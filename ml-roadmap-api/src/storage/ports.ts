import type { ProgressPatch, StoredPlan, StoredUser } from '../types.js'

export interface UserRepository {
  get(id: string): Promise<StoredUser | null>
  save(user: StoredUser): Promise<StoredUser>
}

export interface PlanRepository {
  getByUser(userId: string): Promise<StoredPlan | null>
  save(plan: StoredPlan): Promise<StoredPlan>
  updateProgress(userId: string, patch: ProgressPatch): Promise<StoredPlan | null>
}

export interface CachePort {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
}
