import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { adaptScheduleForHours } from '@/lib/rules'
import { todayIsoDate } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { AvailabilityTier, SkillKey } from '@/types'
import { SKILL_LABELS } from '@/types'
import PageHeader from '@/components/layout/PageHeader'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@/components/ui'

const SKILL_KEYS = Object.keys(SKILL_LABELS) as SkillKey[]

const AVAILABILITY_OPTIONS: { tier: AvailabilityTier; hours: number; label: string }[] = [
  { tier: 'minimum', hours: 6, label: '6 hours / week (minimum)' },
  { tier: 'standard', hours: 13, label: '12–15 hours / week (standard)' },
  { tier: 'intensive', hours: 19, label: '18–20 hours / week (intensive)' },
  { tier: 'custom', hours: 15, label: 'Custom schedule' },
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { state, ready, completeOnboarding } = useApp()
  const [step, setStep] = useState(0)

  const [profile, setProfile] = useState({
    currentRole: 'Software Engineer',
    yearsExperience: 3,
    targetRoles: ['ML Engineer', 'Applied Scientist'],
    existingMlExperience: 'Hybrid CV + NLP/LLM projects',
    preferredSpecialization: 'Hybrid CV + NLP/LLM',
    primaryCloud: 'Azure',
    modelFramework: 'PyTorch',
    experimentTracking: 'MLflow',
    cicd: 'GitHub Actions',
    serving: 'FastAPI',
    targetMarket: 'Remote-first tech companies',
    startDate: todayIsoDate(),
  })

  const [availabilityTier, setAvailabilityTier] = useState<AvailabilityTier>('standard')
  const [weeklyHours, setWeeklyHours] = useState(13)
  const [customHours, setCustomHours] = useState(15)

  const [skills, setSkills] = useState<Record<SkillKey, number>>(
    () => Object.fromEntries(SKILL_KEYS.map((k) => [k, 2])) as Record<SkillKey, number>,
  )

  const [preferences, setPreferences] = useState({
    weekdayAvailability: ['Mon', 'Wed', 'Thu', 'Sat'] as string[],
    weekendAvailability: true,
    preferredSessionLength: 50,
    reminderPreference: 'daily' as const,
    deepWorkDays: ['Sat'] as string[],
    projectBalance: 45,
    theoryBalance: 25,
    interviewBalance: 15,
    theme: 'system' as 'light' | 'dark' | 'system',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    trackAllocation: { project: 45, theory: 25, practice: 15, mlops: 10, interview: 5 },
  })

  const effectiveHours = availabilityTier === 'custom' ? customHours : weeklyHours

  const previewDeferred = useMemo(() => {
    if (effectiveHours > 6) return []
    return adaptScheduleForHours(state.tasks, effectiveHours).deferredItems
  }, [effectiveHours, state.tasks])

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground" role="status">
          Loading…
        </p>
      </div>
    )
  }

  if (state.profile?.onboardingComplete) {
    return <Navigate to="/today" replace />
  }

  const steps = ['Career profile', 'Availability', 'Self-assessment', 'Preferences', 'Your plan']

  const selectAvailability = (tier: AvailabilityTier, hours: number) => {
    setAvailabilityTier(tier)
    setWeeklyHours(hours)
  }

  const toggleWeekday = (day: string) => {
    setPreferences((p) => ({
      ...p,
      weekdayAvailability: p.weekdayAvailability.includes(day)
        ? p.weekdayAvailability.filter((d) => d !== day)
        : [...p.weekdayAvailability, day],
    }))
  }

  const handleFinish = () => {
    completeOnboarding(
      profile,
      {
        weeklyHours: effectiveHours,
        availabilityTier,
        weekdayAvailability: preferences.weekdayAvailability,
        weekendAvailability: preferences.weekendAvailability,
        preferredSessionLength: preferences.preferredSessionLength,
        reminderPreference: preferences.reminderPreference,
        deepWorkDays: preferences.deepWorkDays,
        projectBalance: preferences.projectBalance,
        theoryBalance: preferences.theoryBalance,
        interviewBalance: preferences.interviewBalance,
        theme: preferences.theme,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        reminderCategories: { tasks: true, evidence: true, interviews: true },
        trackAllocation: preferences.trackAllocation,
      },
      SKILL_KEYS.map((skill) => ({ skill, score: skills[skill] })),
    )
    navigate('/today')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Set up your launchpad"
        description="Five quick steps to personalize your 12-week ML engineering plan."
      />

      <nav aria-label="Onboarding progress" className="mb-8">
        <ol className="flex flex-wrap gap-2">
          {steps.map((label, i) => (
            <li
              key={label}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === step
                  ? 'bg-primary text-primary-foreground'
                  : i < step
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Career profile</CardTitle>
                <CardDescription>Defaults reflect a mid-level engineer pivoting into production ML.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="currentRole">Current role</Label>
                  <Input
                    id="currentRole"
                    value={profile.currentRole}
                    onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min={0}
                    max={30}
                    value={profile.yearsExperience}
                    onChange={(e) => setProfile({ ...profile, yearsExperience: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={profile.startDate}
                    onChange={(e) => setProfile({ ...profile, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={profile.preferredSpecialization}
                    onChange={(e) => setProfile({ ...profile, preferredSpecialization: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloud">Primary cloud</Label>
                  <Input
                    id="cloud"
                    value={profile.primaryCloud}
                    onChange={(e) => setProfile({ ...profile, primaryCloud: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="framework">Model framework</Label>
                  <Input
                    id="framework"
                    value={profile.modelFramework}
                    onChange={(e) => setProfile({ ...profile, modelFramework: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mlflow">Experiment tracking</Label>
                  <Input
                    id="mlflow"
                    value={profile.experimentTracking}
                    onChange={(e) => setProfile({ ...profile, experimentTracking: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cicd">CI/CD</Label>
                  <Input
                    id="cicd"
                    value={profile.cicd}
                    onChange={(e) => setProfile({ ...profile, cicd: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serving">Serving</Label>
                  <Input
                    id="serving"
                    value={profile.serving}
                    onChange={(e) => setProfile({ ...profile, serving: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mlExp">Existing ML experience</Label>
                  <Textarea
                    id="mlExp"
                    value={profile.existingMlExperience}
                    onChange={(e) => setProfile({ ...profile, existingMlExperience: e.target.value })}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly availability</CardTitle>
                <CardDescription>Your plan adapts to the hours you can commit each week.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.tier}
                      type="button"
                      onClick={() => selectAvailability(opt.tier, opt.hours)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        availabilityTier === opt.tier
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                      {opt.tier === 'minimum' ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Project 1 scope reduced; capstone hardening deferred.
                        </p>
                      ) : null}
                    </button>
                  ))}
                </div>
                {availabilityTier === 'custom' ? (
                  <div className="space-y-2">
                    <Label htmlFor="customHours">Custom hours per week</Label>
                    <Input
                      id="customHours"
                      type="number"
                      min={4}
                      max={40}
                      value={customHours}
                      onChange={(e) => setCustomHours(Number(e.target.value))}
                    />
                  </div>
                ) : null}
                <div>
                  <Label className="mb-2 block">Typical study days</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={preferences.weekdayAvailability.includes(day) ? 'default' : 'outline'}
                        onClick={() => toggleWeekday(day)}
                        aria-pressed={preferences.weekdayAvailability.includes(day)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Baseline self-assessment</CardTitle>
                <CardDescription>Rate each skill 0 (none) to 5 (interview-ready with evidence).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {SKILL_KEYS.map((skill) => (
                  <div key={skill} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <Label htmlFor={`skill-${skill}`}>{SKILL_LABELS[skill]}</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id={`skill-${skill}`}
                        type="range"
                        min={0}
                        max={5}
                        step={1}
                        value={skills[skill]}
                        onChange={(e) => setSkills({ ...skills, [skill]: Number(e.target.value) })}
                        className="w-full accent-primary sm:w-40"
                        aria-valuetext={`${skills[skill]} out of 5`}
                      />
                      <span className="w-6 text-center font-mono text-sm">{skills[skill]}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Learning preferences</CardTitle>
                <CardDescription>Fine-tune session length, theme, and track allocation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Preferred session (minutes)</Label>
                    <Select
                      value={String(preferences.preferredSessionLength)}
                      onValueChange={(v) => setPreferences({ ...preferences, preferredSessionLength: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 (Pomodoro)</SelectItem>
                        <SelectItem value="50">50 (deep work)</SelectItem>
                        <SelectItem value="90">90 (build block)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={preferences.theme}
                      onValueChange={(v) =>
                        setPreferences({ ...preferences, theme: v as 'light' | 'dark' | 'system' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekend">Include weekend study</Label>
                  <Switch
                    id="weekend"
                    checked={preferences.weekendAvailability}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, weekendAvailability: checked })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Track allocation (%)</Label>
                  {(['project', 'theory', 'practice', 'mlops', 'interview'] as const).map((track) => (
                    <div key={track} className="flex items-center gap-3">
                      <span className="w-24 capitalize text-sm">{track}</span>
                      <input
                        type="range"
                        min={0}
                        max={60}
                        value={preferences.trackAllocation[track]}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            trackAllocation: {
                              ...preferences.trackAllocation,
                              [track]: Number(e.target.value),
                            },
                          })
                        }
                        className="flex-1 accent-primary"
                      />
                      <span className="w-8 text-right text-sm">{preferences.trackAllocation[track]}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" aria-hidden />
                  Your personalized plan
                </CardTitle>
                <CardDescription>
                  {effectiveHours} hours/week · {profile.preferredSpecialization} · {profile.primaryCloud}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/50 p-4 text-sm">
                  <p className="font-medium">12-week curriculum</p>
                  <p className="mt-1 text-muted-foreground">
                    Three production ML projects with weekly exit gates, DSA/SQL targets, and interview prep.
                  </p>
                </div>
                {previewDeferred.length > 0 ? (
                  <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <p className="text-sm font-medium">Deferred for {effectiveHours}h/week plan</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {previewDeferred.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Full curriculum — no items deferred at this pace.</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Average skill baseline:{' '}
                  {(SKILL_KEYS.reduce((s, k) => s + skills[k], 0) / SKILL_KEYS.length).toFixed(1)}/5
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)}>
            Continue
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button type="button" onClick={handleFinish}>
            Launch workspace
          </Button>
        )}
      </div>
    </div>
  )
}
