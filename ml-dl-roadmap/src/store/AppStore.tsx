import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createInitialState } from '@/data/seed'
import {
  adaptScheduleForHours,
  canRaiseSkillScore,
  computeStreak,
  projectReadiness,
  taskCompletionPercent,
} from '@/lib/rules'
import { createRepository } from '@/lib/storage/repository'
import { createId, nowIso, todayIsoDate } from '@/lib/utils'
import type {
  AppState,
  EvidenceItem,
  JobApplication,
  MockInterview,
  PracticeAttempt,
  Preferences,
  SkillAssessment,
  SkillKey,
  Status,
  StudySession,
  SystemDesignResponse,
  Task,
  UserProfile,
  WeeklyReview,
} from '@/types'

interface AppContextValue {
  state: AppState
  ready: boolean
  completeOnboarding: (
    profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'onboardingComplete'>,
    preferences: Omit<Preferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    skills: Array<{ skill: SkillKey; score: number }>,
  ) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  completeTask: (id: string, actualMinutes?: number) => void
  addEvidence: (item: Omit<EvidenceItem, 'id' | 'createdAt' | 'updatedAt'>) => string
  attachEvidenceToTask: (taskId: string, evidenceId: string) => void
  startFocusSession: (plannedDuration: 25 | 50 | 90, taskId?: string) => string
  pauseFocusSession: (id: string) => void
  resumeFocusSession: (id: string) => void
  completeFocusSession: (id: string, notes?: string) => void
  addPracticeAttempt: (attempt: Omit<PracticeAttempt, 'id' | 'createdAt' | 'updatedAt'>) => void
  upsertMockInterview: (mock: MockInterview) => void
  saveSystemDesignResponse: (response: SystemDesignResponse) => void
  updateReading: (id: string, patch: Record<string, unknown>) => void
  updateSkill: (skill: SkillKey, score: number, evidenceIds: string[], notes?: string) => { ok: boolean; reason?: string }
  upsertApplication: (app: JobApplication) => void
  updateProjectCapability: (
    id: string,
    patch: { status?: Status; notes?: string; evidenceIds?: string[]; reviewerFeedback?: string },
  ) => void
  updateModule: (id: string, patch: { completed?: boolean; confidence?: number; notes?: string }) => void
  saveWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'createdAt' | 'updatedAt'>) => void
  saveReflection: (reflection: {
    completedWork: string
    hoursLogged: number
    evidenceCreated: string
    blockers: string
    reflection: string
    tomorrowFirstTask: string
  }) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setCurrentWeek: (week: number) => void
  updatePreferences: (patch: Partial<Preferences>) => void
  updateProfile: (patch: Partial<UserProfile>) => void
  updateProjectDefense: (projectId: string, patch: Partial<{ thirtySecond: Record<string, string>; twoMinute: Record<string, string>; fiveMinute: Record<string, string> }>) => void
  markNotificationRead: (id: string) => void
  snoozeNotification: (id: string, until: string) => void
  addNotification: (title: string, body: string, category: string, href?: string) => void
  resetSampleData: () => Promise<void>
  exportData: () => string
  importData: (raw: string) => void
  derived: {
    curriculumPercent: number
    projectScores: Record<string, number>
  }
}

const AppContext = createContext<AppContextValue | null>(null)
const repo = createRepository()

function withTimestamps<T extends { updatedAt?: string }>(item: T): T {
  return { ...item, updatedAt: nowIso() }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createInitialState())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void (async () => {
      const loaded = await repo.load()
      if (loaded) setState(loaded)
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    if (!ready) return
    void repo.save(state)
  }, [state, ready])

  useEffect(() => {
    const theme = state.preferences?.theme ?? 'system'
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = theme === 'dark' || (theme === 'system' && prefersDark)
    root.classList.toggle('dark', dark)
  }, [state.preferences?.theme])

  const setStateAndPersist = useCallback((updater: (prev: AppState) => AppState) => {
    setState(updater)
  }, [])

  const completeOnboarding: AppContextValue['completeOnboarding'] = useCallback(
    (profileInput, preferencesInput, skills) => {
      setStateAndPersist((prev) => {
        const profile: UserProfile = {
          ...profileInput,
          id: createId(),
          onboardingComplete: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        const preferences: Preferences = {
          ...preferencesInput,
          id: createId(),
          userId: profile.id,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        const skillAssessments: SkillAssessment[] = skills.map((s) => ({
          skill: s.skill,
          score: s.score,
          evidenceIds: [],
          notes: '',
          updatedAt: nowIso(),
        }))
        const adapted = adaptScheduleForHours(prev.tasks, preferences.weeklyHours)
        const projects = prev.projects.map((p) =>
          preferences.weeklyHours <= 6 && p.id === 'project-visual-defect'
            ? { ...p, optional: true, updatedAt: nowIso() }
            : p,
        )
        return {
          ...prev,
          profile,
          preferences,
          skillAssessments,
          tasks: adapted.tasks,
          projects,
          meta: {
            ...prev.meta,
            planGeneratedAt: nowIso(),
            deferredItems: adapted.deferredItems,
            currentWeek: 1,
          },
          notifications: [
            {
              id: createId(),
              category: 'plan',
              title: 'Your 12-week plan is ready',
              body:
                adapted.deferredItems.length > 0
                  ? adapted.deferredItems.join(' ')
                  : 'Capability gates preserved. Start with Today.',
              read: false,
              href: '/today',
              createdAt: nowIso(),
              updatedAt: nowIso(),
            },
            ...prev.notifications,
          ],
        }
      })
    },
    [setStateAndPersist],
  )

  const updateTask: AppContextValue['updateTask'] = useCallback((id, patch) => {
    setStateAndPersist((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? withTimestamps({ ...t, ...patch }) : t)),
    }))
  }, [setStateAndPersist])

  const completeTask: AppContextValue['completeTask'] = useCallback((id, actualMinutes) => {
    setStateAndPersist((prev) => {
      const tasks = prev.tasks.map((t) =>
        t.id === id
          ? withTimestamps({
              ...t,
              status: 'completed' as Status,
              actualMinutes: actualMinutes ?? (t.actualMinutes || t.estimatedMinutes),
              completedAt: nowIso(),
            })
          : t,
      )
      const streak = computeStreak(todayIsoDate(), prev.meta.streak || 0)
      return {
        ...prev,
        tasks,
        meta: {
          ...prev.meta,
          streak: prev.meta.lastStudyDate === todayIsoDate() ? prev.meta.streak : streak,
          lastStudyDate: todayIsoDate(),
        },
      }
    })
  }, [setStateAndPersist])

  const addEvidence: AppContextValue['addEvidence'] = useCallback((item) => {
    const id = createId()
    setStateAndPersist((prev) => ({
      ...prev,
      evidence: [
        {
          ...item,
          id,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ...prev.evidence,
      ],
    }))
    return id
  }, [setStateAndPersist])

  const attachEvidenceToTask: AppContextValue['attachEvidenceToTask'] = useCallback((taskId, evidenceId) => {
    setStateAndPersist((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId && !t.evidenceIds.includes(evidenceId)
          ? withTimestamps({ ...t, evidenceIds: [...t.evidenceIds, evidenceId] })
          : t,
      ),
      evidence: prev.evidence.map((e) =>
        e.id === evidenceId && !e.taskIds.includes(taskId)
          ? withTimestamps({ ...e, taskIds: [...e.taskIds, taskId] })
          : e,
      ),
    }))
  }, [setStateAndPersist])

  const startFocusSession: AppContextValue['startFocusSession'] = useCallback((plannedDuration, taskId) => {
    const id = createId()
    const session: StudySession = {
      id,
      taskId,
      durationMinutes: 0,
      plannedDuration,
      notes: '',
      startedAt: nowIso(),
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    setStateAndPersist((prev) => ({
      ...prev,
      studySessions: [session, ...prev.studySessions],
    }))
    return id
  }, [setStateAndPersist])

  const pauseFocusSession: AppContextValue['pauseFocusSession'] = useCallback((id) => {
    setStateAndPersist((prev) => ({
      ...prev,
      studySessions: prev.studySessions.map((s) =>
        s.id === id ? withTimestamps({ ...s, status: 'paused' as const }) : s,
      ),
    }))
  }, [setStateAndPersist])

  const resumeFocusSession: AppContextValue['resumeFocusSession'] = useCallback((id) => {
    setStateAndPersist((prev) => ({
      ...prev,
      studySessions: prev.studySessions.map((s) =>
        s.id === id ? withTimestamps({ ...s, status: 'active' as const }) : s,
      ),
    }))
  }, [setStateAndPersist])

  const completeFocusSession: AppContextValue['completeFocusSession'] = useCallback((id, notes) => {
    setStateAndPersist((prev) => {
      const session = prev.studySessions.find((s) => s.id === id)
      if (!session) return prev
      const elapsed = Math.max(
        1,
        Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000),
      )
      const studySessions = prev.studySessions.map((s) =>
        s.id === id
          ? withTimestamps({
              ...s,
              status: 'completed' as const,
              endedAt: nowIso(),
              durationMinutes: elapsed,
              notes: notes ?? s.notes,
            })
          : s,
      )
      const tasks = session.taskId
        ? prev.tasks.map((t) =>
            t.id === session.taskId
              ? withTimestamps({
                  ...t,
                  actualMinutes: t.actualMinutes + elapsed,
                  status: t.status === 'not_started' || t.status === 'planned' ? 'in_progress' : t.status,
                })
              : t,
          )
        : prev.tasks
      return {
        ...prev,
        studySessions,
        tasks,
        meta: {
          ...prev.meta,
          lastStudyDate: todayIsoDate(),
          streak:
            prev.meta.lastStudyDate === todayIsoDate()
              ? Math.max(prev.meta.streak, 1)
              : computeStreak(todayIsoDate(), prev.meta.streak),
        },
      }
    })
  }, [setStateAndPersist])

  const addPracticeAttempt: AppContextValue['addPracticeAttempt'] = useCallback((attempt) => {
    setStateAndPersist((prev) => ({
      ...prev,
      practiceAttempts: [
        { ...attempt, id: createId(), createdAt: nowIso(), updatedAt: nowIso() },
        ...prev.practiceAttempts,
      ],
    }))
  }, [setStateAndPersist])

  const upsertMockInterview: AppContextValue['upsertMockInterview'] = useCallback((mock) => {
    setStateAndPersist((prev) => {
      const exists = prev.mockInterviews.some((m) => m.id === mock.id)
      return {
        ...prev,
        mockInterviews: exists
          ? prev.mockInterviews.map((m) => (m.id === mock.id ? withTimestamps(mock) : m))
          : [withTimestamps({ ...mock, createdAt: mock.createdAt || nowIso() }), ...prev.mockInterviews],
      }
    })
  }, [setStateAndPersist])

  const saveSystemDesignResponse: AppContextValue['saveSystemDesignResponse'] = useCallback((response) => {
    setStateAndPersist((prev) => {
      const exists = prev.systemDesignResponses.some((r) => r.id === response.id)
      return {
        ...prev,
        systemDesignResponses: exists
          ? prev.systemDesignResponses.map((r) =>
              r.id === response.id ? withTimestamps({ ...response, version: r.version + 1 }) : r,
            )
          : [{ ...response, version: 1, createdAt: nowIso(), updatedAt: nowIso() }, ...prev.systemDesignResponses],
      }
    })
  }, [setStateAndPersist])

  const updateReading: AppContextValue['updateReading'] = useCallback((id, patch) => {
    setStateAndPersist((prev) => ({
      ...prev,
      readingAssignments: prev.readingAssignments.map((r) =>
        r.id === id ? withTimestamps({ ...r, ...patch }) : r,
      ),
    }))
  }, [setStateAndPersist])

  const updateSkill: AppContextValue['updateSkill'] = useCallback((skill, score, evidenceIds, notes) => {
    let result: { ok: boolean; reason?: string } = { ok: true }
    setStateAndPersist((prev) => {
      const current = prev.skillAssessments.find((s) => s.skill === skill)
      const currentScore = current?.score ?? 0
      result = canRaiseSkillScore(currentScore, score, evidenceIds, prev.evidence, skill)
      if (!result.ok) return prev
      const next: SkillAssessment = {
        skill,
        score,
        evidenceIds,
        notes: notes ?? current?.notes ?? '',
        updatedAt: nowIso(),
      }
      const skillAssessments = current
        ? prev.skillAssessments.map((s) => (s.skill === skill ? next : s))
        : [...prev.skillAssessments, next]
      return { ...prev, skillAssessments }
    })
    return result
  }, [setStateAndPersist])

  const upsertApplication: AppContextValue['upsertApplication'] = useCallback((app) => {
    setStateAndPersist((prev) => {
      const exists = prev.applications.some((a) => a.id === app.id)
      return {
        ...prev,
        applications: exists
          ? prev.applications.map((a) => (a.id === app.id ? withTimestamps(app) : a))
          : [{ ...app, createdAt: nowIso(), updatedAt: nowIso() }, ...prev.applications],
      }
    })
  }, [setStateAndPersist])

  const updateProjectCapability: AppContextValue['updateProjectCapability'] = useCallback((id, patch) => {
    setStateAndPersist((prev) => {
      const projectCapabilities = prev.projectCapabilities.map((c) =>
        c.id === id
          ? withTimestamps({
              ...c,
              ...patch,
              completedAt: patch.status === 'completed' ? nowIso() : c.completedAt,
            })
          : c,
      )
      const projects = prev.projects.map((p) => {
        const score = projectReadiness(projectCapabilities, p.id).percent
        return { ...p, completionScore: score, updatedAt: nowIso() }
      })
      return { ...prev, projectCapabilities, projects }
    })
  }, [setStateAndPersist])

  const updateModule: AppContextValue['updateModule'] = useCallback((id, patch) => {
    setStateAndPersist((prev) => ({
      ...prev,
      learningModules: prev.learningModules.map((m) =>
        m.id === id ? withTimestamps({ ...m, ...patch }) : m,
      ),
    }))
  }, [setStateAndPersist])

  const saveWeeklyReview: AppContextValue['saveWeeklyReview'] = useCallback((review) => {
    setStateAndPersist((prev) => ({
      ...prev,
      weeklyReviews: [
        { ...review, id: createId(), createdAt: nowIso(), updatedAt: nowIso() },
        ...prev.weeklyReviews,
      ],
    }))
  }, [setStateAndPersist])

  const saveReflection: AppContextValue['saveReflection'] = useCallback((reflection) => {
    setStateAndPersist((prev) => ({
      ...prev,
      reflections: [
        {
          id: createId(),
          date: todayIsoDate(),
          ...reflection,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ...prev.reflections,
      ],
    }))
  }, [setStateAndPersist])

  const setTheme: AppContextValue['setTheme'] = useCallback((theme) => {
    setStateAndPersist((prev) => ({
      ...prev,
      preferences: prev.preferences
        ? withTimestamps({ ...prev.preferences, theme })
        : prev.preferences,
    }))
  }, [setStateAndPersist])

  const setCurrentWeek: AppContextValue['setCurrentWeek'] = useCallback((week) => {
    setStateAndPersist((prev) => ({
      ...prev,
      meta: { ...prev.meta, currentWeek: week },
    }))
  }, [setStateAndPersist])

  const updatePreferences: AppContextValue['updatePreferences'] = useCallback((patch) => {
    setStateAndPersist((prev) => ({
      ...prev,
      preferences: prev.preferences ? withTimestamps({ ...prev.preferences, ...patch }) : prev.preferences,
    }))
  }, [setStateAndPersist])

  const updateProfile: AppContextValue['updateProfile'] = useCallback((patch) => {
    setStateAndPersist((prev) => ({
      ...prev,
      profile: prev.profile ? withTimestamps({ ...prev.profile, ...patch }) : prev.profile,
    }))
  }, [setStateAndPersist])

  const updateProjectDefense: AppContextValue['updateProjectDefense'] = useCallback((projectId, patch) => {
    setStateAndPersist((prev) => ({
      ...prev,
      projectDefenses: prev.projectDefenses.map((d) =>
        d.projectId === projectId
          ? withTimestamps({
              ...d,
              thirtySecond: patch.thirtySecond ?? d.thirtySecond,
              twoMinute: patch.twoMinute ?? d.twoMinute,
              fiveMinute: patch.fiveMinute ?? d.fiveMinute,
            })
          : d,
      ),
    }))
  }, [setStateAndPersist])

  const markNotificationRead: AppContextValue['markNotificationRead'] = useCallback((id) => {
    setStateAndPersist((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? withTimestamps({ ...n, read: true }) : n,
      ),
    }))
  }, [setStateAndPersist])

  const snoozeNotification: AppContextValue['snoozeNotification'] = useCallback((id, until) => {
    setStateAndPersist((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? withTimestamps({ ...n, snoozedUntil: until }) : n,
      ),
    }))
  }, [setStateAndPersist])

  const addNotification: AppContextValue['addNotification'] = useCallback((title, body, category, href) => {
    setStateAndPersist((prev) => ({
      ...prev,
      notifications: [
        {
          id: createId(),
          title,
          body,
          category,
          href,
          read: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ...prev.notifications,
      ],
    }))
  }, [setStateAndPersist])

  const resetSampleData = useCallback(async () => {
    await repo.clear()
    setState(createInitialState())
  }, [])

  const exportData = useCallback(() => repo.exportJson(state), [state])

  const importData = useCallback((raw: string) => {
    const imported = repo.importJson(raw)
    setState(imported)
  }, [])

  const derived = useMemo(
    () => ({
      curriculumPercent: taskCompletionPercent(state.tasks),
      projectScores: Object.fromEntries(
        state.projects.map((p) => [p.id, projectReadiness(state.projectCapabilities, p.id).percent]),
      ),
    }),
    [state.tasks, state.projects, state.projectCapabilities],
  )

  const value: AppContextValue = {
    state,
    ready,
    completeOnboarding,
    updateTask,
    completeTask,
    addEvidence,
    attachEvidenceToTask,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    completeFocusSession,
    addPracticeAttempt,
    upsertMockInterview,
    saveSystemDesignResponse,
    updateReading,
    updateSkill,
    upsertApplication,
    updateProjectCapability,
    updateModule,
    saveWeeklyReview,
    saveReflection,
    setTheme,
    setCurrentWeek,
    updatePreferences,
    updateProfile,
    updateProjectDefense,
    markNotificationRead,
    snoozeNotification,
    addNotification,
    resetSampleData,
    exportData,
    importData,
    derived,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
