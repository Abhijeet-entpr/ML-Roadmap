import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { formatMinutes } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { ReadingAssignment, Status } from '@/types'
import { STATUS_LABELS } from '@/types'
import PageHeader from '@/components/layout/PageHeader'
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
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
  Textarea,
} from '@/components/ui'

const BOOK_URL = 'https://www.deeplearningbook.org/'

const STATUS_OPTIONS: Status[] = [
  'not_started',
  'planned',
  'in_progress',
  'completed',
  'blocked',
  'skipped',
]

function ConfidenceSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <Button
          key={n}
          type="button"
          size="sm"
          variant={value === n ? 'default' : 'outline'}
          onClick={() => onChange(n)}
        >
          {n}
        </Button>
      ))}
    </div>
  )
}

function AssignmentCard({
  assignment,
  onUpdate,
}: {
  assignment: ReadingAssignment
  onUpdate: (id: string, patch: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(assignment.status === 'in_progress')
  const [newConcept, setNewConcept] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [newProjectLink, setNewProjectLink] = useState('')

  const handleAddConcept = () => {
    if (!newConcept.trim()) return
    onUpdate(assignment.id, {
      difficultConcepts: [...assignment.difficultConcepts, newConcept.trim()],
    })
    setNewConcept('')
  }

  const handleRemoveConcept = (index: number) => {
    onUpdate(assignment.id, {
      difficultConcepts: assignment.difficultConcepts.filter((_, i) => i !== index),
    })
  }

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return
    onUpdate(assignment.id, {
      interviewQuestions: [...assignment.interviewQuestions, newQuestion.trim()],
    })
    setNewQuestion('')
  }

  const handleRemoveQuestion = (index: number) => {
    onUpdate(assignment.id, {
      interviewQuestions: assignment.interviewQuestions.filter((_, i) => i !== index),
    })
  }

  const handleUpdateQuestion = (index: number, value: string) => {
    const next = [...assignment.interviewQuestions]
    next[index] = value
    onUpdate(assignment.id, { interviewQuestions: next })
  }

  const handleAddProjectLink = () => {
    if (!newProjectLink.trim()) return
    onUpdate(assignment.id, {
      projectLinks: [...assignment.projectLinks, newProjectLink.trim()],
    })
    setNewProjectLink('')
  }

  const handleRemoveProjectLink = (index: number) => {
    onUpdate(assignment.id, {
      projectLinks: assignment.projectLinks.filter((_, i) => i !== index),
    })
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((x) => !x)}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Week {assignment.weekNumber}</Badge>
              <StatusBadge status={assignment.status}>
                {STATUS_LABELS[assignment.status]}
              </StatusBadge>
              {assignment.confidence > 0 ? (
                <Badge variant="outline">Confidence {assignment.confidence}/5</Badge>
              ) : null}
            </div>
            <CardTitle className="mt-2 text-lg">{assignment.chapter}</CardTitle>
            <CardDescription>
              {assignment.focus} · {assignment.plannedSections} ·{' '}
              {formatMinutes(assignment.timeEstimateMinutes)}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" aria-label={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded ? (
        <CardContent className="space-y-6 border-t border-border/60 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`status-${assignment.id}`}>Status</Label>
              <Select
                value={assignment.status}
                onValueChange={(v) => onUpdate(assignment.id, { status: v as Status })}
              >
                <SelectTrigger id={`status-${assignment.id}`} className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Confidence</Label>
              <ConfidenceSelector
                value={assignment.confidence}
                onChange={(confidence) => onUpdate(assignment.id, { confidence })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`notes-${assignment.id}`}>Notes</Label>
            <Textarea
              id={`notes-${assignment.id}`}
              className="mt-1"
              placeholder="Reading notes, equations to revisit, questions…"
              value={assignment.notes}
              onChange={(e) => onUpdate(assignment.id, { notes: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor={`summary-${assignment.id}`}>Summary</Label>
            <Textarea
              id={`summary-${assignment.id}`}
              className="mt-1"
              placeholder="One-paragraph summary in your own words…"
              value={assignment.summary}
              onChange={(e) => onUpdate(assignment.id, { summary: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Interview questions (editable)</Label>
            <div className="mt-2 space-y-2">
              {assignment.interviewQuestions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={q}
                    onChange={(e) => handleUpdateQuestion(i, e.target.value)}
                    aria-label={`Interview question ${i + 1}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveQuestion(i)}
                    aria-label="Remove question"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add interview question…"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                />
                <Button size="icon" variant="outline" onClick={handleAddQuestion} aria-label="Add question">
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Project links</Label>
            <div className="mt-2 space-y-2">
              {assignment.projectLinks.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={link} readOnly />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveProjectLink(i)}
                    aria-label="Remove link"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Link to project artifact or experiment…"
                  value={newProjectLink}
                  onChange={(e) => setNewProjectLink(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddProjectLink()}
                />
                <Button size="icon" variant="outline" onClick={handleAddProjectLink} aria-label="Add link">
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor={`experiment-${assignment.id}`}>Related experiment</Label>
            <Input
              id={`experiment-${assignment.id}`}
              className="mt-1"
              placeholder="MLflow run ID, notebook, or experiment name…"
              value={assignment.relatedExperiment}
              onChange={(e) => onUpdate(assignment.id, { relatedExperiment: e.target.value })}
            />
          </div>

          <div>
            <Label>Difficult concepts</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {assignment.difficultConcepts.map((c, i) => (
                <Badge key={i} variant="outline" className="gap-1 pr-1">
                  {c}
                  <button
                    type="button"
                    onClick={() => handleRemoveConcept(i)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    aria-label={`Remove ${c}`}
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Add difficult concept…"
                value={newConcept}
                onChange={(e) => setNewConcept(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddConcept()}
              />
              <Button size="icon" variant="outline" onClick={handleAddConcept} aria-label="Add concept">
                <Plus className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </CardContent>
      ) : null}
    </Card>
  )
}

export default function GoodfellowPage() {
  const { state, ready, updateReading } = useApp()

  const assignments = useMemo(
    () => [...state.readingAssignments].sort((a, b) => a.weekNumber - b.weekNumber),
    [state.readingAssignments],
  )

  const stats = useMemo(() => {
    const total = assignments.length
    const completed = assignments.filter((a) => a.status === 'completed').length
    const inProgress = assignments.filter((a) => a.status === 'in_progress').length
    const totalMinutes = assignments.reduce((s, a) => s + a.timeEstimateMinutes, 0)
    return { total, completed, inProgress, totalMinutes, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }, [assignments])

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Goodfellow Reading Plan"
        description="16-week structured reading of Deep Learning (Goodfellow, Bengio, Courville). Track progress without copying chapter text."
        actions={
          <Button asChild variant="outline">
            <a href={BOOK_URL} target="_blank" rel="noopener noreferrer">
              <BookOpen className="size-4" aria-hidden />
              Open book (external)
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Weeks</p>
            <p className="font-display text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="font-display text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In progress</p>
            <p className="font-display text-2xl font-bold">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Est. reading time</p>
            <p className="font-display text-2xl font-bold">{formatMinutes(stats.totalMinutes)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">{stats.percent}%</span>
          </div>
          <Progress value={stats.percent} aria-label="Reading plan progress" />
        </CardContent>
      </Card>

      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 pt-6 text-sm">
          <BookOpen className="size-5 shrink-0 text-primary" aria-hidden />
          <p className="text-muted-foreground">
            Read from the official book at{' '}
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              deeplearningbook.org (external)
            </a>
            . Use this tracker for notes, summaries, and interview prep — do not paste chapter text here.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onUpdate={updateReading}
          />
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Need project context?{' '}
        <Link to="/projects" className="text-primary hover:underline">
          View portfolio projects
        </Link>
      </p>
    </div>
  )
}
