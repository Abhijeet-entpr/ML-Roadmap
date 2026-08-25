import type {
  AppState,
  EvidenceItem,
  JobApplication,
  Preferences,
  ProjectCapabilityStatus,
  SkillAssessment,
  SkillKey,
  Status,
  Task,
  Week,
} from '@/types'
import { percent } from '@/lib/utils'

export const MONTH1_TARGETS: Record<SkillKey, number> = {
  python: 4,
  dsa: 3,
  sql: 3,
  mathematics: 3,
  classical_ml: 3,
  deep_learning: 3,
  pytorch: 3,
  specialization: 2,
  mlops: 2,
  deployment: 3,
  testing: 4,
  ml_system_design: 2,
  communication: 3,
  project_depth: 3,
}

export const MONTH2_TARGETS: Record<SkillKey, number> = {
  python: 4,
  dsa: 3,
  sql: 3,
  mathematics: 3,
  classical_ml: 4,
  deep_learning: 4,
  pytorch: 4,
  specialization: 3,
  mlops: 4,
  deployment: 4,
  testing: 4,
  ml_system_design: 3,
  communication: 3,
  project_depth: 4,
}

export const MONTH3_TARGETS: Record<SkillKey, number> = {
  python: 4,
  dsa: 4,
  sql: 4,
  mathematics: 3,
  classical_ml: 4,
  deep_learning: 4,
  pytorch: 4,
  specialization: 4,
  mlops: 4,
  deployment: 4,
  testing: 4,
  ml_system_design: 4,
  communication: 4,
  project_depth: 4,
}

export const APPLICATION_MINIMUM: Record<SkillKey, number> = {
  python: 4,
  dsa: 3,
  sql: 3,
  mathematics: 3,
  classical_ml: 3,
  deep_learning: 3,
  pytorch: 3,
  specialization: 3,
  mlops: 3,
  deployment: 3,
  testing: 4,
  ml_system_design: 3,
  communication: 3,
  project_depth: 3,
}

export function taskCompletionPercent(tasks: Task[]): number {
  const active = tasks.filter((t) => !t.deferred && t.status !== 'skipped')
  if (!active.length) return 0
  const done = active.filter((t) => t.status === 'completed').length
  return percent(done, active.length)
}

export function weekHours(tasks: Task[], weekNumber: number) {
  const weekTasks = tasks.filter((t) => t.weekNumber === weekNumber && !t.deferred)
  const planned = weekTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60
  const actual = weekTasks.reduce((sum, t) => sum + t.actualMinutes, 0) / 60
  return {
    planned: Math.round(planned * 10) / 10,
    actual: Math.round(actual * 10) / 10,
    remaining: Math.max(0, Math.round((planned - actual) * 10) / 10),
  }
}

export function overallHours(tasks: Task[]) {
  const planned = tasks.filter((t) => !t.deferred).reduce((s, t) => s + t.estimatedMinutes, 0) / 60
  const actual = tasks.reduce((s, t) => s + t.actualMinutes, 0) / 60
  return {
    planned: Math.round(planned * 10) / 10,
    actual: Math.round(actual * 10) / 10,
  }
}

export function evaluateExitGate(week: Week, tasks: Task[], evidence: EvidenceItem[]) {
  const weekTasks = tasks.filter((t) => t.weekNumber === week.number && !t.deferred)
  const requiredEvidence = week.evidenceRequired
  const completedEvidence = requiredEvidence.filter((req) =>
    evidence.some(
      (e) =>
        e.weekNumber === week.number &&
        (e.title.toLowerCase().includes(req.toLowerCase().slice(0, 12)) ||
          e.description.toLowerCase().includes(req.toLowerCase().slice(0, 12)) ||
          e.type.replace(/_/g, ' ').includes(req.toLowerCase().slice(0, 8))),
    ),
  )
  const missingEvidence = requiredEvidence.filter((r) => !completedEvidence.includes(r))
  const taskDone = weekTasks.length
    ? weekTasks.every((t) => t.status === 'completed' || t.status === 'skipped')
    : false
  const evidenceDone = missingEvidence.length === 0
  const exitStatus: Status =
    taskDone && evidenceDone
      ? 'completed'
      : weekTasks.some((t) => t.status === 'in_progress' || t.status === 'blocked')
        ? weekTasks.some((t) => t.status === 'blocked')
          ? 'blocked'
          : 'in_progress'
        : completedEvidence.length > 0
          ? 'in_progress'
          : 'not_started'

  return {
    requiredEvidence,
    completedEvidence,
    missingEvidence,
    exitStatus,
    taskCompletion: taskCompletionPercent(weekTasks),
  }
}

export function canRaiseSkillScore(
  current: number,
  next: number,
  evidenceIds: string[],
  allEvidence: EvidenceItem[],
  skill: SkillKey,
): { ok: boolean; reason?: string } {
  if (next < 0 || next > 5) return { ok: false, reason: 'Score must be between 0 and 5.' }
  if (next <= current) return { ok: true }
  if (next >= 4) {
    const linked = evidenceIds
      .map((id) => allEvidence.find((e) => e.id === id))
      .filter(Boolean) as EvidenceItem[]
    const skillEvidence = linked.filter((e) => e.skillsDemonstrated.includes(skill))
    if (skillEvidence.length === 0) {
      return {
        ok: false,
        reason: 'Scores of 4 or 5 require linked evidence that demonstrates this skill.',
      }
    }
  }
  return { ok: true }
}

export function projectReadiness(
  statuses: ProjectCapabilityStatus[],
  projectId: string,
): {
  percent: number
  missingMandatory: ProjectCapabilityStatus[]
  blockers: ProjectCapabilityStatus[]
} {
  const items = statuses.filter((s) => s.projectId === projectId && s.requirement !== 'na')
  const required = items.filter((s) => s.requirement === 'required')
  const done = required.filter((s) => s.status === 'completed')
  const missingMandatory = required.filter((s) => s.status !== 'completed')
  const blockers = missingMandatory.filter(
    (s) =>
      ['docker', 'api_contract', 'ci', 'cloud_deployment', 'rollback', 'logging'].some((k) =>
        s.capabilityId.includes(k),
      ) || s.status === 'blocked',
  )
  return {
    percent: percent(done.length, required.length || 1),
    missingMandatory,
    blockers,
  }
}

export function applicationWeeklyTarget(weekNumber: number): {
  applications: number
  referrals: number
  networking: number
  guidance: string
} {
  if (weekNumber <= 4) {
    return {
      applications: 0,
      referrals: 0,
      networking: 0,
      guidance: 'Establish resume and GitHub. Avoid mass applications.',
    }
  }
  if (weekNumber <= 6) {
    return {
      applications: 0,
      referrals: 0,
      networking: 5,
      guidance: 'Five networking conversations per week.',
    }
  }
  if (weekNumber <= 8) {
    return {
      applications: 5,
      referrals: 0,
      networking: 3,
      guidance: 'Five selective applications per week.',
    }
  }
  if (weekNumber <= 10) {
    return {
      applications: 10,
      referrals: 5,
      networking: 3,
      guidance: 'Ten applications and five referral requests per week.',
    }
  }
  return {
    applications: 15,
    referrals: 5,
    networking: 2,
    guidance: 'Fifteen targeted applications and five referrals per week.',
  }
}

export function recommendApplications(
  currentWeek: number,
  skills: SkillAssessment[],
): { recommend: boolean; reason: string } {
  if (currentWeek < 5) {
    return { recommend: false, reason: 'Focus on building evidence before applying.' }
  }
  if (currentWeek < 9) {
    const criticalBelow = skills.filter((s) =>
      (['python', 'pytorch', 'testing', 'project_depth'] as SkillKey[]).includes(s.skill)
        ? s.score < 2
        : false,
    )
    if (criticalBelow.length) {
      return {
        recommend: false,
        reason: 'Raise foundational skills before selective applications.',
      }
    }
    return { recommend: true, reason: 'Selective networking and applications are appropriate.' }
  }
  const criticalLow = skills.filter((s) => APPLICATION_MINIMUM[s.skill] >= 3 && s.score < 3)
  if (criticalLow.length) {
    return {
      recommend: false,
      reason: `Critical skills below 3: ${criticalLow.map((s) => s.skill).join(', ')}.`,
    }
  }
  return { recommend: true, reason: 'No critical category is below 3. Selective applications recommended.' }
}

export function adaptScheduleForHours(
  tasks: Task[],
  weeklyHours: number,
): { tasks: Task[]; deferredItems: string[] } {
  if (weeklyHours > 6) {
    return { tasks, deferredItems: [] }
  }

  const deferredItems: string[] = [
    'Project 1 (Visual Defect Classification) marked optional / reduced-scope due to 6-hour weekly plan.',
    'Capstone hardening moved to a post-12-week extension period.',
    'Some Week 1–4 stretch goals deferred to preserve Project 2 and Project 3 depth.',
  ]

  const adapted = tasks.map((task) => {
    const isProject1 = task.projectId === 'project-visual-defect' || task.weekNumber <= 4
    const isCapstoneHardening =
      task.title.toLowerCase().includes('hardening') ||
      task.title.toLowerCase().includes('stretch') ||
      (task.weekNumber === 11 && task.track === 'mlops' && task.difficulty === 'hard')

    if (isProject1 && task.track === 'project' && task.difficulty === 'hard') {
      return {
        ...task,
        deferred: true,
        deferredReason: 'Deferred for 6-hour plan: prioritize Projects 2 and 3.',
        status: 'skipped' as Status,
      }
    }
    if (isProject1 && task.type === 'build' && task.order > 3) {
      return {
        ...task,
        deferred: true,
        deferredReason: 'Reduced Project 1 scope for 6-hour weekly availability.',
        status: 'skipped' as Status,
      }
    }
    if (isCapstoneHardening) {
      return {
        ...task,
        deferred: true,
        deferredReason: 'Capstone hardening moved to extension period.',
        status: 'skipped' as Status,
      }
    }
    return task
  })

  return { tasks: adapted, deferredItems }
}

export function burnoutRisk(weeklyActualHours: number[]): {
  level: 'low' | 'moderate' | 'high'
  message?: string
} {
  const recent = weeklyActualHours.slice(-3)
  const over28 = recent.filter((h) => h > 28).length
  if (over28 >= 2) {
    return {
      level: 'high',
      message:
        'You logged more than 28 hours for multiple consecutive weeks. Prefer sustainable 18–24 hour weeks.',
    }
  }
  const overPlanBurst = recent.filter((h) => h > 24).length
  if (overPlanBurst >= 1) {
    return {
      level: 'moderate',
      message: 'Consider reducing next week’s workload to stay consistent.',
    }
  }
  return { level: 'low' }
}

export function allocationWarning(prefs: Preferences | null): string | null {
  if (!prefs) return null
  const { trackAllocation } = prefs
  if (trackAllocation.project < 40) {
    return 'Critical track underfunded: project engineering is below 40%. Portfolio evidence may suffer.'
  }
  if (trackAllocation.interview < 5 && prefs.weeklyHours >= 12) {
    return 'Interview preparation is underfunded relative to a standard plan.'
  }
  return null
}

export function computeStreak(lastStudyDate?: string, previousStreak = 0): number {
  if (!lastStudyDate) return 0
  const last = new Date(lastStudyDate)
  const today = new Date()
  const todayDate = new Date(today.toISOString().slice(0, 10))
  const lastDate = new Date(last.toISOString().slice(0, 10))
  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000)
  if (diffDays === 0) return Math.max(previousStreak, 1)
  if (diffDays === 1) return previousStreak + 1
  return 0
}

export function generateInsights(state: AppState): string[] {
  const insights: string[] = []
  const { tasks, evidence, practiceAttempts, questions, projectCapabilities, skillAssessments, meta } =
    state

  const currentWeek = meta.currentWeek
  const hours = weekHours(tasks, currentWeek)
  if (hours.planned > 0 && hours.actual > hours.planned * 1.4) {
    insights.push(
      `You exceeded the weekly plan by ${Math.round(((hours.actual - hours.planned) / hours.planned) * 100)}%. Consider reducing the next workload.`,
    )
  }

  const sqlQuestions = questions.filter((q) => q.track === 'sql')
  const sqlAttempts = practiceAttempts.filter((a) =>
    sqlQuestions.some((q) => q.id === a.questionId),
  )
  const sqlTarget = 6
  if (sqlAttempts.length < sqlTarget * 0.7) {
    insights.push(
      `SQL practice is ${Math.round((1 - sqlAttempts.length / sqlTarget) * 100)}% below a typical weekly target.`,
    )
  }

  const projectTasks = tasks.filter((t) => t.track === 'project' && t.weekNumber === currentWeek)
  const projectDone = taskCompletionPercent(projectTasks)
  if (projectDone >= 70) {
    insights.push('Project work is on track this week.')
  }

  const pytorchSkill = skillAssessments.find((s) => s.skill === 'pytorch')
  const pytorchExercises = practiceAttempts.filter((a) =>
    questions.some((q) => q.id === a.questionId && q.track === 'pytorch'),
  )
  if (pytorchSkill && pytorchSkill.score >= 3 && pytorchExercises.length <= 1) {
    insights.push(
      'Your PyTorch confidence improved, but only one independent coding exercise has evidence.',
    )
  }

  const p2 = projectReadiness(projectCapabilities, 'project-ticket-intel')
  if (p2.missingMandatory.some((m) => m.capabilityId.includes('load') || m.notes.toLowerCase().includes('latency'))) {
    insights.push('Project 2 cannot pass the exit gate because latency evidence is missing.')
  } else if (p2.percent < 50 && currentWeek >= 8) {
    insights.push('Project 2 production readiness is behind schedule for Month 2 gate.')
  }

  const unverifiedClaims = evidence.filter((e) => e.verificationStatus === 'unverified').length
  if (unverifiedClaims > 5) {
    insights.push(`${unverifiedClaims} evidence items still need verification before resume use.`)
  }

  if (!insights.length) {
    insights.push('Keep logging sessions and attaching evidence to strengthen readiness signals.')
  }

  return insights.slice(0, 6)
}

export function applicationFunnel(apps: JobApplication[]) {
  const stages = [
    'saved',
    'researching',
    'networking',
    'referral_requested',
    'applied',
    'recruiter_screen',
    'technical_screen',
    'system_design',
    'hiring_manager',
    'final_round',
    'offer',
    'rejected',
    'withdrawn',
  ] as const
  return stages.map((status) => ({
    status,
    count: apps.filter((a) => a.status === status).length,
  }))
}
