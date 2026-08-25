export type SkillKey =
  | 'python'
  | 'dsa'
  | 'sql'
  | 'mathematics'
  | 'classical_ml'
  | 'deep_learning'
  | 'pytorch'
  | 'specialization'
  | 'mlops'
  | 'deployment'
  | 'testing'
  | 'ml_system_design'
  | 'communication'
  | 'project_depth'

export interface UserProfileInput {
  currentRole: string
  yearsExperience: number
  targetRoles: string[]
  existingMlExperience: string
  preferredSpecialization: string
  primaryCloud: string
  modelFramework: string
  experimentTracking: string
  cicd: string
  serving: string
  targetMarket: string
  startDate: string
}

export interface PreferencesInput {
  weeklyHours: number
  availabilityTier: string
  weekdayAvailability: string[]
  weekendAvailability: boolean
  preferredSessionLength: number
  reminderPreference: string
  deepWorkDays: string[]
  projectBalance: number
  theoryBalance: number
  interviewBalance: number
  theme: string
  quietHoursStart: string
  quietHoursEnd: string
  reminderCategories: Record<string, boolean>
  trackAllocation: Record<string, number>
}

export interface SkillScoreInput {
  skill: SkillKey
  score: number
}

export interface DiagnosticAnswer {
  questionId: string
  selectedOptionId: string
}

export interface OnboardingCompleteRequest {
  userId?: string
  profile: UserProfileInput
  preferences: PreferencesInput
  /** Legacy slider scores — used when diagnosticAnswers omitted */
  skills?: SkillScoreInput[]
  diagnosticAnswers?: DiagnosticAnswer[]
}

export interface CalibratedSkill {
  skill: SkillKey | string
  proficiency: number
  confidence: number
  evidence: string[]
  lastUpdated: string
}

export interface PlanWeek {
  number: number
  title: string
  objective: string
  plannedHours: number
  moduleIds: string[]
  tasks: PlanTask[]
}

export interface PlanTask {
  id: string
  title: string
  description: string
  track: string
  type: string
  estimatedMinutes: number
  difficulty: string
  moduleId?: string
  order: number
}

export interface RecommendedPlan {
  weeks: PlanWeek[]
  totalWeeks: number
  estimatedHours: number
  projects: Array<{ id: string; title: string; complexity: string; specialization: string }>
  deferredTopics: string[]
  revisionWeeks: number[]
  rationale: string[]
  checkpoints: string[]
  adaptationMetadata: Record<string, unknown>
  estimatedCompletionDate: string
}

export interface DiagnoseResponse {
  skills: CalibratedSkill[]
  needsReprobe: string[]
}

export interface RecommendResponse {
  skills: CalibratedSkill[]
  gaps: Array<{ skill: string; current: number; target: number; gap: number; priority: number }>
  plan: RecommendedPlan
}

export interface StoredUser {
  id: string
  profile: UserProfileInput & { onboardingComplete: boolean }
  preferences: PreferencesInput
  skills: CalibratedSkill[]
  createdAt: string
  updatedAt: string
}

export interface StoredPlan {
  id: string
  userId: string
  plan: RecommendedPlan
  createdAt: string
  updatedAt: string
}

export interface ProgressPatch {
  weekNumber?: number
  taskId?: string
  status?: string
  actualMinutes?: number
  completedModuleIds?: string[]
}
