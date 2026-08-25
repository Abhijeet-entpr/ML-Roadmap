import { afterEach, describe, expect, it } from 'vitest'
import {
  adaptScheduleForHours,
  applicationWeeklyTarget,
  burnoutRisk,
  canRaiseSkillScore,
  evaluateExitGate,
  recommendApplications,
  taskCompletionPercent,
  weekHours,
} from '@/lib/rules'
import { createInitialState, createTasks, createWeeks } from '@/data/seed'
import type { EvidenceItem, SkillAssessment, Task, Week } from '@/types'
import { createId, nowIso } from '@/lib/utils'
import { LocalStorageRepository } from '@/lib/storage/repository'

describe('progress calculations', () => {
  it('computes task completion percent', () => {
    const tasks = [
      { status: 'completed', deferred: false },
      { status: 'planned', deferred: false },
      { status: 'skipped', deferred: false },
      { status: 'completed', deferred: true },
    ] as Task[]
    expect(taskCompletionPercent(tasks)).toBe(50)
  })

  it('computes week hours', () => {
    const tasks = [
      {
        weekNumber: 1,
        deferred: false,
        estimatedMinutes: 120,
        actualMinutes: 60,
      },
      {
        weekNumber: 1,
        deferred: false,
        estimatedMinutes: 60,
        actualMinutes: 30,
      },
    ] as Task[]
    expect(weekHours(tasks, 1)).toEqual({ planned: 3, actual: 1.5, remaining: 1.5 })
  })
})

describe('exit gate evaluation', () => {
  it('marks missing evidence', () => {
    const week = {
      number: 1,
      evidenceRequired: ['Tagged release v0.1-baseline', 'Metric report'],
    } as Week
    const tasks = [{ weekNumber: 1, deferred: false, status: 'completed' }] as Task[]
    const evidence = [
      {
        weekNumber: 1,
        title: 'Tagged release v0.1-baseline',
        description: 'release',
        type: 'tagged_release',
      },
    ] as EvidenceItem[]
    const gate = evaluateExitGate(week, tasks, evidence)
    expect(gate.completedEvidence).toContain('Tagged release v0.1-baseline')
    expect(gate.missingEvidence).toContain('Metric report')
  })
})

describe('readiness score rules', () => {
  it('blocks raising to 4 without evidence', () => {
    const result = canRaiseSkillScore(3, 4, [], [], 'pytorch')
    expect(result.ok).toBe(false)
  })

  it('allows raising to 4 with skill evidence', () => {
    const evidence = [
      {
        id: 'e1',
        skillsDemonstrated: ['pytorch'],
      },
    ] as EvidenceItem[]
    const result = canRaiseSkillScore(3, 4, ['e1'], evidence, 'pytorch')
    expect(result.ok).toBe(true)
  })
})

describe('application targets', () => {
  it('returns zero applications in weeks 1-4', () => {
    expect(applicationWeeklyTarget(3).applications).toBe(0)
  })

  it('recommends applications after month 2 when skills ok', () => {
    const skills = (
      [
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
      ] as const
    ).map((skill) => ({ skill, score: 3, evidenceIds: [], notes: '', updatedAt: nowIso() })) as SkillAssessment[]
    expect(recommendApplications(9, skills).recommend).toBe(true)
  })
})

describe('six-hour schedule adaptation', () => {
  it('defers project 1 hard tasks and records deferred items', () => {
    const tasks = createTasks()
    const { tasks: adapted, deferredItems } = adaptScheduleForHours(tasks, 6)
    expect(deferredItems.length).toBeGreaterThan(0)
    expect(adapted.some((t) => t.deferred)).toBe(true)
    expect(adaptScheduleForHours(tasks, 15).deferredItems).toEqual([])
  })
})

describe('burnout risk', () => {
  it('flags high risk after multiple >28h weeks', () => {
    expect(burnoutRisk([30, 32, 20]).level).toBe('high')
    expect(burnoutRisk([12, 14, 16]).level).toBe('low')
  })
})

describe('seed curriculum', () => {
  it('seeds 12 weeks and reading plan', () => {
    const state = createInitialState()
    expect(createWeeks()).toHaveLength(12)
    expect(state.readingAssignments).toHaveLength(16)
    expect(state.projects).toHaveLength(3)
    expect(state.systemDesignExercises).toHaveLength(12)
    expect(state.questions.length).toBeGreaterThanOrEqual(15)
  })
})

describe('local persistence', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('round-trips export/import json', async () => {
    const repo = new LocalStorageRepository()
    const state = createInitialState()
    await repo.save(state)
    const loaded = await repo.load()
    expect(loaded?.meta.version).toBe(state.meta.version)
    const exported = repo.exportJson(state)
    const imported = repo.importJson(exported)
    expect(imported.weeks).toHaveLength(12)
  })

  it('creates unique ids', () => {
    expect(createId()).not.toEqual(createId())
  })
})
