import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Filter, Plus, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { evaluateExitGate } from '@/lib/rules'
import { formatDate, todayIsoDate } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { EvidenceItem, EvidenceType, SkillKey, Visibility } from '@/types'
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from '@/components/ui'

const EVIDENCE_TYPES: EvidenceType[] = [
  'github_repo',
  'commit',
  'tagged_release',
  'experiment_run',
  'metric_table',
  'confusion_matrix',
  'error_analysis',
  'test_output',
  'ci_run',
  'docker_image',
  'deployment_url',
  'api_docs',
  'architecture_diagram',
  'model_card',
  'dataset_card',
  'benchmark',
  'load_test',
  'monitoring_dashboard',
  'alert_screenshot',
  'mock_feedback',
  'demo_video',
  'resume_bullet',
  'linkedin_post',
  'application_submission',
  'referral_request',
  'other',
]

const VISIBILITY_OPTIONS: Visibility[] = ['private', 'internal', 'public']

const ALL_SKILLS = Object.keys(SKILL_LABELS) as SkillKey[]

const EMPTY_FORM: Omit<EvidenceItem, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  type: 'github_repo',
  description: '',
  date: todayIsoDate(),
  verificationStatus: 'unverified',
  skillsDemonstrated: [],
  interviewTalkingPoints: [],
  visibility: 'private',
  notes: '',
  metricPlaceholder: 'Enter measured value',
  taskIds: [],
}

function needsMeasuredValue(item: EvidenceItem): boolean {
  if (item.type !== 'resume_bullet') return false
  if (!item.metricPlaceholder) return false
  const desc = item.description.trim()
  if (!desc) return true
  if (/\[[^\]]+\]/.test(desc)) return true
  if (desc === item.metricPlaceholder) return true
  return false
}

export default function EvidencePage() {
  const { state, ready, addEvidence } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [talkingPointInput, setTalkingPointInput] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterWeek, setFilterWeek] = useState<string>('all')
  const [filterVerification, setFilterVerification] = useState<string>('all')

  const filteredEvidence = useMemo(() => {
    return state.evidence.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false
      if (filterProject !== 'all' && e.projectId !== filterProject) return false
      if (filterWeek !== 'all' && String(e.weekNumber) !== filterWeek) return false
      if (filterVerification !== 'all' && e.verificationStatus !== filterVerification) return false
      return true
    })
  }, [state.evidence, filterType, filterProject, filterWeek, filterVerification])

  const skillsCoverage = useMemo(() => {
    const withProof: SkillKey[] = []
    const lacking: SkillKey[] = []
    for (const skill of ALL_SKILLS) {
      const assessment = state.skillAssessments.find((s) => s.skill === skill)
      const linkedEvidence = (assessment?.evidenceIds ?? [])
        .map((id) => state.evidence.find((e) => e.id === id))
        .filter(Boolean) as EvidenceItem[]
      if (linkedEvidence.length > 0 || (assessment?.score ?? 0) >= 3) {
        withProof.push(skill)
      } else {
        lacking.push(skill)
      }
    }
    return { withProof, lacking }
  }, [state.skillAssessments, state.evidence])

  const unsupportedExitCriteria = useMemo(() => {
    return state.weeks
      .filter((week) => {
        const gate = evaluateExitGate(week, state.tasks, state.evidence)
        return gate.missingEvidence.length > 0 && week.number <= state.meta.currentWeek
      })
      .map((week) => ({
        weekNumber: week.number,
        title: week.title,
        missing: evaluateExitGate(week, state.tasks, state.evidence).missingEvidence,
      }))
  }, [state.weeks, state.tasks, state.evidence, state.meta.currentWeek])

  const bulletsNeedingMetrics = useMemo(
    () => state.evidence.filter(needsMeasuredValue),
    [state.evidence],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required.')
      return
    }
    addEvidence({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      notes: form.notes.trim(),
      metricPlaceholder: form.metricPlaceholder?.trim() || undefined,
      projectId: form.projectId || undefined,
      weekNumber: form.weekNumber || undefined,
      url: form.url?.trim() || undefined,
    })
    toast.success('Evidence added.')
    setForm({ ...EMPTY_FORM, date: todayIsoDate() })
    setTalkingPointInput('')
    setShowForm(false)
  }

  const toggleSkill = (skill: SkillKey) => {
    setForm((prev) => ({
      ...prev,
      skillsDemonstrated: prev.skillsDemonstrated.includes(skill)
        ? prev.skillsDemonstrated.filter((s) => s !== skill)
        : [...prev.skillsDemonstrated, skill],
    }))
  }

  const addTalkingPoint = () => {
    const point = talkingPointInput.trim()
    if (!point) return
    setForm((prev) => ({
      ...prev,
      interviewTalkingPoints: [...prev.interviewTalkingPoints, point],
    }))
    setTalkingPointInput('')
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground" role="status">
          Loading…
        </p>
      </div>
    )
  }

  if (!state.profile?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Evidence"
        description="Attach verifiable artifacts to skills, projects, and resume claims. Never fabricate metrics."
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4" aria-hidden />
            Add evidence
          </Button>
        }
      />

      {showForm ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add evidence</CardTitle>
            <CardDescription>
              Record artifacts you can point to in interviews and on your resume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ev-title">Title</Label>
                  <Input
                    id="ev-title"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((p) => ({ ...p, type: v as EvidenceType }))}
                  >
                    <SelectTrigger id="ev-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVIDENCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-date">Date</Label>
                  <Input
                    id="ev-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-project">Project</Label>
                  <Select
                    value={form.projectId ?? 'none'}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, projectId: v === 'none' ? undefined : v }))
                    }
                  >
                    <SelectTrigger id="ev-project">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {state.projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-week">Week</Label>
                  <Select
                    value={form.weekNumber ? String(form.weekNumber) : 'none'}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        weekNumber: v === 'none' ? undefined : Number(v),
                      }))
                    }
                  >
                    <SelectTrigger id="ev-week">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {state.weeks.map((w) => (
                        <SelectItem key={w.id} value={String(w.number)}>
                          Week {w.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ev-url">URL</Label>
                  <Input
                    id="ev-url"
                    type="url"
                    placeholder="https://"
                    value={form.url ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ev-desc">Description</Label>
                  <Textarea
                    id="ev-desc"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ev-metric">Metric placeholder</Label>
                  <Input
                    id="ev-metric"
                    value={form.metricPlaceholder ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, metricPlaceholder: e.target.value }))}
                    placeholder="Enter measured value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-verification">Verification</Label>
                  <Select
                    value={form.verificationStatus}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        verificationStatus: v as EvidenceItem['verificationStatus'],
                      }))
                    }
                  >
                    <SelectTrigger id="ev-verification">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="needs_review">Needs review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-visibility">Visibility</Label>
                  <Select
                    value={form.visibility}
                    onValueChange={(v) => setForm((p) => ({ ...p, visibility: v as Visibility }))}
                  >
                    <SelectTrigger id="ev-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ev-notes">Notes</Label>
                  <Textarea
                    id="ev-notes"
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label>Skills demonstrated</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALL_SKILLS.map((skill) => (
                    <label
                      key={skill}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2 py-1 text-sm"
                    >
                      <Checkbox
                        checked={form.skillsDemonstrated.includes(skill)}
                        onCheckedChange={() => toggleSkill(skill)}
                      />
                      {SKILL_LABELS[skill]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="ev-talking">Interview talking points</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="ev-talking"
                    value={talkingPointInput}
                    onChange={(e) => setTalkingPointInput(e.target.value)}
                    placeholder="Add a talking point"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTalkingPoint()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTalkingPoint}>
                    Add
                  </Button>
                </div>
                {form.interviewTalkingPoints.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {form.interviewTalkingPoints.map((p, i) => (
                      <li key={p} className="flex items-center justify-between gap-2">
                        <span>{p}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              interviewTalkingPoints: prev.interviewTalkingPoints.filter(
                                (_, idx) => idx !== i,
                              ),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button type="submit">Save evidence</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Skills with proof</CardTitle>
          </CardHeader>
          <CardContent>
            {skillsCoverage.withProof.length ? (
              <div className="flex flex-wrap gap-1">
                {skillsCoverage.withProof.map((s) => (
                  <Badge key={s} variant="success">
                    <CheckCircle2 className="size-3" aria-hidden />
                    {SKILL_LABELS[s]}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills linked to evidence yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Skills lacking proof</CardTitle>
          </CardHeader>
          <CardContent>
            {skillsCoverage.lacking.length ? (
              <div className="flex flex-wrap gap-1">
                {skillsCoverage.lacking.map((s) => (
                  <Badge key={s} variant="outline">
                    {SKILL_LABELS[s]}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All skills have supporting evidence.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resume bullets needing metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {bulletsNeedingMetrics.length ? (
              <ul className="space-y-1 text-sm">
                {bulletsNeedingMetrics.map((b) => (
                  <li key={b.id} className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{b.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No resume bullets missing measured values.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {unsupportedExitCriteria.length > 0 ? (
        <Card className="mb-8 border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" aria-hidden />
              Exit criteria with weak evidence support
            </CardTitle>
            <CardDescription>
              Weeks at or before your current week that still lack required evidence artifacts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {unsupportedExitCriteria.map((item) => (
              <div key={item.weekNumber} className="text-sm">
                <Link
                  to={`/roadmap/week/${item.weekNumber}`}
                  className="font-medium text-primary hover:underline"
                >
                  Week {item.weekNumber}: {item.title}
                </Link>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {item.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="size-4" aria-hidden />
            Evidence library
          </CardTitle>
          <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger aria-label="Filter by type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {EVIDENCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger aria-label="Filter by project">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {state.projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterWeek} onValueChange={setFilterWeek}>
              <SelectTrigger aria-label="Filter by week">
                <SelectValue placeholder="Week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All weeks</SelectItem>
                {state.weeks.map((w) => (
                  <SelectItem key={w.id} value={String(w.number)}>
                    Week {w.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterVerification} onValueChange={setFilterVerification}>
              <SelectTrigger aria-label="Filter by verification">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="needs_review">Needs review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvidence.length === 0 ? (
            <EmptyState
              title="No evidence matches filters"
              description="Add artifacts as you complete project milestones."
              action={{ label: 'Add evidence', onClick: () => setShowForm(true) }}
            />
          ) : (
            <ul className="divide-y divide-border">
              {filteredEvidence.map((item) => {
                const project = state.projects.find((p) => p.id === item.projectId)
                return (
                  <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge variant="outline">{item.type.replace(/_/g, ' ')}</Badge>
                        {item.verificationStatus === 'verified' ? (
                          <Badge variant="success">
                            <ShieldCheck className="size-3" aria-hidden />
                            Verified
                          </Badge>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(item.date)}</span>
                        {project ? <span>{project.name}</span> : null}
                        {item.weekNumber ? <span>Week {item.weekNumber}</span> : null}
                        {item.metricPlaceholder ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            Metric: {item.metricPlaceholder}
                          </span>
                        ) : null}
                      </div>
                      {item.skillsDemonstrated.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.skillsDemonstrated.map((s) => (
                            <Badge key={s} variant="secondary">
                              {SKILL_LABELS[s]}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Open link
                      </a>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
