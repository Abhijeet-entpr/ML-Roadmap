import type {
  CalibratedSkill,
  DiagnoseResponse,
  OnboardingCompleteRequest,
  RecommendResponse,
  SkillScoreInput,
} from '../types.js'

const SKILLS = [
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

const ROLE_TARGETS: Record<string, Record<string, number>> = {
  'ML Engineer': {
    python: 5,
    dsa: 3,
    sql: 4,
    mathematics: 4,
    classical_ml: 4,
    deep_learning: 5,
    pytorch: 5,
    specialization: 4,
    mlops: 4,
    deployment: 4,
    testing: 4,
    ml_system_design: 4,
    communication: 3,
    project_depth: 4,
  },
}

const MODULES: Array<{
  id: string
  title: string
  skill: string
  hours: number
  skipAt: number
}> = [
  { id: 'mod-python', title: 'Python for ML', skill: 'python', hours: 8, skipAt: 4 },
  { id: 'mod-sql', title: 'SQL for analytics', skill: 'sql', hours: 6, skipAt: 4 },
  { id: 'mod-math', title: 'Math for ML', skill: 'mathematics', hours: 8, skipAt: 4 },
  { id: 'mod-cml', title: 'Classical ML', skill: 'classical_ml', hours: 10, skipAt: 4 },
  { id: 'mod-dl', title: 'Deep learning foundations', skill: 'deep_learning', hours: 12, skipAt: 4 },
  { id: 'mod-pt', title: 'PyTorch labs', skill: 'pytorch', hours: 12, skipAt: 4 },
  { id: 'mod-spec', title: 'Specialization project', skill: 'specialization', hours: 14, skipAt: 4 },
  { id: 'mod-test', title: 'ML testing', skill: 'testing', hours: 6, skipAt: 4 },
  { id: 'mod-mlops', title: 'MLOps foundations', skill: 'mlops', hours: 10, skipAt: 4 },
  { id: 'mod-deploy', title: 'Model deployment', skill: 'deployment', hours: 10, skipAt: 4 },
  { id: 'mod-sd', title: 'ML system design', skill: 'ml_system_design', hours: 8, skipAt: 4 },
  { id: 'mod-depth', title: 'Portfolio depth sprint', skill: 'project_depth', hours: 10, skipAt: 4 },
]

function now() {
  return new Date().toISOString()
}

export function localDiagnose(payload: {
  skills?: SkillScoreInput[]
  profile: OnboardingCompleteRequest['profile']
}): DiagnoseResponse {
  const map = new Map((payload.skills ?? []).map((s) => [s.skill, s.score]))
  const skills: CalibratedSkill[] = SKILLS.map((skill) => ({
    skill,
    proficiency: Math.max(0, Math.min(5, map.get(skill) ?? 2)),
    confidence: map.has(skill) ? 0.45 : 0.3,
    evidence: map.has(skill) ? ['self_report_slider'] : ['default'],
    lastUpdated: now(),
  }))
  return {
    skills,
    needsReprobe: skills.filter((s) => s.confidence < 0.4).map((s) => String(s.skill)),
  }
}

export function localRecommend(payload: {
  profile: OnboardingCompleteRequest['profile']
  preferences: OnboardingCompleteRequest['preferences']
  skills: CalibratedSkill[]
}): RecommendResponse {
  const targets = ROLE_TARGETS['ML Engineer']
  const skillMap = new Map(payload.skills.map((s) => [String(s.skill), s.proficiency]))
  const gaps = Object.entries(targets)
    .map(([skill, target]) => {
      const current = skillMap.get(skill) ?? 0
      const gap = Math.max(0, target - current)
      return { skill, current, target, gap, priority: gap * target }
    })
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.priority - a.priority)

  const rationale: string[] = [
    'Using API local fallback recommender (intelligence service unavailable).',
    `Weekly capacity ${payload.preferences.weeklyHours}h.`,
  ]

  const selected = MODULES.filter((m) => {
    const level = skillMap.get(m.skill) ?? 0
    if (level >= m.skipAt) {
      rationale.push(`Skipped ${m.title} (proficiency ${level} ≥ ${m.skipAt}).`)
      return false
    }
    return gaps.some((g) => g.skill === m.skill) || level < 3
  })

  const weekly = Math.max(4, payload.preferences.weeklyHours)
  let totalHours = selected.reduce((s, m) => s + m.hours, 0) * 1.15
  let weeksCount = Math.round(totalHours / weekly)
  weeksCount = Math.max(6, Math.min(24, weeksCount || 6))

  const deferredTopics: string[] = []
  while (selected.length && (selected.reduce((s, m) => s + m.hours, 0) * 1.15) / weekly > 24) {
    const dropped = selected.pop()!
    deferredTopics.push(dropped.title)
    rationale.push(`Deferred ${dropped.title} to stay within 24 weeks.`)
  }

  totalHours = selected.reduce((s, m) => s + m.hours, 0)
  weeksCount = Math.max(6, Math.min(24, Math.round((totalHours * 1.15) / weekly) || 6))

  const weeks = []
  let idx = 0
  for (let w = 1; w <= weeksCount; w++) {
    const slice = selected.slice(idx, idx + 1)
    idx += 1
    const mods = slice.length ? slice : [{ id: `rev-${w}`, title: 'Revision & practice', skill: 'practice', hours: weekly, skipAt: 99 }]
    if (!slice.length) rationale.push(`Added revision week ${w} for minimum duration.`)
    weeks.push({
      number: w,
      title: `Week ${w}: ${mods[0].title}`,
      objective: mods.map((m) => m.title).join('; '),
      plannedHours: Math.min(weekly, mods.reduce((s, m) => s + m.hours, 0) || weekly),
      moduleIds: mods.map((m) => m.id),
      tasks: mods.map((m, i) => ({
        id: `task-${w}-${i}`,
        title: m.title,
        description: m.title,
        track: 'practice',
        type: 'learn',
        estimatedMinutes: Math.round((m.hours || weekly) * 60),
        difficulty: 'medium',
        moduleId: m.id,
        order: w * 10 + i,
      })),
    })
  }

  const completion = new Date()
  completion.setDate(completion.getDate() + weeksCount * 7)

  return {
    skills: payload.skills,
    gaps,
    plan: {
      weeks,
      totalWeeks: weeksCount,
      estimatedHours: Math.round(weeks.reduce((s, w) => s + w.plannedHours, 0) * 10) / 10,
      projects: [
        {
          id: 'proj-fallback',
          title: 'Adaptive portfolio project',
          complexity: 'medium',
          specialization: payload.profile.preferredSpecialization,
        },
      ],
      deferredTopics,
      revisionWeeks: weeks.filter((w) => w.moduleIds.some((id) => id.startsWith('rev-'))).map((w) => w.number),
      rationale,
      checkpoints: [`Week 1`, `Week ${Math.ceil(weeksCount / 2)}`, `Week ${weeksCount}`],
      adaptationMetadata: { fallback: true, minWeeks: 6, maxWeeks: 24 },
      estimatedCompletionDate: completion.toISOString().slice(0, 10),
    },
  }
}
