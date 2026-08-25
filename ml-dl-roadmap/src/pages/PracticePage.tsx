import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  History,
  Lightbulb,
  RotateCcw,
  Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, percent } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { Difficulty, PracticeAttempt } from '@/types'
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
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui'

const PRACTICE_TRACKS = [
  { slug: 'python', label: 'Python' },
  { slug: 'pytorch', label: 'PyTorch' },
  { slug: 'dsa', label: 'DSA' },
  { slug: 'sql', label: 'SQL' },
  { slug: 'probability', label: 'Probability' },
  { slug: 'classical_ml', label: 'Classical ML' },
  { slug: 'deep_learning', label: 'Deep Learning' },
  { slug: 'troubleshooting', label: 'Troubleshooting' },
  { slug: 'mlops', label: 'MLOps' },
  { slug: 'retrieval_rag', label: 'Retrieval and RAG' },
] as const

const WEEKLY_TARGETS: Record<string, string> = {
  python: 'Complete 2 typed Python exercises with tests.',
  pytorch: 'Complete 2 independent PyTorch coding drills.',
  dsa: 'Solve 8 array/hash problems; aim for 2 without hints.',
  sql: 'Complete 6 SQL queries covering joins and window functions.',
  probability: 'Review 3 probability scenarios with written solutions.',
  classical_ml: 'Answer 4 classical ML interview questions aloud.',
  deep_learning: 'Answer 5 deep learning fundamentals with project examples.',
  troubleshooting: 'Walk through 2 production incident post-mortems.',
  mlops: 'Complete 2 MLOps checklists (deploy, monitor, rollback).',
  retrieval_rag: 'Complete 3 retrieval/RAG design and evaluation prompts.',
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PracticePage() {
  const { track: trackParam } = useParams<{ track?: string }>()
  const navigate = useNavigate()
  const { state, ready, addPracticeAttempt } = useApp()

  const activeTrack = trackParam && PRACTICE_TRACKS.some((t) => t.slug === trackParam)
    ? trackParam
    : PRACTICE_TRACKS[0].slug

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all')
  const [topicFilter, setTopicFilter] = useState<string>('all')
  const [answer, setAnswer] = useState('')
  const [selfRating, setSelfRating] = useState(3)
  const [confidence, setConfidence] = useState(3)
  const [markedForRevision, setMarkedForRevision] = useState(false)
  const [hintRevealed, setHintRevealed] = useState(false)
  const [rubricRevealed, setRubricRevealed] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [attemptSubmitted, setAttemptSubmitted] = useState(false)

  const trackQuestions = useMemo(
    () => state.questions.filter((q) => q.track === activeTrack),
    [state.questions, activeTrack],
  )

  const topics = useMemo(
    () => [...new Set(trackQuestions.map((q) => q.topic))].sort(),
    [trackQuestions],
  )

  const filteredQuestions = useMemo(
    () =>
      trackQuestions.filter((q) => {
        if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false
        if (topicFilter !== 'all' && q.topic !== topicFilter) return false
        return true
      }),
    [trackQuestions, difficultyFilter, topicFilter],
  )

  const selectedQuestion = useMemo(
    () => filteredQuestions.find((q) => q.id === selectedQuestionId) ?? filteredQuestions[0] ?? null,
    [filteredQuestions, selectedQuestionId],
  )

  const trackAttempts = useMemo(
    () =>
      state.practiceAttempts.filter((a) =>
        state.questions.some((q) => q.id === a.questionId && q.track === activeTrack),
      ),
    [state.practiceAttempts, state.questions, activeTrack],
  )

  const questionAttempts = useMemo(
    () =>
      selectedQuestion
        ? state.practiceAttempts.filter((a) => a.questionId === selectedQuestion.id)
        : [],
    [state.practiceAttempts, selectedQuestion],
  )

  const revisionQueue = useMemo(
    () =>
      state.practiceAttempts.filter(
        (a) =>
          a.markedForRevision ||
          a.selfRating <= 2,
      ),
    [state.practiceAttempts],
  )

  const analytics = useMemo(() => {
    const attempts = state.practiceAttempts
    const total = attempts.length
    const avgRating =
      total > 0 ? Math.round((attempts.reduce((s, a) => s + a.selfRating, 0) / total) * 10) / 10 : 0
    const revisionCount = attempts.filter((a) => a.markedForRevision).length
    const rubricChecked = attempts.filter((a) => a.revealedRubric).length
    const accuracy = total > 0 ? percent(attempts.filter((a) => a.selfRating >= 4).length, total) : 0
    return { total, avgRating, revisionCount, rubricChecked, accuracy }
  }, [state.practiceAttempts])

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setTimerSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  const resetAttemptForm = useCallback(() => {
    setAnswer('')
    setSelfRating(3)
    setConfidence(3)
    setMarkedForRevision(false)
    setHintRevealed(false)
    setRubricRevealed(false)
    setTimerSeconds(0)
    setTimerRunning(false)
    setAttemptSubmitted(false)
  }, [])

  const handleTrackChange = (slug: string) => {
    navigate(slug === PRACTICE_TRACKS[0].slug ? '/practice' : `/practice/${slug}`)
    setSelectedQuestionId(null)
    resetAttemptForm()
  }

  const handleSelectQuestion = (id: string) => {
    setSelectedQuestionId(id)
    resetAttemptForm()
  }

  const handleSubmitAttempt = () => {
    if (!selectedQuestion) return
    if (!answer.trim()) {
      toast.error('Write an answer before submitting.')
      return
    }
    addPracticeAttempt({
      questionId: selectedQuestion.id,
      answer: answer.trim(),
      selfRating,
      confidence,
      markedForRevision,
      timeSpentSeconds: timerSeconds,
      revealedHint: hintRevealed,
      revealedRubric: rubricRevealed,
      notes: '',
    })
    setAttemptSubmitted(true)
    setTimerRunning(false)
    toast.success('Attempt saved.')
  }

  const handleCompareRubric = () => {
    setRubricRevealed(true)
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Practice"
        description="Structured drills across coding, ML fundamentals, and production scenarios."
      />

      <Tabs value={activeTrack} onValueChange={handleTrackChange} className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {PRACTICE_TRACKS.map((t) => (
            <TabsTrigger key={t.slug} value={t.slug} className="text-xs sm:text-sm">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PRACTICE_TRACKS.map((t) => (
          <TabsContent key={t.slug} value={t.slug} className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex gap-3 pt-6">
                <Target className="size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium">Weekly target</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {WEEKLY_TARGETS[t.slug] ?? 'Complete at least 3 practice attempts this week.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Question bank</CardTitle>
                    <CardDescription>{filteredQuestions.length} questions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      <Select
                        value={difficultyFilter}
                        onValueChange={(v) => setDifficultyFilter(v as Difficulty | 'all')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All difficulties</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={topicFilter} onValueChange={setTopicFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All topics</SelectItem>
                          {topics.map((topic) => (
                            <SelectItem key={topic} value={topic}>
                              {topic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {filteredQuestions.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          No questions in this track yet. Check back as the bank grows.
                        </p>
                      ) : (
                        filteredQuestions.map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => handleSelectQuestion(q.id)}
                            className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                              selectedQuestion?.id === q.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border/60 hover:bg-accent/50'
                            }`}
                          >
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline">{q.difficulty}</Badge>
                              <Badge variant="secondary">{q.topic}</Badge>
                            </div>
                            <p className="mt-1 font-medium line-clamp-2">{q.title}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="size-4" aria-hidden />
                      Accuracy analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total attempts</span>
                      <span className="font-medium">{analytics.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Track attempts</span>
                      <span className="font-medium">{trackAttempts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Self-rated accuracy (≥4)</span>
                      <span className="font-medium">{analytics.accuracy}%</span>
                    </div>
                    <Progress value={analytics.accuracy} aria-label="Self-rated accuracy" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg self-rating</span>
                      <span className="font-medium">{analytics.avgRating}/5</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4 lg:col-span-2">
                {!selectedQuestion ? (
                  <EmptyState
                    icon={Lightbulb}
                    title="Select a question"
                    description="Choose a question from the bank to start your practice session."
                  />
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <CardTitle>{selectedQuestion.title}</CardTitle>
                            <CardDescription className="mt-1">{selectedQuestion.prompt}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 font-mono text-sm">
                            <Clock className="size-4 text-muted-foreground" aria-hidden />
                            <span aria-live="polite">{formatTimer(timerSeconds)}</span>
                            <Button
                              size="sm"
                              variant={timerRunning ? 'secondary' : 'outline'}
                              onClick={() => setTimerRunning((r) => !r)}
                            >
                              {timerRunning ? 'Pause' : 'Start'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setTimerSeconds(0)}>
                              <RotateCcw className="size-4" aria-hidden />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <Label>Your answer</Label>
                            {!hintRevealed ? (
                              <Button size="sm" variant="outline" onClick={() => setHintRevealed(true)}>
                                <Lightbulb className="size-4" aria-hidden />
                                Reveal hint
                              </Button>
                            ) : null}
                          </div>
                          {hintRevealed ? (
                            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                              <p className="font-medium">Hint</p>
                              <p className="mt-1">{selectedQuestion.hint}</p>
                            </div>
                          ) : null}
                          <Textarea
                            placeholder="Write your solution or explanation…"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            rows={8}
                            disabled={attemptSubmitted}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="mb-2 block">Self-rating (1–5)</Label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Button
                                  key={n}
                                  type="button"
                                  size="sm"
                                  variant={selfRating === n ? 'default' : 'outline'}
                                  onClick={() => setSelfRating(n)}
                                  disabled={attemptSubmitted}
                                >
                                  {n}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="mb-2 block">Confidence (1–5)</Label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Button
                                  key={n}
                                  type="button"
                                  size="sm"
                                  variant={confidence === n ? 'default' : 'outline'}
                                  onClick={() => setConfidence(n)}
                                  disabled={attemptSubmitted}
                                >
                                  {n}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            id="mark-revision"
                            checked={markedForRevision}
                            onCheckedChange={setMarkedForRevision}
                            disabled={attemptSubmitted}
                          />
                          <Label htmlFor="mark-revision">Mark for revision (spaced repetition)</Label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!attemptSubmitted ? (
                            <Button onClick={handleSubmitAttempt}>Save attempt</Button>
                          ) : (
                            <>
                              <Button variant="outline" onClick={resetAttemptForm}>
                                Try again
                              </Button>
                              {!rubricRevealed ? (
                                <Button variant="secondary" onClick={handleCompareRubric}>
                                  <Eye className="size-4" aria-hidden />
                                  Compare with rubric
                                </Button>
                              ) : null}
                            </>
                          )}
                        </div>

                        {rubricRevealed ? (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
                            <div className="flex items-center gap-2 font-medium text-emerald-900 dark:text-emerald-200">
                              <EyeOff className="size-4" aria-hidden />
                              Rubric
                            </div>
                            <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
                              {selectedQuestion.rubric}
                            </p>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>

                    {questionAttempts.length > 0 ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <History className="size-4" aria-hidden />
                            Attempt history
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {questionAttempts.slice(0, 5).map((a: PracticeAttempt) => (
                            <div key={a.id} className="rounded-lg border border-border/60 p-3 text-sm">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{formatDate(a.createdAt)}</Badge>
                                <Badge variant="secondary">Rating {a.selfRating}/5</Badge>
                                <Badge variant="outline">{formatTimer(a.timeSpentSeconds)}</Badge>
                                {a.markedForRevision ? (
                                  <Badge variant="destructive">Revision</Badge>
                                ) : null}
                              </div>
                              <p className="mt-2 line-clamp-3 text-muted-foreground">{a.answer}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="size-5" aria-hidden />
            Spaced-repetition queue
          </CardTitle>
          <CardDescription>
            Attempts marked for revision or self-rated ≤2. Review these before new questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revisionQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items in your revision queue. Great work!</p>
          ) : (
            <div className="space-y-2">
              {revisionQueue.slice(0, 10).map((a) => {
                const q = state.questions.find((q) => q.id === a.questionId)
                return (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{q?.title ?? 'Unknown question'}</p>
                      <p className="text-xs text-muted-foreground">
                        {q?.track} · Rating {a.selfRating}/5 · {formatDate(a.createdAt)}
                      </p>
                    </div>
                    {q ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (q.track !== activeTrack) {
                            navigate(q.track === PRACTICE_TRACKS[0].slug ? '/practice' : `/practice/${q.track}`)
                          }
                          handleSelectQuestion(q.id)
                        }}
                      >
                        Review
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
