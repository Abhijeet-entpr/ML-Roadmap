import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, Network } from 'lucide-react'
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
} from '@/components/ui'

export default function SystemDesignPage() {
  const { state, ready } = useApp()

  const exercises = state.systemDesignExercises

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
        title="System Design"
        description="Twelve ML system design exercises with structured rubrics. Work through each section and export your response."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {exercises.map((exercise, index) => {
          const response = state.systemDesignResponses.find((r) => r.exerciseId === exercise.id)
          const filledSections = response
            ? Object.values(response.sections).filter((s) => s.trim()).length
            : 0

          return (
            <Card key={exercise.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Network className="size-5" aria-hidden />
                  </div>
                  <Badge variant="outline">Exercise {index + 1}</Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{exercise.title}</CardTitle>
                <CardDescription>{exercise.prompt}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Constraints preview
                  </p>
                  <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                    {exercise.constraints.slice(0, 3).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                    {exercise.constraints.length > 3 ? (
                      <li className="list-none text-xs italic">
                        +{exercise.constraints.length - 3} more
                      </li>
                    ) : null}
                  </ul>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {response
                      ? `${filledSections}/${exercise.rubric.length} sections · v${response.version}`
                      : 'Not started'}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/system-design/${exercise.id}`}>
                      Open
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
