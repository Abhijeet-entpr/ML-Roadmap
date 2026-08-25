import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { Flame, TrendingUp, CalendarClock, Briefcase } from 'lucide-react'
import { generateInsights, taskCompletionPercent, weekHours } from '@/lib/rules'
import { formatDate, formatMinutes, todayIsoDate } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { SkillKey, Track } from '@/types'
import { SKILL_LABELS } from '@/types'
import PageHeader from '@/components/layout/PageHeader'
import ProgressRing from '@/components/widgets/ProgressRing'
import ExitGateWidget from '@/components/widgets/ExitGateWidget'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Switch,
  Textarea,
} from '@/components/ui'

const TRACKS: Track[] = ['project', 'theory', 'practice', 'interview', 'mlops', 'system_design', 'career', 'reading']

export default function DashboardPage() {
  const { state, ready, derived, saveWeeklyReview } = useApp()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    completed: '',
    evidenceCreated: '',
    learned: '',
    failed: '',
    blocked: '',
    metricChanged: '',
    tookLonger: '',
    weakInterviewTopic: '',
    carryOver: '',
    workloadRealistic: true,
  })

  const currentWeek = state.meta.currentWeek
  const week = state.weeks.find((w) => w.number === currentWeek)
  const today = todayIsoDate()

  const weekTaskStats = useMemo(() => weekHours(state.tasks, currentWeek), [state.tasks, currentWeek])
  const insights = useMemo(() => generateInsights(state), [state])

  const todayPriorities = useMemo(() => {
    return state.tasks
      .filter(
        (t) =>
          !t.deferred &&
          t.weekNumber === currentWeek &&
          t.status !== 'completed' &&
          t.status !== 'skipped' &&
          (t.scheduledDate === today || !t.scheduledDate),
      )
      .sort((a, b) => a.order - b.order)
      .slice(0, 5)
  }, [state.tasks, currentWeek, today])

  const currentProject = useMemo(() => {
    const phase = state.phases.find((p) => p.number === (currentWeek <= 4 ? 1 : currentWeek <= 8 ? 2 : 3))
    return state.projects.find((p) => p.id === phase?.projectId)
  }, [state.phases, state.projects, currentWeek])

  const radarData = useMemo(() => {
    return (Object.keys(SKILL_LABELS) as SkillKey[]).map((skill) => ({
      skill: SKILL_LABELS[skill].slice(0, 12),
      score: state.skillAssessments.find((s) => s.skill === skill)?.score ?? 0,
      fullMark: 5,
    }))
  }, [state.skillAssessments])

  const trackProgress = useMemo(() => {
    const allocation = state.preferences?.trackAllocation
    return TRACKS.filter((t) => ['project', 'theory', 'practice', 'mlops', 'interview'].includes(t)).map((track) => {
      const tasks = state.tasks.filter((t) => t.weekNumber === currentWeek && t.track === track && !t.deferred)
      return {
        track,
        percent: taskCompletionPercent(tasks),
        alloc: allocation?.[track as keyof typeof allocation] ?? 0,
      }
    })
  }, [state.tasks, state.preferences, currentWeek])

  const upcomingDeadlines = useMemo(() => {
    return state.tasks
      .filter((t) => t.scheduledDate && t.status !== 'completed' && !t.deferred)
      .sort((a, b) => (a.scheduledDate! > b.scheduledDate! ? 1 : -1))
      .slice(0, 5)
  }, [state.tasks])

  const handleSaveReview = () => {
    const weekTasks = state.tasks.filter((t) => t.weekNumber === currentWeek && !t.deferred)
    saveWeeklyReview({
      weekNumber: currentWeek,
      ...reviewForm,
      markdownReport: `# Week ${currentWeek} Review\n\n${reviewForm.learned}`,
      completionPercent: taskCompletionPercent(weekTasks),
      plannedHours: weekTaskStats.planned,
      actualHours: weekTaskStats.actual,
      riskLevel: weekTaskStats.actual < weekTaskStats.planned * 0.5 ? 'high' : 'low',
    })
    setReviewOpen(false)
    setReviewForm({
      completed: '',
      evidenceCreated: '',
      learned: '',
      failed: '',
      blocked: '',
      metricChanged: '',
      tookLonger: '',
      weakInterviewTopic: '',
      carryOver: '',
      workloadRealistic: true,
    })
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground" role="status">Loading…</p>
      </div>
    )
  }

  if (!state.profile?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  const profileName = state.profile.currentRole

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title={`Welcome back${profileName ? `, ${profileName.split(' ')[0]}` : ''}`}
        description={`Week ${currentWeek} of 12 · ${state.preferences?.weeklyHours ?? 0}h/week commitment`}
        actions={
          <Button variant="outline" onClick={() => setReviewOpen(true)}>
            Run weekly review
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6 md:col-span-1">
          <ProgressRing
            value={derived.curriculumPercent}
            label="Curriculum progress"
            sublabel={`${derived.curriculumPercent}% of active tasks`}
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" aria-hidden />
              Weekly commitment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Planned</span>
              <span className="font-medium">{weekTaskStats.planned}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Logged</span>
              <span className="font-medium">{weekTaskStats.actual}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium">{weekTaskStats.remaining}h</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, weekTaskStats.planned ? (weekTaskStats.actual / weekTaskStats.planned) * 100 : 0)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-5 text-warning" aria-hidden />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold">{state.meta.streak}</p>
            <p className="text-sm text-muted-foreground">
              {state.meta.lastStudyDate ? `Last study: ${formatDate(state.meta.lastStudyDate)}` : 'Start a focus session today'}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s priorities</CardTitle>
            <CardDescription>Top {todayPriorities.length} tasks — <Link to="/today" className="text-primary hover:underline">Open Today</Link></CardDescription>
          </CardHeader>
          <CardContent>
            {todayPriorities.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up for today.</p>
            ) : (
              <ul className="space-y-2">
                {todayPriorities.map((t, i) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{formatMinutes(t.estimatedMinutes)} · {t.type}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {currentProject ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-5" aria-hidden />
                Current project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{currentProject.name}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{currentProject.problem}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Phase {currentProject.phaseNumber}</Badge>
                <span className="text-sm font-medium">{derived.projectScores[currentProject.id] ?? 0}% ready</span>
              </div>
              <p className="text-xs text-muted-foreground">Milestone: {currentProject.currentMilestone}</p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Skill radar</CardTitle>
            <CardDescription>Self-assessed baseline scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Track progress</CardTitle>
            <CardDescription>Week {currentWeek} by allocation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trackProgress.map(({ track, percent, alloc }) => (
              <div key={track}>
                <div className="mb-1 flex justify-between text-sm capitalize">
                  <span>{track}</span>
                  <span className="text-muted-foreground">{percent}% · {alloc}% alloc</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${percent}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {week ? (
          <div className="lg:col-span-2">
            <ExitGateWidget week={week} compact />
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5" aria-hidden />
              Upcoming deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scheduled deadlines.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcomingDeadlines.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2">
                    <span className="truncate">{t.title}</span>
                    <span className="shrink-0 text-muted-foreground">{formatDate(t.scheduledDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight) => (
                <li key={insight} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>Weekly review — Week {currentWeek}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(['completed', 'evidenceCreated', 'learned', 'failed', 'blocked'] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                <Textarea
                  value={reviewForm[field]}
                  onChange={(e) => setReviewForm({ ...reviewForm, [field]: e.target.value })}
                  rows={2}
                />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Label>Workload was realistic</Label>
              <Switch
                checked={reviewForm.workloadRealistic}
                onCheckedChange={(c) => setReviewForm({ ...reviewForm, workloadRealistic: c })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveReview}>Save review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
