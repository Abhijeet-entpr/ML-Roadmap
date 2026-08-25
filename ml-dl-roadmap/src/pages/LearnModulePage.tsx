import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { safeExternalUrl } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
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
  Separator,
  Textarea,
} from '@/components/ui'

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
          aria-pressed={value === n}
        >
          {n}
        </Button>
      ))}
    </div>
  )
}

export default function LearnModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const { state, ready, updateModule } = useApp()

  const module = useMemo(
    () => state.learningModules.find((m) => m.id === moduleId || m.slug === moduleId),
    [state.learningModules, moduleId],
  )

  const linkedResources = useMemo(
    () =>
      module
        ? state.resources.filter((r) => module.resourceIds.includes(r.id))
        : [],
    [state.resources, module],
  )

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

  if (!module) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Module not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/learn">Back to Learn</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/learn">
          <ArrowLeft className="size-4" aria-hidden />
          Learn
        </Link>
      </Button>

      <PageHeader title={module.title} description={module.objective} />

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="module-completed"
            checked={module.completed}
            onCheckedChange={(checked) => updateModule(module.id, { completed: checked === true })}
          />
          <Label htmlFor="module-completed" className="cursor-pointer font-medium">
            Mark module complete
          </Label>
        </div>
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Label className="shrink-0 text-sm text-muted-foreground">Confidence</Label>
          <ConfidenceSelector
            value={module.confidence}
            onChange={(confidence) => updateModule(module.id, { confidence })}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{module.explanation}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key concepts</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {module.keyConcepts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practical exercise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{module.practicalExercise}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project connection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{module.projectConnection}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common misconceptions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {module.misconceptions.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview questions</CardTitle>
              <CardDescription>Practice answering these out loud.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-inside list-decimal space-y-2 text-sm">
                {module.interviewQuestions.map((q, i) => (
                  <li key={i} className="text-muted-foreground">
                    {q}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Summarize takeaways, links, or follow-up questions…"
                value={module.notes}
                onChange={(e) => updateModule(module.id, { notes: e.target.value })}
                rows={8}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {linkedResources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No linked resources for this module.</p>
              ) : (
                linkedResources.map((r) => {
                  const url = safeExternalUrl(r.url)
                  return (
                    <div key={r.id} className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{r.title}</p>
                        {r.official ? <Badge variant="secondary">Official</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Open external
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
