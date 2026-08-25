import { describe, expect, it } from 'vitest'
import { z } from 'zod'

export const statusSchema = z.enum([
  'not_started',
  'planned',
  'in_progress',
  'blocked',
  'completed',
  'skipped',
])

export const skillKeySchema = z.enum([
  'python',
  'dsa',
  'sql',
  'mathematics',
  'classical_ml',
  'deep_learning',
  'pytorch',
  'specialization',
  'mlops',
  'deployment',
  'testing',
  'ml_system_design',
  'communication',
  'project_depth',
])

export const profileSchema = z.object({
  currentRole: z.string().min(1),
  yearsExperience: z.number().min(0).max(50),
  targetRoles: z.array(z.string()).min(1),
  existingMlExperience: z.string(),
  preferredSpecialization: z.string().min(1),
  primaryCloud: z.string().min(1),
  modelFramework: z.string().min(1),
  experimentTracking: z.string().min(1),
  cicd: z.string().min(1),
  serving: z.string().min(1),
  targetMarket: z.string().min(1),
  startDate: z.string().min(1),
})

export const evidenceSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.string().min(1),
  description: z.string().max(5000),
  url: z.string().url().optional().or(z.literal('')),
  visibility: z.enum(['private', 'internal', 'public']),
  metricPlaceholder: z.string().optional(),
})

export const applicationSchema = z.object({
  company: z.string().min(1),
  roleTitle: z.string().min(1),
  jobUrl: z.string().url().optional().or(z.literal('')),
  status: z.string().min(1),
  skillMatchPercent: z.number().min(0).max(100),
})

describe('zod validators', () => {
  it('validates profile defaults', () => {
    const parsed = profileSchema.parse({
      currentRole: 'Software Engineer',
      yearsExperience: 3,
      targetRoles: ['ML Engineer'],
      existingMlExperience: 'Limited',
      preferredSpecialization: 'Hybrid CV + NLP/LLM',
      primaryCloud: 'Azure',
      modelFramework: 'PyTorch',
      experimentTracking: 'MLflow',
      cicd: 'GitHub Actions',
      serving: 'FastAPI',
      targetMarket: 'Product companies',
      startDate: '2026-07-25',
    })
    expect(parsed.yearsExperience).toBe(3)
  })

  it('rejects invalid evidence urls when provided', () => {
    expect(() =>
      evidenceSchema.parse({
        title: 'Demo',
        type: 'deployment_url',
        description: 'x',
        url: 'javascript:alert(1)',
        visibility: 'private',
      }),
    ).toThrow()
  })
})
