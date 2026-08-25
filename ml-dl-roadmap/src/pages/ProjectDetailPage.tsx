import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Plus,
  Quote,
  XCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { projectReadiness } from '@/lib/rules'
import { formatDate, todayIsoDate } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type {
  EvidenceItem,
  EvidenceType,
  ProductionCapability,
  ProjectCapabilityStatus,
  Status,
} from '@/types'
import { STATUS_LABELS } from '@/types'
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
  Input,
  Label,
  Progress,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui'

const PRODUCTION_GRADE_DEFINITION =
  'A project is production-grade when another engineer can reproduce, test, deploy, observe, and roll back the system without relying on undocumented knowledge.'

const TAB_CAPABILITY_KEYS: Record<string, string[]> = {
  requirements: ['modular_code_and_configuration'],
  data: ['data_validation', 'reproducible_environment'],
  experiments: ['experiment_tracking', 'model_versioning'],
  evaluation: ['load_testing'],
  'error-analysis': ['exception_handling'],
  'api-deployment': [
    'docker',
    'api_contract',
    'authentication',
    'cloud_deployment',
    'automated_deployment',
  ],
  'tests-cicd': ['unit_tests', 'integration_tests', 'ci', 'formatting_and_linting', 'type_hints'],
  monitoring: [
    'logging',
    'service_monitoring',
    'model_quality_monitoring_plan',
    'drift_evaluation',
    'alerting',
    'rollback',
  ],
  security: ['authentication', 'security_review'],
  documentation: ['architecture_documentation', 'operations_documentation'],
}

const TAB_EVIDENCE_TYPES: Record<string, EvidenceType[]> = {
  requirements: ['architecture_diagram'],
  data: ['dataset_card'],
  experiments: ['experiment_run'],
  evaluation: ['metric_table', 'benchmark', 'confusion_matrix'],
  'error-analysis': ['error_analysis'],
  'api-deployment': ['deployment_url', 'docker_image', 'api_docs'],
  'tests-cicd': ['test_output', 'ci_run'],
  monitoring: ['monitoring_dashboard', 'alert_screenshot', 'load_test'],
  security: [],
  documentation: ['model_card', 'api_docs', 'architecture_diagram'],
}

const DEFENSE_SECTIONS = {
  thirtySecond: {
    label: '30-second pitch',
    fields: [
      ['problem', 'Problem'],
      ['baseline', 'Baseline'],
      ['model', 'Model'],
      ['metrics', 'Metrics'],
      ['deployment', 'Deployment'],
      ['engineering_differentiator', 'Engineering differentiator'],
    ] as const,
  },
  twoMinute: {
    label: '2-minute walkthrough',
    fields: [
      ['business_problem', 'Business problem'],
      ['dataset', 'Dataset'],
      ['baseline', 'Baseline'],
      ['model_choice', 'Model choice'],
      ['evaluation', 'Evaluation'],
      ['error_analysis', 'Error analysis'],
      ['deployment', 'Deployment'],
      ['monitoring', 'Monitoring'],
      ['key_tradeoff', 'Key trade-off'],
      ['next_improvement', 'Next improvement'],
    ] as const,
  },
  fiveMinute: {
    label: '5-minute defense',
    fields: [
      ['requirements_and_users', 'Requirements and users'],
      ['data_and_validation', 'Data and validation'],
      ['baseline_and_model', 'Baseline and model'],
      ['evaluation_and_error_analysis', 'Evaluation and error analysis'],
      ['api_and_deployment', 'API and deployment'],
      ['monitoring_and_failure_handling', 'Monitoring and failure handling'],
      ['results_and_limitations', 'Results and limitations'],
      ['scaling_plan', 'Scaling plan'],
    ] as const,
  },
} as const

function capabilityLabel(cap: ProductionCapability | undefined, fallback: string) {
  return cap?.label ?? fallback
}

function RequirementBadge({ requirement }: { requirement: ProjectCapabilityStatus['requirement'] }) {
  if (requirement === 'na') return <Badge variant="outline">N/A</Badge>
  if (requirement === 'optional') return <Badge variant="secondary">Optional</Badge>
  return <Badge variant="default">Required</Badge>
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { state, ready, updateProjectCapability, updateProjectDefense, addEvidence } = useApp()
  const [activeTab, setActiveTab] = useState('overview')
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false)
  const [newEvidence, setNewEvidence] = useState({
    title: '',
    type: 'github_repo' as EvidenceType,
    description: '',
    url: '',
  })

  const project = state.projects.find((p) => p.id === projectId)
  const defense = state.projectDefenses.find((d) => d.projectId === projectId)

  const projectCaps = useMemo(
    () => state.projectCapabilities.filter((c) => c.projectId === projectId),
    [state.projectCapabilities, projectId],
  )

  const capById = useMemo(
    () => Object.fromEntries(state.capabilities.map((c) => [c.id, c])),
    [state.capabilities],
  )

  const capByKey = useMemo(
    () => Object.fromEntries(state.capabilities.map((c) => [c.key, c])),
    [state.capabilities],
  )

  const readiness = useMemo(
    () => (projectId ? projectReadiness(state.projectCapabilities, projectId) : null),
    [state.projectCapabilities, projectId],
  )

  const projectEvidence = useMemo(
    () => state.evidence.filter((e) => e.projectId === projectId),
    [state.evidence, projectId],
  )

  const interviewTalkingPoints = useMemo(() => {
    const points = new Set<string>()
    for (const pc of projectCaps.filter((c) => c.status === 'completed')) {
      for (const eid of pc.evidenceIds) {
        const ev = state.evidence.find((e) => e.id === eid)
        ev?.interviewTalkingPoints.forEach((p) => points.add(p))
      }
    }
    return [...points]
  }, [projectCaps, state.evidence])

  const readinessChart = useMemo(() => {
    const groups = [
      { name: 'Done', count: projectCaps.filter((c) => c.requirement === 'required' && c.status === 'completed').length },
      { name: 'In progress', count: projectCaps.filter((c) => c.requirement === 'required' && c.status === 'in_progress').length },
      { name: 'Not started', count: projectCaps.filter((c) => c.requirement === 'required' && c.status === 'not_started').length },
      { name: 'Blocked', count: projectCaps.filter((c) => c.requirement === 'required' && c.status === 'blocked').length },
    ]
    return groups.filter((g) => g.count > 0)
  }, [projectCaps])

  const requiredCaps = projectCaps.filter((c) => c.requirement === 'required')

  const handleAddEvidence = () => {
    if (!projectId || !newEvidence.title.trim()) {
      toast.error('Title is required.')
      return
    }
    addEvidence({
      title: newEvidence.title.trim(),
      type: newEvidence.type,
      description: newEvidence.description.trim(),
      url: newEvidence.url.trim() || undefined,
      projectId,
      date: todayIsoDate(),
      verificationStatus: 'unverified',
      skillsDemonstrated: [],
      interviewTalkingPoints: [],
      visibility: 'private',
      notes: '',
      taskIds: [],
    })
    toast.success('Evidence added to project.')
    setNewEvidence({ title: '', type: 'github_repo', description: '', url: '' })
    setEvidenceDialogOpen(false)
  }

  const renderCapabilityRow = (pc: ProjectCapabilityStatus) => {
    const cap = capById[pc.capabilityId]

    return (
      <tr key={pc.id} className="border-b border-border align-top">
        <td className="py-3 pr-4">
          <p className="font-medium">{capabilityLabel(cap, pc.capabilityId)}</p>
          {cap?.description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{cap.description}</p>
          ) : null}
        </td>
        <td className="py-3 pr-4">
          <RequirementBadge requirement={pc.requirement} />
        </td>
        <td className="py-3 pr-4">
          <Select
            value={pc.status}
            onValueChange={(v) => updateProjectCapability(pc.id, { status: v as Status })}
          >
            <SelectTrigger className="w-[140px]" aria-label={`Status for ${cap?.label}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="py-3 pr-4">
          <Textarea
            value={pc.notes}
            onChange={(e) => updateProjectCapability(pc.id, { notes: e.target.value })}
            rows={2}
            className="min-w-[180px]"
            aria-label={`Notes for ${cap?.label}`}
          />
        </td>
        <td className="py-3 pr-4">
          <div className="space-y-2">
            {projectEvidence.map((ev) => (
              <label key={ev.id} className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={pc.evidenceIds.includes(ev.id)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...pc.evidenceIds, ev.id]
                      : pc.evidenceIds.filter((id) => id !== ev.id)
                    updateProjectCapability(pc.id, { evidenceIds: next })
                  }}
                />
                <span className="leading-tight">{ev.title}</span>
              </label>
            ))}
            {projectEvidence.length === 0 ? (
              <p className="text-xs text-muted-foreground">No project evidence yet.</p>
            ) : null}
          </div>
        </td>
        <td className="py-3 pr-4 text-sm text-muted-foreground">
          {pc.completedAt ? formatDate(pc.completedAt) : '—'}
        </td>
        <td className="py-3">
          <Textarea
            value={pc.reviewerFeedback}
            onChange={(e) =>
              updateProjectCapability(pc.id, { reviewerFeedback: e.target.value })
            }
            rows={2}
            className="min-w-[160px]"
            aria-label={`Reviewer feedback for ${cap?.label}`}
          />
        </td>
      </tr>
    )
  }

  const renderOperationalTab = (tabKey: string, title: string, description: string) => {
    const keys = TAB_CAPABILITY_KEYS[tabKey] ?? []
    const caps = keys
      .map((k) => capByKey[k])
      .filter(Boolean)
      .flatMap((cap) => projectCaps.filter((pc) => pc.capabilityId === cap!.id))

    const evidenceTypes = TAB_EVIDENCE_TYPES[tabKey] ?? []
    const tabEvidence = projectEvidence.filter(
      (e) => evidenceTypes.length === 0 || evidenceTypes.includes(e.type),
    )

    return (
      <TabsContent value={tabKey} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {caps.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Production capabilities</h3>
                {caps.map((pc) => {
                  const cap = capById[pc.capabilityId]
                  return (
                    <div key={pc.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{capabilityLabel(cap, pc.capabilityId)}</p>
                        <div className="flex items-center gap-2">
                          <RequirementBadge requirement={pc.requirement} />
                          <Select
                            value={pc.status}
                            onValueChange={(v) =>
                              updateProjectCapability(pc.id, { status: v as Status })
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Textarea
                        className="mt-3"
                        value={pc.notes}
                        onChange={(e) => updateProjectCapability(pc.id, { notes: e.target.value })}
                        placeholder="Operational notes for this capability…"
                        rows={3}
                        aria-label={`${title} notes for ${cap?.label}`}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No mapped capabilities for this section. Use the Production Readiness Matrix on
                Overview.
              </p>
            )}

            <Separator />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">Related evidence</h3>
                <Button size="sm" variant="outline" onClick={() => setEvidenceDialogOpen(true)}>
                  <Plus className="size-4" aria-hidden />
                  Add
                </Button>
              </div>
              {tabEvidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">No evidence linked to this area yet.</p>
              ) : (
                <ul className="space-y-2">
                  {tabEvidence.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{ev.title}</p>
                        <p className="text-muted-foreground">{ev.description || ev.type.replace(/_/g, ' ')}</p>
                      </div>
                      {ev.url ? (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-primary hover:underline"
                        >
                          <ExternalLink className="size-4" aria-hidden />
                          <span className="sr-only">Open {ev.title}</span>
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    )
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

  if (!project || !readiness) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/projects">
          <ArrowLeft className="size-4" aria-hidden />
          Projects
        </Link>
      </Button>

      <PageHeader
        title={project.name}
        description={project.problem}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status}>{STATUS_LABELS[project.status]}</StatusBadge>
            {project.optional ? <Badge variant="outline">Optional</Badge> : null}
            <Badge variant="secondary">Phase {project.phaseNumber}</Badge>
          </div>
        }
      />

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 pt-6">
          <Quote className="size-6 shrink-0 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">{PRODUCTION_GRADE_DEFINITION}</p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full pb-2">
          <TabsList className="inline-flex h-auto w-max flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="error-analysis">Error Analysis</TabsTrigger>
            <TabsTrigger value="api-deployment">API &amp; Deployment</TabsTrigger>
            <TabsTrigger value="tests-cicd">Tests &amp; CI/CD</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="interview-defense">Interview Defense</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="release-checklist">Release Checklist</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project specification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Users</p>
                  <p className="text-muted-foreground">{project.users}</p>
                </div>
                <div>
                  <p className="font-medium">Baseline</p>
                  <p className="text-muted-foreground">{project.baseline}</p>
                </div>
                <div>
                  <p className="font-medium">Main model</p>
                  <p className="text-muted-foreground">{project.mainModel}</p>
                </div>
                <div>
                  <p className="font-medium">Metrics</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {project.metrics.map((m) => (
                      <Badge key={m} variant="outline">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium">Latency target</p>
                  <p className="text-muted-foreground">{project.latencyTarget}</p>
                </div>
                <div>
                  <p className="font-medium">Deployment approach</p>
                  <p className="text-muted-foreground">{project.deployment}</p>
                </div>
                <div>
                  <p className="font-medium">Monitoring</p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {project.monitoring.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Security</p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {project.security.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Current milestone</p>
                  <p className="text-muted-foreground">{project.currentMilestone}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Production readiness</CardTitle>
                  <CardDescription>
                    Required capabilities completed for a production-style handoff.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Readiness score</span>
                      <span className="font-semibold">{readiness.percent}%</span>
                    </div>
                    <Progress value={readiness.percent} aria-label={`Readiness ${readiness.percent} percent`} />
                  </div>

                  {readinessChart.length > 0 ? (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={readinessChart}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}

                  {readiness.missingMandatory.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-destructive">Missing mandatory</p>
                      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {readiness.missingMandatory.map((pc) => (
                          <li key={pc.id} className="flex items-center gap-2">
                            <XCircle className="size-4 text-destructive" aria-hidden />
                            {capabilityLabel(capById[pc.capabilityId], pc.capabilityId)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" aria-hidden />
                      All required capabilities marked complete.
                    </p>
                  )}

                  {readiness.blockers.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium">Blockers</p>
                      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {readiness.blockers.map((pc) => (
                          <li key={pc.id}>{capabilityLabel(capById[pc.capabilityId], pc.capabilityId)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interview talking points</CardTitle>
                  <CardDescription>From evidence attached to completed capabilities.</CardDescription>
                </CardHeader>
                <CardContent>
                  {interviewTalkingPoints.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {interviewTalkingPoints.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Complete capabilities and attach evidence with talking points.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Production Readiness Matrix</CardTitle>
              <CardDescription>
                Track each capability for a production-style release. Status updates persist
                automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4">Capability</th>
                    <th className="pb-2 pr-4">Req.</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Notes</th>
                    <th className="pb-2 pr-4">Evidence</th>
                    <th className="pb-2 pr-4">Completed</th>
                    <th className="pb-2">Reviewer</th>
                  </tr>
                </thead>
                <tbody>
                  {projectCaps
                    .filter((pc) => pc.requirement !== 'na')
                    .map((pc) => renderCapabilityRow(pc))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {renderOperationalTab(
          'requirements',
          'Requirements',
          'Scope, users, and success criteria for a production-style ML service.',
        )}
        {renderOperationalTab(
          'data',
          'Data',
          'Dataset validation, splits, and reproducible data pipelines.',
        )}
        {renderOperationalTab(
          'experiments',
          'Experiments',
          'Tracked training runs and model versioning for reproducibility.',
        )}
        {renderOperationalTab(
          'evaluation',
          'Evaluation',
          'Offline metrics, benchmarks, and calibration evidence.',
        )}
        {renderOperationalTab(
          'error-analysis',
          'Error Analysis',
          'Failure modes, confusion patterns, and remediation plans.',
        )}
        {renderOperationalTab(
          'api-deployment',
          'API and Deployment',
          'Containerized serving, contracts, and deployment targets (no live traffic claims).',
        )}
        {renderOperationalTab(
          'tests-cicd',
          'Tests and CI/CD',
          'Automated quality gates before any production-style release.',
        )}
        {renderOperationalTab(
          'monitoring',
          'Monitoring',
          'Observability plans for latency, errors, and model quality in a staging or managed endpoint.',
        )}
        {renderOperationalTab(
          'security',
          'Security',
          'Authentication, input validation, and security review artifacts.',
        )}
        {renderOperationalTab(
          'documentation',
          'Documentation',
          'Architecture and runbooks another engineer can follow.',
        )}

        <TabsContent value="interview-defense" className="space-y-6">
          {defense ? (
            Object.entries(DEFENSE_SECTIONS).map(([sectionKey, section]) => (
              <Card key={sectionKey}>
                <CardHeader>
                  <CardTitle>{section.label}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {section.fields.map(([fieldKey, label]) => {
                    const sectionData =
                      sectionKey === 'thirtySecond'
                        ? defense.thirtySecond
                        : sectionKey === 'twoMinute'
                          ? defense.twoMinute
                          : defense.fiveMinute
                    return (
                    <div key={fieldKey} className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`${sectionKey}-${fieldKey}`}>{label}</Label>
                      <Textarea
                        id={`${sectionKey}-${fieldKey}`}
                        value={sectionData[fieldKey] ?? ''}
                        onChange={(e) =>
                          updateProjectDefense(project.id, {
                            [sectionKey]: {
                              ...sectionData,
                              [fieldKey]: e.target.value,
                            },
                          })
                        }
                        rows={3}
                      />
                    </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState title="Defense outline unavailable" description="Reset sample data if this persists." />
          )}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project evidence</CardTitle>
                <CardDescription>Artifacts supporting this project&apos;s readiness claims.</CardDescription>
              </div>
              <Button onClick={() => setEvidenceDialogOpen(true)}>
                <Plus className="size-4" aria-hidden />
                Add evidence
              </Button>
            </CardHeader>
            <CardContent>
              {projectEvidence.length === 0 ? (
                <EmptyState
                  title="No evidence yet"
                  description="Add repos, metrics tables, CI runs, and deployment URLs as you build."
                  action={{ label: 'Add evidence', onClick: () => setEvidenceDialogOpen(true) }}
                />
              ) : (
                <ul className="divide-y divide-border">
                  {projectEvidence.map((ev) => (
                    <li key={ev.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{ev.title}</p>
                          <Badge variant="outline">{ev.type.replace(/_/g, ' ')}</Badge>
                          <Badge variant="secondary">{ev.verificationStatus}</Badge>
                        </div>
                        {ev.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">{ev.description}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(ev.date)}</p>
                      </div>
                      {ev.url ? (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Open
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="release-checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Release checklist</CardTitle>
              <CardDescription>
                Required capabilities for a production-style handoff. Optional items shown for
                completeness.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {requiredCaps.map((pc) => {
                  const cap = capById[pc.capabilityId]
                  const done = pc.status === 'completed'
                  return (
                    <li
                      key={pc.id}
                      className="flex items-start gap-3 rounded-xl border border-border p-4"
                    >
                      {done ? (
                        <CheckCircle2
                          className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                          aria-hidden
                        />
                      ) : (
                        <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{capabilityLabel(cap, pc.capabilityId)}</p>
                        {pc.notes ? (
                          <p className="mt-1 text-sm text-muted-foreground">{pc.notes}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <StatusBadge status={pc.status}>{STATUS_LABELS[pc.status]}</StatusBadge>
                          {pc.evidenceIds.length > 0 ? (
                            <Badge variant="outline">{pc.evidenceIds.length} evidence</Badge>
                          ) : (
                            <Badge variant="destructive">No evidence linked</Badge>
                          )}
                        </div>
                      </div>
                      {!done ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProjectCapability(pc.id, { status: 'completed' })}
                        >
                          Mark complete
                        </Button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>

              <Separator className="my-6" />

              <div className="rounded-xl bg-muted/50 p-4 text-sm">
                <p className="font-medium">Release gate</p>
                <p className="mt-1 text-muted-foreground">
                  {readiness.percent === 100
                    ? 'All required capabilities are complete. Review evidence before claiming production-style readiness in interviews.'
                    : `${readiness.missingMandatory.length} required capability(ies) remain. Do not claim live production traffic without verified deployment evidence.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add project evidence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pe-title">Title</Label>
              <Input
                id="pe-title"
                value={newEvidence.title}
                onChange={(e) => setNewEvidence((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-type">Type</Label>
              <Select
                value={newEvidence.type}
                onValueChange={(v) =>
                  setNewEvidence((p) => ({ ...p, type: v as EvidenceType }))
                }
              >
                <SelectTrigger id="pe-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'github_repo',
                    'experiment_run',
                    'metric_table',
                    'test_output',
                    'ci_run',
                    'deployment_url',
                    'monitoring_dashboard',
                    'model_card',
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-desc">Description</Label>
              <Textarea
                id="pe-desc"
                value={newEvidence.description}
                onChange={(e) => setNewEvidence((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-url">URL</Label>
              <Input
                id="pe-url"
                type="url"
                value={newEvidence.url}
                onChange={(e) => setNewEvidence((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvidence}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
