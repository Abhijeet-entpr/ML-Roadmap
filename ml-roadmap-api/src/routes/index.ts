import type { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'node:crypto'
import type { OnboardingCompleteRequest, ProgressPatch } from '../types.js'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    const intelligenceOk = await app.intelligence.health()
    return {
      status: 'ok',
      service: 'ml-roadmap-api',
      intelligence: intelligenceOk ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    }
  })
}

export const onboardingRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: OnboardingCompleteRequest }>('/onboarding/complete', async (request, reply) => {
    const body = request.body
    if (!body?.profile || !body?.preferences) {
      return reply.code(400).send({ error: 'profile and preferences are required' })
    }

    const userId = body.userId ?? randomUUID()
    const now = new Date().toISOString()

    const cacheKey = `onboarding:${userId}:${body.preferences.weeklyHours}:${body.profile.preferredSpecialization}`
    const cached = await app.cache.get<{
      userId: string
      skills: unknown
      plan: unknown
      gaps: unknown
    }>(cacheKey)
    if (cached) {
      return reply.send(cached)
    }

    const diagnosed = await app.intelligence.diagnose({
      answers: body.diagnosticAnswers,
      skills: body.skills,
      profile: body.profile,
      preferences: body.preferences,
    })

    const recommended = await app.intelligence.recommend({
      profile: body.profile,
      preferences: body.preferences,
      skills: diagnosed.skills,
    })

    const user = await app.users.save({
      id: userId,
      profile: { ...body.profile, onboardingComplete: true },
      preferences: body.preferences,
      skills: recommended.skills,
      createdAt: now,
      updatedAt: now,
    })

    const plan = await app.plans.save({
      id: randomUUID(),
      userId,
      plan: recommended.plan,
      createdAt: now,
      updatedAt: now,
    })

    const response = {
      userId: user.id,
      profile: user.profile,
      preferences: user.preferences,
      skills: recommended.skills,
      gaps: recommended.gaps,
      plan: plan.plan,
      needsReprobe: diagnosed.needsReprobe,
    }

    await app.cache.set(cacheKey, response, 300)
    return reply.code(201).send(response)
  })
}

export const planRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { userId: string } }>('/users/:userId/plan', async (request, reply) => {
    const plan = await app.plans.getByUser(request.params.userId)
    if (!plan) return reply.code(404).send({ error: 'Plan not found' })
    return plan
  })

  app.get<{ Params: { userId: string } }>('/users/:userId', async (request, reply) => {
    const user = await app.users.get(request.params.userId)
    if (!user) return reply.code(404).send({ error: 'User not found' })
    return user
  })
}

export const progressRoutes: FastifyPluginAsync = async (app) => {
  app.patch<{ Params: { userId: string }; Body: ProgressPatch }>(
    '/users/:userId/progress',
    async (request, reply) => {
      const updated = await app.plans.updateProgress(request.params.userId, request.body ?? {})
      if (!updated) return reply.code(404).send({ error: 'Plan not found' })
      return updated
    },
  )
}

export const diagnosticsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/diagnostics/banks', async (_request, reply) => {
    try {
      const res = await fetch(`${app.config.intelligenceUrl}/v1/diagnostics/banks`)
      if (!res.ok) {
        return reply.send({
          clusters: [],
          note: 'Intelligence unavailable — use skill sliders until banks load.',
        })
      }
      return res.json()
    } catch {
      return reply.send({
        clusters: [],
        note: 'Intelligence unavailable — use skill sliders until banks load.',
      })
    }
  })
}
