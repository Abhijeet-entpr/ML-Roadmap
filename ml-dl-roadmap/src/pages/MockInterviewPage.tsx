import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { nowIso } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { MockInterview, Status } from '@/types'
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
  Textarea,
} from '@/components/ui'

const SCORE_DIMENSIONS = [
  { key: 'clarity' as const, label: 'Clarity' },
  { key: 'correctness' as const, label: 'Correctness' },
  { key: 'structure' as const, label: 'Structure' },
  { key: 'depth' as const, label: 'Depth' },
  { key: 'confidence' as const, label: 'Confidence' },
]

function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function MockInterviewPage() {
  const { mockId } = useParams<{ mockId: string }>()
  const { state, ready, upsertMockInterview } = useApp()

  const existing = useMemo(
    () => state.mockInterviews.find((m) => m.id === mockId),
    [state.mockInterviews, mockId],
  )

  const [draft, setDraft] = useState<MockInterview | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const [newRetryItem, setNewRetryItem] = useState('')

  useEffect(() => {
    if (existing) setDraft({ ...existing })
  }, [existing])

  const limitSeconds = (draft?.formatMinutes ?? 45) * 60
  const remainingSeconds = Math.max(0, limitSeconds - elapsedSeconds)
  const timeUp = remainingSeconds === 0

  useEffect(() => {
    if (!timerRunning || !draft || timeUp) return
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning, draft, timeUp])

  const handleSave = (markCompleted = false) => {
    if (!draft) return
    const updated: MockInterview = {
      ...draft,
      status: markCompleted ? ('completed' as Status) : draft.status === 'not_started' ? ('in_progress' as Status) : draft.status,
      updatedAt: nowIso(),
    }
    upsertMockInterview(updated)
    setDraft(updated)
    toast.success(markCompleted ? 'Mock interview saved and marked complete.' : 'Progress saved.')
  }

  const handleScoreChange = (key: keyof MockInterview['scores'], value: number) => {
    if (!draft) return
    setDraft({
      ...draft,
      scores: { ...draft.scores, [key]: value },
    })
  }

  const handleAddRetryItem = () => {
    if (!draft || !newRetryItem.trim()) return
    setDraft({
      ...draft,
      retryItems: [...draft.retryItems, newRetryItem.trim()],
    })
    setNewRetryItem('')
  }

  const handleRemoveRetryItem = (index: number) => {
    if (!draft) return
    setDraft({
      ...draft,
      retryItems: draft.retryItems.filter((_, i) => i !== index),
    })
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

  if (!existing || !draft) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Mock interview not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/interviews">Back to Interview Lab</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/interviews">
          <ArrowLeft className="size-4" aria-hidden />
          Interview Lab
        </Link>
      </Button>

      <PageHeader
        title={draft.title}
        description={`${draft.category} · ${draft.formatMinutes} min · ${draft.mode}`}
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2 font-mono">
            <Clock className={`size-4 ${timeUp ? 'text-destructive' : 'text-muted-foreground'}`} aria-hidden />
            <span aria-live="polite" className={timeUp ? 'text-destructive font-semibold' : ''}>
              {formatTimer(remainingSeconds)}
            </span>
            <Button size="sm" variant="outline" onClick={() => setTimerRunning((r) => !r)}>
              {timerRunning ? 'Pause' : 'Resume'}
            </Button>
          </div>
        }
      />

      {timeUp ? (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Time is up. Wrap up your self-assessment and save your feedback.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session notes</CardTitle>
            <CardDescription>Capture questions asked, your answers, and follow-ups.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Question 1: …&#10;My answer: …&#10;Follow-up: …"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={16}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Self-assessment scores</CardTitle>
              <CardDescription>Rate each dimension 0–5.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {SCORE_DIMENSIONS.map(({ key, label }) => (
                <div key={key}>
                  <Label className="mb-2 block">{label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        size="sm"
                        variant={draft.scores[key] === n ? 'default' : 'outline'}
                        onClick={() => handleScoreChange(key, n)}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What went well?"
                value={draft.strengths}
                onChange={(e) => setDraft({ ...draft, strengths: e.target.value })}
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What needs improvement?"
                value={draft.gaps}
                onChange={(e) => setDraft({ ...draft, gaps: e.target.value })}
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retry list</CardTitle>
              <CardDescription>Topics to revisit before the next mock.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add topic to retry…"
                  value={newRetryItem}
                  onChange={(e) => setNewRetryItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRetryItem()}
                />
                <Button size="icon" variant="outline" onClick={handleAddRetryItem} aria-label="Add retry item">
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
              {draft.retryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No retry items yet.</p>
              ) : (
                <ul className="space-y-2">
                  {draft.retryItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                    >
                      <span>{item}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveRetryItem(i)}
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => handleSave(false)}>
          <Save className="size-4" aria-hidden />
          Save progress
        </Button>
        <Button variant="success" onClick={() => handleSave(true)}>
          Save & mark complete
        </Button>
        <Badge variant="outline" className="self-center">
          Status: {draft.status.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  )
}
