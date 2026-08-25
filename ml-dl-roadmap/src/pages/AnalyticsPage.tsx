import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  AlertTriangle,
  Download,
  Flame,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  applicationFunnel,
  burnoutRisk,
  generateInsights,
  taskCompletionPercent,
  weekHours,
} from '@/lib/rules'
import { downloadText, nowIso } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { SkillKey, Track } from '@/types'
import { APPLICATION_STATUS_LABELS, SKILL_LABELS } from '@/types'
import PageHeader from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@/components/ui'

const TRACKS: Track[] = ['project', 'theory', 'practice', 'interview', 'mlops', 'system_design', 'career', 'reading']
const SKILL_KEYS = Object.keys(SKILL_LABELS) as SkillKey[]

export default function AnalyticsPage() {
  const { state, ready, saveWeeklyReview } = useApp()
  const [filterWeek, setFilterWeek] = useState<number | 'all'>(state.meta.currentWeek)
  const [filterProject, setFilterProject] = useState<string>('all')
  const [gateChecks, setGateChecks] = useState<Record<string, boolean>>({})
  const [gateNotes, setGateNotes] = useState('')
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
  const [savedReport, setSavedReport] = useState<string | null>(null)

  const currentWeek = state.meta.currentWeek

  const filteredTasks = useMemo(() => {
    let tasks = state.tasks.filter((t) => !t.deferred)
    if (filterWeek !== 'all') {
      tasks = tasks.filter((t) => t.weekNumber === filterWeek)
    }
    if (filterProject !== 'all') {
      tasks = tasks.filter((t) => t.projectId === filterProject)
    }
    return tasks
  }, [state.tasks, filterWeek, filterProject])

  const hoursChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const w = i + 1
      const h = weekHours(state.tasks, w)
      return { week: `W${w}`, planned: h.planned, actual: h.actual }
    })
  }, [state.tasks])

  const trackCompletionData = useMemo(() => {
    const weekNum = filterWeek === 'all' ? currentWeek : filterWeek
    return TRACKS.filter((t) => ['project', 'theory', 'practice', 'mlops', 'interview'].includes(t)).map(
      (track) => {
        const tasks = filteredTasks.filter((t) => t.track === track && t.weekNumber === weekNum)
        return { track, percent: taskCompletionPercent(tasks) }
      },
    )
  }, [filteredTasks, filterWeek, currentWeek])

  const practiceByWeek = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const w = i + 1
      const weekTasks = state.tasks.filter((t) => t.weekNumber === w)
      const attempts = state.practiceAttempts.filter((a) => {
        const q = state.questions.find((q) => q.id === a.questionId)
        return q?.weekNumber === w || (q && weekTasks.some((t) => t.track === 'practice'))
      })
      return { week: `W${w}`, attempts: attempts.length }
    })
  }, [state.practiceAttempts, state.questions, state.tasks])

  const evidenceByWeek = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const w = i + 1
      const count = state.evidence.filter((e) => e.weekNumber === w).length
      return { week: `W${w}`, evidence: count }
    })
  }, [state.evidence])

  const funnelData = useMemo(
    () =>
      applicationFunnel(state.applications)
        .filter((s) => s.count > 0)
        .map((s) => ({
          status: APPLICATION_STATUS_LABELS[s.status].slice(0, 12),
          count: s.count,
        })),
    [state.applications],
  )

  const skillMovementData = useMemo(() => {
    return SKILL_KEYS.slice(0, 8).map((skill) => ({
      skill: SKILL_LABELS[skill].slice(0, 8),
      current: state.skillAssessments.find((s) => s.skill === skill)?.score ?? 0,
      target: filterWeek === 'all' || filterWeek <= 4
        ? 3
        : filterWeek <= 8
          ? 4
          : 4,
    }))
  }, [state.skillAssessments, filterWeek])

  const insights = useMemo(() => generateInsights(state), [state])

  const weeklyActualHours = useMemo(
    () => Array.from({ length: 12 }, (_, i) => weekHours(state.tasks, i + 1).actual),
    [state.tasks],
  )
  const burnout = useMemo(() => burnoutRisk(weeklyActualHours), [weeklyActualHours])

  const activePhase = useMemo(() => {
    if (currentWeek <= 4) return state.phases.find((p) => p.number === 1)
    if (currentWeek <= 8) return state.phases.find((p) => p.number === 2)
    return state.phases.find((p) => p.number === 3)
  }, [state.phases, currentWeek])

  const toggleGateCheck = (criterion: string) => {
    setGateChecks((prev) => ({ ...prev, [criterion]: !prev[criterion] }))
  }

  const buildMarkdownReport = () => {
    const weekNum = filterWeek === 'all' ? currentWeek : filterWeek
    const stats = weekHours(state.tasks, weekNum)
    return `# Week ${weekNum} Review

**Generated:** ${new Date().toLocaleString()}

## Summary
- Completion: ${taskCompletionPercent(state.tasks.filter((t) => t.weekNumber === weekNum && !t.deferred))}%
- Planned hours: ${stats.planned}h
- Actual hours: ${stats.actual}h
- Burnout risk: ${burnout.level}

## Completed
${reviewForm.completed || '_None_'}

## Evidence created
${reviewForm.evidenceCreated || '_None_'}

## Learned
${reviewForm.learned || '_None_'}

## Failed / didn't finish
${reviewForm.failed || '_None_'}

## Blocked
${reviewForm.blocked || '_None_'}

## Metrics changed
${reviewForm.metricChanged || '_None_'}

## Took longer than expected
${reviewForm.tookLonger || '_None_'}

## Weak interview topic
${reviewForm.weakInterviewTopic || '_None_'}

## Carry over to next week
${reviewForm.carryOver || '_None_'}

## Workload realistic
${reviewForm.workloadRealistic ? 'Yes' : 'No'}

## Insights
${insights.map((i) => `- ${i}`).join('\n')}

## Monthly gate (${activePhase?.title ?? 'Current phase'})
${activePhase?.gateCriteria.map((c) => `- [${gateChecks[c] ? 'x' : ' '}] ${c}`).join('\n') ?? ''}

### Gate notes
${gateNotes || '_None_'}
`
  }

  const handleSaveReview = () => {
    const weekNum = filterWeek === 'all' ? currentWeek : filterWeek
    const stats = weekHours(state.tasks, weekNum)
    const report = buildMarkdownReport()
    setSavedReport(report)
    saveWeeklyReview({
      weekNumber: weekNum,
      ...reviewForm,
      markdownReport: report,
      completionPercent: taskCompletionPercent(
        state.tasks.filter((t) => t.weekNumber === weekNum && !t.deferred),
      ),
      plannedHours: stats.planned,
      actualHours: stats.actual,
      riskLevel: burnout.level,
    })
  }

  const exportSummary = () => {
    const summary = {
      exportedAt: nowIso(),
      currentWeek,
      burnout,
      insights,
      hoursByWeek: hoursChartData,
      skillAssessments: state.skillAssessments,
      applications: state.applications.length,
      evidence: state.evidence.length,
      gateChecks,
      gateNotes,
      latestReview: savedReport,
    }
    downloadText(
      `ml-launchpad-analytics-${todaySuffix()}.json`,
      JSON.stringify(summary, null, 2),
      'application/json',
    )
  }

  const exportReviewMarkdown = () => {
    downloadText(
      `weekly-review-week-${filterWeek === 'all' ? currentWeek : filterWeek}.md`,
      savedReport ?? buildMarkdownReport(),
      'text/markdown',
    )
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Analytics"
        description="Progress signals, insights, weekly review, and monthly gate tracking."
        actions={
          <Button variant="outline" onClick={exportSummary}>
            <Download className="size-4" aria-hidden />
            Export summary
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="space-y-1">
          <Label htmlFor="filter-week">Week filter</Label>
          <Select
            value={String(filterWeek)}
            onValueChange={(v) => setFilterWeek(v === 'all' ? 'all' : Number(v))}
          >
            <SelectTrigger id="filter-week" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All weeks</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>Week {i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-project">Project filter</Label>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger id="filter-project" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {state.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="size-5" aria-hidden />
            Burnout risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge
            variant={
              burnout.level === 'high'
                ? 'destructive'
                : burnout.level === 'moderate'
                  ? 'outline'
                  : 'success'
            }
          >
            {burnout.level} risk
          </Badge>
          {burnout.message ? (
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
              {burnout.message}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sustainable pace based on recent logged hours.</p>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Planned vs actual hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hoursChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="planned" stroke="hsl(var(--chart-2))" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="actual" stroke="var(--color-primary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion by track</CardTitle>
            <CardDescription>
              Week {filterWeek === 'all' ? currentWeek : filterWeek}
              {filterProject !== 'all' ? ` · filtered project` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trackCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="track" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="percent" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practice attempts by week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={practiceByWeek}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="attempts" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence per week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evidenceByWeek}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="evidence" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {funnelData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Application funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                    <YAxis type="category" dataKey="status" width={65} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Skill scores vs target</CardTitle>
            <CardDescription>Current self-assessment (historical movement not tracked)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillMovementData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="skill" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 9 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="var(--color-primary)" name="Current" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="hsl(var(--chart-2))" name="Target" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card id="weekly-review">
          <CardHeader>
            <CardTitle>Weekly review</CardTitle>
            <CardDescription>Week {filterWeek === 'all' ? currentWeek : filterWeek}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                'completed',
                'evidenceCreated',
                'learned',
                'failed',
                'blocked',
                'metricChanged',
                'tookLonger',
                'weakInterviewTopic',
                'carryOver',
              ] as const
            ).map((field) => (
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
              <Label htmlFor="workload-realistic">Workload was realistic</Label>
              <Switch
                id="workload-realistic"
                checked={reviewForm.workloadRealistic}
                onCheckedChange={(c) => setReviewForm({ ...reviewForm, workloadRealistic: c })}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleSaveReview}>Save review</Button>
              <Button variant="outline" onClick={exportReviewMarkdown}>
                <Download className="size-4" aria-hidden />
                Export markdown
              </Button>
            </div>
            {savedReport ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">Preview markdown report</summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                  {savedReport}
                </pre>
              </details>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly gate report</CardTitle>
            <CardDescription>{activePhase?.title ?? 'Current phase'} gate criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePhase?.gateCriteria.map((criterion) => (
              <div key={criterion} className="flex items-start gap-2">
                <Checkbox
                  id={`gate-${criterion.slice(0, 20)}`}
                  checked={!!gateChecks[criterion]}
                  onCheckedChange={() => toggleGateCheck(criterion)}
                  aria-label={criterion}
                />
                <label
                  htmlFor={`gate-${criterion.slice(0, 20)}`}
                  className="cursor-pointer text-sm leading-snug"
                >
                  {criterion}
                </label>
              </div>
            )) ?? (
              <p className="text-sm text-muted-foreground">No gate criteria for current phase.</p>
            )}
            <div className="space-y-1 pt-2">
              <Label htmlFor="gate-notes">Review notes</Label>
              <Textarea
                id="gate-notes"
                value={gateNotes}
                onChange={(e) => setGateNotes(e.target.value)}
                placeholder="Manual checklist notes, blockers, evidence links…"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function todaySuffix(): string {
  return new Date().toISOString().slice(0, 10)
}
