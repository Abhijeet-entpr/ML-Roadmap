import { createId, nowIso } from '@/lib/utils'
import type { Difficulty, Status, Task, TaskType, Track, Week } from '@/types'
import type { ApiPlanWeek, ApiRecommendedPlan } from './client'

const TRACKS = new Set<Track>([
  'project',
  'theory',
  'practice',
  'interview',
  'mlops',
  'system_design',
  'career',
  'reading',
])

const TASK_TYPES = new Set<TaskType>(['build', 'learn', 'practice', 'review', 'career'])
const DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard'])

function asTrack(value: string): Track {
  return TRACKS.has(value as Track) ? (value as Track) : 'theory'
}

function asType(value: string): TaskType {
  return TASK_TYPES.has(value as TaskType) ? (value as TaskType) : 'learn'
}

function asDifficulty(value: string): Difficulty {
  return DIFFICULTIES.has(value as Difficulty) ? (value as Difficulty) : 'medium'
}

export function mapApiWeeks(plan: ApiRecommendedPlan): Week[] {
  const ts = nowIso()
  return plan.weeks.map((w: ApiPlanWeek) => ({
    id: createId(),
    number: w.number,
    title: w.title,
    phaseId: w.number <= 8 ? 'phase-1' : w.number <= 16 ? 'phase-2' : 'phase-3',
    objective: w.objective,
    plannedHours: w.plannedHours,
    theoryTopics: [],
    projectDeliverables: w.moduleIds,
    pytorchExercise: '',
    dsaTarget: '',
    sqlTarget: '',
    interviewTopics: [],
    systemDesignExercise: '',
    evidenceRequired: [],
    exitCriterion: `Complete week ${w.number} tasks`,
    commonMistakes: [],
    weekendCheckpoint: '',
    recommendedResources: [],
    status: 'not_started' as Status,
    createdAt: ts,
    updatedAt: ts,
  }))
}

export function mapApiTasks(plan: ApiRecommendedPlan): Task[] {
  const ts = nowIso()
  const tasks: Task[] = []
  for (const week of plan.weeks) {
    for (const t of week.tasks) {
      tasks.push({
        id: t.id || createId(),
        weekNumber: week.number,
        title: t.title,
        description: t.description,
        track: asTrack(t.track),
        type: asType(t.type),
        estimatedMinutes: t.estimatedMinutes,
        actualMinutes: 0,
        difficulty: asDifficulty(t.difficulty),
        status: 'not_started',
        prerequisites: [],
        completionCriteria: t.description,
        relatedResources: t.moduleId ? [t.moduleId] : [],
        interviewConcepts: [],
        notes: '',
        evidenceIds: [],
        order: t.order,
        createdAt: ts,
        updatedAt: ts,
      })
    }
  }
  return tasks
}
