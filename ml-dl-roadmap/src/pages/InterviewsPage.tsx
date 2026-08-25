import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Mic,
  Plus,
  Shield,
  Sparkles,
} from 'lucide-react'
import { createId, formatDate, nowIso } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { MockInterview, Status } from '@/types'
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
} from '@/components/ui'

const INTERVIEW_CATEGORIES = [
  {
    id: 'ml_fundamentals',
    title: 'ML Fundamentals',
    description: 'Bias-variance, metrics, baselines, and evaluation design.',
    icon: Sparkles,
  },
  {
    id: 'deep_learning',
    title: 'Deep Learning',
    description: 'Training dynamics, architectures, and optimization.',
    icon: Mic,
  },
  {
    id: 'classical_ml',
    title: 'Classical ML',
    description: 'Feature engineering, ensembling, and tabular modeling.',
    icon: Sparkles,
  },
  {
    id: 'mlops',
    title: 'MLOps & Production',
    description: 'Deployment, monitoring, CI/CD, and incident response.',
    icon: Shield,
  },
  {
    id: 'system_design',
    title: 'System Design',
    description: 'End-to-end ML system architecture and trade-offs.',
    icon: Shield,
  },
  {
    id: 'behavioral',
    title: 'Behavioral & Project Defense',
    description: 'STAR stories, project narratives, and stakeholder communication.',
    icon: Mic,
  },
  {
    id: 'coding',
    title: 'Coding (Python/PyTorch)',
    description: 'Live coding, debugging, and ML implementation drills.',
    icon: Sparkles,
  },
  {
    id: 'sql_data',
    title: 'SQL & Data',
    description: 'Query design, data quality, and analytics for ML.',
    icon: Shield,
  },
] as const

const FORMAT_OPTIONS = [30, 45, 60, 75] as const
const MODE_OPTIONS = [
  { value: 'timed', label: 'Timed (verbal)' },
  { value: 'written', label: 'Written' },
  { value: 'outline', label: 'Outline only' },
] as const

function mockAverageScore(mock: MockInterview): number {
  const { clarity, correctness, structure, depth, confidence } = mock.scores
  return (clarity + correctness + structure + depth + confidence) / 5
}

export default function InterviewsPage() {
  const navigate = useNavigate()
  const { state, ready, upsertMockInterview } = useApp()

  const [form, setForm] = useState<{
    title: string
    category: string
    formatMinutes: 30 | 45 | 60 | 75
    mode: 'timed' | 'written' | 'outline'
  }>({
    title: '',
    category: INTERVIEW_CATEGORIES[0].title,
    formatMinutes: 45,
    mode: 'timed',
  })

  const revisionQueue = useMemo(
    () =>
      state.mockInterviews
        .filter((m) => m.status === 'completed' && mockAverageScore(m) < 3)
        .sort((a, b) => mockAverageScore(a) - mockAverageScore(b)),
    [state.mockInterviews],
  )

  const sortedMocks = useMemo(
    () =>
      [...state.mockInterviews].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [state.mockInterviews],
  )

  const handleCreateMock = () => {
    const title = form.title.trim() || `${form.category} mock`
    const mock: MockInterview = {
      id: createId(),
      title,
      category: form.category,
      formatMinutes: form.formatMinutes,
      mode: form.mode,
      status: 'planned' as Status,
      notes: '',
      scores: { clarity: 0, correctness: 0, structure: 0, depth: 0, confidence: 0 },
      strengths: '',
      gaps: '',
      retryItems: [],
      scheduledAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    upsertMockInterview(mock)
    navigate(`/interviews/mock/${mock.id}`)
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
        title="Interview Lab"
        description="Schedule mocks, build project defenses, and track weak areas for revision."
      />

      <section className="mb-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Interview categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTERVIEW_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <Card key={cat.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <CardTitle className="text-base">{cat.title}</CardTitle>
                  <CardDescription className="text-xs">{cat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        title: `${cat.title} mock`,
                        category: cat.title,
                      }))
                    }
                  >
                    Use category
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5" aria-hidden />
              Schedule mock interview
            </CardTitle>
            <CardDescription>Configure format and mode, then start your session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mock-title">Title</Label>
              <Input
                id="mock-title"
                placeholder="e.g. Deep learning fundamentals mock"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mock-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger id="mock-category" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.title}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="mock-format">Format (minutes)</Label>
                <Select
                  value={String(form.formatMinutes)}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, formatMinutes: Number(v) as 30 | 45 | 60 | 75 }))
                  }
                >
                  <SelectTrigger id="mock-format" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mock-mode">Mode</Label>
                <Select
                  value={form.mode}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, mode: v as 'timed' | 'written' | 'outline' }))
                  }
                >
                  <SelectTrigger id="mock-mode" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateMock}>
              <Plus className="size-4" aria-hidden />
              Create & start mock
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project-defense builder</CardTitle>
            <CardDescription>
              Prepare 30-second, 2-minute, and 5-minute narratives for each portfolio project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/50"
              >
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">Phase {project.phaseNumber}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Your mock interviews</h2>
        {sortedMocks.length === 0 ? (
          <EmptyState
            icon={Mic}
            title="No mocks yet"
            description="Schedule your first mock interview to start building interview stamina."
            action={{ label: 'Create mock', onClick: handleCreateMock }}
          />
        ) : (
          <div className="space-y-3">
            {sortedMocks.map((mock) => (
              <Card key={mock.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{mock.title}</p>
                      <StatusBadge status={mock.status}>{STATUS_LABELS[mock.status]}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {mock.category} · {mock.formatMinutes} min · {mock.mode}
                      {mock.scheduledAt ? ` · ${formatDate(mock.scheduledAt)}` : ''}
                    </p>
                    {mock.status === 'completed' ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Avg score: {mockAverageScore(mock).toFixed(1)}/5
                      </p>
                    ) : null}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/interviews/mock/${mock.id}`}>
                      {mock.status === 'completed' ? 'Review' : 'Continue'}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {revisionQueue.length > 0 ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" aria-hidden />
              Revision queue
            </CardTitle>
            <CardDescription>Completed mocks with average score below 3/5.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {revisionQueue.map((mock) => (
              <div
                key={mock.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{mock.title}</p>
                  <Badge variant="destructive">
                    Score {mockAverageScore(mock).toFixed(1)}/5
                  </Badge>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/interviews/mock/${mock.id}`}>Retry</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
