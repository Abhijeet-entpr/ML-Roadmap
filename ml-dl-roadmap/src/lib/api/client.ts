const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new ApiError(`API ${path} failed`, res.status, body)
  }
  return (await res.json()) as T
}

export interface ApiCalibratedSkill {
  skill: string
  proficiency: number
  confidence: number
  evidence: string[]
  lastUpdated: string
}

export interface ApiPlanTask {
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

export interface ApiPlanWeek {
  number: number
  title: string
  objective: string
  plannedHours: number
  moduleIds: string[]
  tasks: ApiPlanTask[]
}

export interface ApiRecommendedPlan {
  weeks: ApiPlanWeek[]
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

export interface OnboardingCompleteResponse {
  userId: string
  profile: Record<string, unknown>
  preferences: Record<string, unknown>
  skills: ApiCalibratedSkill[]
  gaps: Array<{ skill: string; current: number; target: number; gap: number; priority: number }>
  plan: ApiRecommendedPlan
  needsReprobe: string[]
}

export interface DiagnosticBanksResponse {
  clusters: Array<{
    id: string
    title: string
    skills: string[]
    questions: Array<{
      id: string
      skill: string
      prompt: string
      options: Array<{ id: string; label: string; score: number }>
    }>
  }>
}

export function getApiBaseUrl() {
  return API_BASE
}

export async function fetchHealth(): Promise<{ status: string; intelligence?: string }> {
  return request('/health')
}

export async function fetchDiagnosticBanks(): Promise<DiagnosticBanksResponse> {
  return request('/diagnostics/banks')
}

export async function completeOnboardingRemote(payload: {
  userId?: string
  profile: Record<string, unknown>
  preferences: Record<string, unknown>
  skills?: Array<{ skill: string; score: number }>
  diagnosticAnswers?: Array<{ questionId: string; selectedOptionId: string }>
}): Promise<OnboardingCompleteResponse> {
  return request('/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchUserPlan(userId: string) {
  return request(`/users/${userId}/plan`)
}
