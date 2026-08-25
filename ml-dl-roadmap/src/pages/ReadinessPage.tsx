import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingUp,
} from 'lucide-react'
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  APPLICATION_MINIMUM,
  MONTH1_TARGETS,
  MONTH2_TARGETS,
  MONTH3_TARGETS,
  recommendApplications,
} from '@/lib/rules'
import { useApp } from '@/store/AppStore'
import type { SkillKey } from '@/types'
import { SKILL_LABELS } from '@/types'
import PageHeader from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/layout/EmptyState'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui'

const SKILL_KEYS = Object.keys(SKILL_LABELS) as SkillKey[]

const SCORE_RUBRIC: { score: number; label: string; description: string }[] = [
  { score: 0, label: 'None', description: 'No exposure or ability to discuss the topic.' },
  { score: 1, label: 'Aware', description: 'Can name concepts but cannot implement independently.' },
  { score: 2, label: 'Guided', description: 'Can follow tutorials or pair on straightforward tasks.' },
  { score: 3, label: 'Competent', description: 'Can implement with occasional guidance; interview-ready basics.' },
  { score: 4, label: 'Independent', description: 'Ships quality work solo; requires linked evidence.' },
  { score: 5, label: 'Expert', description: 'Can teach, review, and lead; requires linked evidence.' },
]

function monthTargetForWeek(week: number): Record<SkillKey, number> {
  if (week <= 4) return MONTH1_TARGETS
  if (week <= 8) return MONTH2_TARGETS
  return MONTH3_TARGETS
}

function monthLabel(week: number): string {
  if (week <= 4) return 'Month 1'
  if (week <= 8) return 'Month 2'
  return 'Month 3'
}

const NEXT_ACTIONS: Partial<Record<SkillKey, string>> = {
  python: 'Complete one end-to-end script with tests and attach as evidence.',
  dsa: 'Solve 3 medium problems and log attempts in Practice.',
  sql: 'Run 5 analytical queries against a real dataset; export results.',
  pytorch: 'Finish an independent PyTorch exercise and link the notebook.',
  testing: 'Add pytest coverage to a project module and attach CI output.',
  project_depth: 'Complete one mandatory project capability with deployment evidence.',
  ml_system_design: 'Draft one system-design response with monitoring and rollback.',
  communication: 'Record a 2-minute project defense and attach mock feedback.',
}

export default function ReadinessPage() {
  const { state, ready, updateSkill } = useApp()
  const [editSkill, setEditSkill] = useState<SkillKey | null>(null)
  const [draftScore, setDraftScore] = useState(0)
  const [draftEvidenceIds, setDraftEvidenceIds] = useState<string[]>([])
  const [draftNotes, setDraftNotes] = useState('')
  const [updateError, setUpdateError] = useState<string | null>(null)

  const currentWeek = state.meta.currentWeek
  const monthTarget = monthTargetForWeek(currentWeek)
  const appRec = useMemo(
    () => recommendApplications(currentWeek, state.skillAssessments),
    [currentWeek, state.skillAssessments],
  )

  const radarData = useMemo(() => {
    return SKILL_KEYS.map((skill) => ({
      skill: SKILL_LABELS[skill].slice(0, 10),
      current: state.skillAssessments.find((s) => s.skill === skill)?.score ?? 0,
      month1: MONTH1_TARGETS[skill],
      month2: MONTH2_TARGETS[skill],
      month3: MONTH3_TARGETS[skill],
      minimum: APPLICATION_MINIMUM[skill],
    }))
  }, [state.skillAssessments])

  const gapRows = useMemo(() => {
    return SKILL_KEYS.map((skill) => {
      const current = state.skillAssessments.find((s) => s.skill === skill)?.score ?? 0
      const target = monthTarget[skill]
      const min = APPLICATION_MINIMUM[skill]
      const gapToMonth = target - current
      const gapToMin = min - current
      return { skill, current, target, min, gapToMonth, gapToMin }
    }).sort((a, b) => b.gapToMin - a.gapToMin)
  }, [state.skillAssessments, monthTarget])

  const weakestCritical = useMemo(() => {
    return gapRows
      .filter((r) => r.gapToMin > 0 && APPLICATION_MINIMUM[r.skill] >= 3)
      .slice(0, 5)
  }, [gapRows])

  const monthNarrative = useMemo(() => {
    if (currentWeek <= 4) {
      return `You are in ${monthLabel(currentWeek)} (Weeks 1–4): establish Python, PyTorch fundamentals, and Project 1 evidence. Focus on closing gaps below Month 1 targets before expanding interview prep.`
    }
    if (currentWeek <= 8) {
      return `You are in ${monthLabel(currentWeek)} (Weeks 5–8): deepen transformer/NLP work, MLOps, and Project 2 production readiness. Month 2 targets expect stronger deployment and testing scores.`
    }
    return `You are in ${monthLabel(currentWeek)} (Weeks 9–12): capstone RAG platform, interview sprint, and selective applications. Month 3 targets align with application minimums across critical skills.`
  }, [currentWeek])

  const openEdit = (skill: SkillKey) => {
    const existing = state.skillAssessments.find((s) => s.skill === skill)
    setEditSkill(skill)
    setDraftScore(existing?.score ?? 0)
    setDraftEvidenceIds(existing?.evidenceIds ?? [])
    setDraftNotes(existing?.notes ?? '')
    setUpdateError(null)
  }

  const toggleEvidence = (id: string) => {
    setDraftEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    )
  }

  const handleSaveSkill = () => {
    if (!editSkill) return
    const result = updateSkill(editSkill, draftScore, draftEvidenceIds, draftNotes)
    if (!result.ok) {
      setUpdateError(result.reason ?? 'Unable to update score.')
      return
    }
    setEditSkill(null)
    setUpdateError(null)
  }

  const skillEvidence = editSkill
    ? state.evidence.filter((e) => e.skillsDemonstrated.includes(editSkill))
    : []

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
        title="Readiness"
        description="Skill trajectory vs monthly targets and application minimums."
      />

      <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{monthNarrative}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5 text-primary" aria-hidden />
              Skill radar
            </CardTitle>
            <CardDescription>Current vs Month 1/2/3 and application minimum</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full" role="img" aria-label="Skill radar chart">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 9 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 5]}
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 9 }}
                  />
                  <Radar
                    name="Current"
                    dataKey="current"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Month 1"
                    dataKey="month1"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.05}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="Month 2"
                    dataKey="month2"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.05}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="Month 3"
                    dataKey="month3"
                    stroke="hsl(var(--chart-4))"
                    fill="hsl(var(--chart-4))"
                    fillOpacity={0.05}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="App minimum"
                    dataKey="minimum"
                    stroke="hsl(var(--chart-5))"
                    fill="hsl(var(--chart-5))"
                    fillOpacity={0.05}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" aria-hidden />
              Application readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              {appRec.recommend ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
              ) : (
                <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden />
              )}
              <div>
                <Badge variant={appRec.recommend ? 'success' : 'outline'}>
                  {appRec.recommend ? 'Ready for selective applications' : 'Not yet recommended'}
                </Badge>
                <p className="mt-2 text-sm text-muted-foreground">{appRec.reason}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Week {currentWeek} · {monthLabel(currentWeek)} target active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gap analysis</CardTitle>
            <CardDescription>Current vs {monthLabel(currentWeek)} target and application minimum</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">Skill</th>
                  <th className="pb-2 pr-2 font-medium">Now</th>
                  <th className="pb-2 pr-2 font-medium">Month</th>
                  <th className="pb-2 pr-2 font-medium">Min</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {gapRows.map((row) => (
                  <tr key={row.skill} className="border-b border-border/50">
                    <td className="py-2 pr-2 font-medium">{SKILL_LABELS[row.skill]}</td>
                    <td className="py-2 pr-2">{row.current}</td>
                    <td className="py-2 pr-2">
                      {row.target}
                      {row.gapToMonth > 0 ? (
                        <span className="ml-1 text-warning">−{row.gapToMonth}</span>
                      ) : (
                        <span className="ml-1 text-success">✓</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {row.min}
                      {row.gapToMin > 0 ? (
                        <span className="ml-1 text-destructive">−{row.gapToMin}</span>
                      ) : (
                        <span className="ml-1 text-success">✓</span>
                      )}
                    </td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(row.skill)}>
                        Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weakest critical skills</CardTitle>
            <CardDescription>Below application minimum (score ≥ 3 required)</CardDescription>
          </CardHeader>
          <CardContent>
            {weakestCritical.length === 0 ? (
              <EmptyState
                title="No critical gaps"
                description="All critical skills meet application minimums."
              />
            ) : (
              <ul className="space-y-4">
                {weakestCritical.map((row) => (
                  <li key={row.skill} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{SKILL_LABELS[row.skill]}</span>
                      <Badge variant="destructive">
                        {row.current} / {row.min} min
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {NEXT_ACTIONS[row.skill] ?? 'Add evidence and practice in the relevant track.'}
                    </p>
                    <Button className="mt-2" variant="outline" size="sm" onClick={() => openEdit(row.skill)}>
                      Update score
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Score rubric (0–5)</CardTitle>
          <CardDescription>Scores of 4 or 5 require linked evidence demonstrating the skill.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SCORE_RUBRIC.map((item) => (
              <div
                key={item.score}
                className="rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {item.score}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editSkill} onOpenChange={(open) => !open && setEditSkill(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Update {editSkill ? SKILL_LABELS[editSkill] : 'skill'} score
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-score">Score (0–5)</Label>
              <Select
                value={String(draftScore)}
                onValueChange={(v) => setDraftScore(Number(v))}
              >
                <SelectTrigger id="skill-score">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} — {SCORE_RUBRIC[n]?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {draftScore >= 4 ? (
                <p className="text-xs text-warning">
                  Scores of 4 or 5 require at least one linked evidence item that demonstrates this skill.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Linked evidence</Label>
              {skillEvidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No evidence tagged with this skill. Add evidence on the Evidence page first.
                </p>
              ) : (
                <ul className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
                  {skillEvidence.map((e) => (
                    <li key={e.id} className="flex items-start gap-2">
                      <Checkbox
                        id={`ev-${e.id}`}
                        checked={draftEvidenceIds.includes(e.id)}
                        onCheckedChange={() => toggleEvidence(e.id)}
                        aria-label={`Link evidence: ${e.title}`}
                      />
                      <label htmlFor={`ev-${e.id}`} className="cursor-pointer text-sm">
                        <span className="font-medium">{e.title}</span>
                        <span className="block text-xs text-muted-foreground">{e.type.replace(/_/g, ' ')}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              {state.evidence.filter((e) => !e.skillsDemonstrated.includes(editSkill!)).length > 0 ? (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">Show other evidence</summary>
                  <ul className="mt-2 max-h-32 space-y-2 overflow-y-auto">
                    {state.evidence
                      .filter((e) => editSkill && !e.skillsDemonstrated.includes(editSkill))
                      .map((e) => (
                        <li key={e.id} className="flex items-start gap-2">
                          <Checkbox
                            id={`ev-other-${e.id}`}
                            checked={draftEvidenceIds.includes(e.id)}
                            onCheckedChange={() => toggleEvidence(e.id)}
                          />
                          <label htmlFor={`ev-other-${e.id}`} className="cursor-pointer text-sm">
                            {e.title}
                          </label>
                        </li>
                      ))}
                  </ul>
                </details>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-notes">Notes</Label>
              <Textarea
                id="skill-notes"
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                rows={2}
              />
            </div>

            {updateError ? (
              <p className="text-sm text-destructive" role="alert">
                {updateError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSkill(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSkill}>Save score</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
