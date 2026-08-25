import type {
  CalibratedSkill,
  DiagnoseResponse,
  DiagnosticAnswer,
  OnboardingCompleteRequest,
  RecommendResponse,
  SkillScoreInput,
} from '../types.js'
import { localDiagnose, localRecommend } from './localIntelligenceFallback.js'

export class IntelligenceClient {
  constructor(private readonly baseUrl: string) {}

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`)
      return res.ok
    } catch {
      return false
    }
  }

  async diagnose(payload: {
    answers?: DiagnosticAnswer[]
    skills?: SkillScoreInput[]
    profile: OnboardingCompleteRequest['profile']
    preferences: OnboardingCompleteRequest['preferences']
  }): Promise<DiagnoseResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/diagnose`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Intelligence diagnose failed (${res.status}): ${text}`)
      }
      return (await res.json()) as DiagnoseResponse
    } catch {
      return localDiagnose(payload)
    }
  }

  async recommend(payload: {
    profile: OnboardingCompleteRequest['profile']
    preferences: OnboardingCompleteRequest['preferences']
    skills: CalibratedSkill[]
  }): Promise<RecommendResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/plans/recommend`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Intelligence recommend failed (${res.status}): ${text}`)
      }
      return (await res.json()) as RecommendResponse
    } catch {
      return localRecommend(payload)
    }
  }

  async adapt(payload: {
    userId: string
    skills: CalibratedSkill[]
    preferences: OnboardingCompleteRequest['preferences']
    profile: OnboardingCompleteRequest['profile']
    completedModuleIds: string[]
  }): Promise<RecommendResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/plans/adapt`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Intelligence adapt failed (${res.status}): ${text}`)
      }
      return (await res.json()) as RecommendResponse
    } catch {
      return localRecommend({
        profile: payload.profile,
        preferences: payload.preferences,
        skills: payload.skills,
      })
    }
  }
}
