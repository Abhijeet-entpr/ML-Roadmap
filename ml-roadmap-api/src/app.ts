import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { AppConfig } from './config.js'
import {
  diagnosticsRoutes,
  healthRoutes,
  onboardingRoutes,
  planRoutes,
  progressRoutes,
} from './routes/index.js'
import { IntelligenceClient } from './services/intelligenceClient.js'
import { InMemoryPlanRepository, InMemoryUserRepository, MemoryCache } from './storage/memory.js'
import type { CachePort, PlanRepository, UserRepository } from './storage/ports.js'

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig
    users: UserRepository
    plans: PlanRepository
    cache: CachePort
    intelligence: IntelligenceClient
  }
}

export async function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: true,
  })

  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ML Roadmap Product API',
        description: 'User, plan, progress, and onboarding orchestration',
        version: '0.1.0',
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  })

  app.decorate('config', config)
  app.decorate('users', new InMemoryUserRepository())
  app.decorate('plans', new InMemoryPlanRepository())
  app.decorate('cache', new MemoryCache())
  app.decorate('intelligence', new IntelligenceClient(config.intelligenceUrl))

  await app.register(healthRoutes)
  await app.register(onboardingRoutes)
  await app.register(planRoutes)
  await app.register(progressRoutes)
  await app.register(diagnosticsRoutes)

  return app
}
