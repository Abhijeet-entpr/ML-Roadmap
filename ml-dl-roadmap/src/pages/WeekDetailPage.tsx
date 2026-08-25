import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { taskCompletionPercent } from '@/lib/rules'
import { formatMinutes } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import { STATUS_LABELS } from '@/types'
import PageHeader from '@/components/layout/PageHeader'
import ExitGateWidget from '@/components/widgets/ExitGateWidget'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  StatusBadge,
} from '@/components/ui'

export default function WeekDetailPage() {
  const { weekNumber } = useParams<{ weekNumber: string }>()
  const { state, ready, completeTask, updateTask, setCurrentWeek } = useApp()

  const num = Number(weekNumber)
  const week = state.weeks.find((w) => w.number === num)
  const phase = week ? state.phases.find((p) => p.id === week.phaseId) : undefined

  const weekTasks = useMemo(
    () => state.tasks.filter((t) => t.weekNumber === num && !t.deferred).sort((a, b) => a.order - b.order),
    [state.tasks, num],
  )

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

  if (!week || Number.isNaN(num)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Week not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/roadmap">Back to roadmap</Link>
        </Button>
      </div>
    )
  }

  const completion = taskCompletionPercent(weekTasks)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/roadmap">
          <ArrowLeft className="size-4" aria-hidden />
          Roadmap
        </Link>
      </Button>

      <PageHeader
        title={`Week ${week.number}: ${week.title}`}
        description={week.objective}
        actions={
          <Button
            variant={state.meta.currentWeek === num ? 'default' : 'outline'}
            onClick={() => setCurrentWeek(num)}
          >
            {state.meta.currentWeek === num ? 'Current week' : 'Set as current'}
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {phase ? <Badge variant="secondary">Phase {phase.number}: {phase.title}</Badge> : null}
        <Badge variant="outline">{week.plannedHours}h planned</Badge>
        <Badge variant="outline">{completion}% tasks done</Badge>
        <StatusBadge status={week.status}>{STATUS_LABELS[week.status]}</StatusBadge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Week overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <section>
              <h3 className="font-medium">Theory topics</h3>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {week.theoryTopics.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
            <Separator />
            <section>
              <h3 className="font-medium">Project deliverables</h3>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {week.projectDeliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </section>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <h3 className="font-medium">PyTorch exercise</h3>
                <p className="text-muted-foreground">{week.pytorchExercise}</p>
              </div>
              <div>
                <h3 className="font-medium">DSA target</h3>
                <p className="text-muted-foreground">{week.dsaTarget}</p>
              </div>
              <div>
                <h3 className="font-medium">SQL target</h3>
                <p className="text-muted-foreground">{week.sqlTarget}</p>
              </div>
              <div>
                <h3 className="font-medium">System design</h3>
                <p className="text-muted-foreground">{week.systemDesignExercise}</p>
              </div>
            </div>
            <Separator />
            <section>
              <h3 className="font-medium">Interview topics</h3>
              <ul className="mt-1 flex flex-wrap gap-1">
                {week.interviewTopics.map((t) => (
                  <Badge key={t} variant="outline">{t}</Badge>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="font-medium">Weekend checkpoint</h3>
              <p className="text-muted-foreground">{week.weekendCheckpoint}</p>
            </section>
            <section>
              <h3 className="font-medium">Common mistakes</h3>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {week.commonMistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="font-medium">Recommended resources</h3>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {week.recommendedResources.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <ExitGateWidget week={week} />

          <Card>
            <CardHeader>
              <CardTitle>Tasks ({weekTasks.length})</CardTitle>
              <CardDescription>Mark complete as you finish each item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {weekTasks.map((task) => (
                <article
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{task.track}</Badge>
                      <StatusBadge status={task.status}>{STATUS_LABELS[task.status]}</StatusBadge>
                      <span className="text-xs text-muted-foreground">{formatMinutes(task.estimatedMinutes)}</span>
                    </div>
                    <p className="mt-1 font-medium">{task.title}</p>
                    {task.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {task.status !== 'completed' ? (
                      <Button size="sm" variant="success" onClick={() => completeTask(task.id)} aria-label="Complete task">
                        <CheckCircle2 className="size-4" aria-hidden />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTask(task.id, { status: 'in_progress', completedAt: undefined })}
                      >
                        Undo
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
