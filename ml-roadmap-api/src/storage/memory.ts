import type { ProgressPatch, StoredPlan, StoredUser } from '../types.js'
import type { CachePort, PlanRepository, UserRepository } from './ports.js'

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, StoredUser>()

  async get(id: string): Promise<StoredUser | null> {
    return this.users.get(id) ?? null
  }

  async save(user: StoredUser): Promise<StoredUser> {
    this.users.set(user.id, user)
    return user
  }
}

export class InMemoryPlanRepository implements PlanRepository {
  private readonly plans = new Map<string, StoredPlan>()

  async getByUser(userId: string): Promise<StoredPlan | null> {
    return this.plans.get(userId) ?? null
  }

  async save(plan: StoredPlan): Promise<StoredPlan> {
    this.plans.set(plan.userId, plan)
    return plan
  }

  async updateProgress(userId: string, patch: ProgressPatch): Promise<StoredPlan | null> {
    const existing = this.plans.get(userId)
    if (!existing) return null

    const next: StoredPlan = {
      ...existing,
      updatedAt: new Date().toISOString(),
      plan: {
        ...existing.plan,
        adaptationMetadata: {
          ...existing.plan.adaptationMetadata,
          lastProgressPatch: patch,
          lastProgressAt: new Date().toISOString(),
        },
      },
    }

    if (patch.taskId && patch.status) {
      next.plan = {
        ...next.plan,
        weeks: next.plan.weeks.map((week) => ({
          ...week,
          tasks: week.tasks.map((task) =>
            task.id === patch.taskId
              ? {
                  ...task,
                  // status lives in product layer; stamp via metadata for MVP
                }
              : task,
          ),
        })),
      }
    }

    this.plans.set(userId, next)
    return next
  }
}

export class MemoryCache implements CachePort {
  private readonly store = new Map<string, { value: unknown; expiresAt?: number }>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }
}
