import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, FolderKanban, Quote } from 'lucide-react'
import { projectReadiness } from '@/lib/rules'
import { useApp } from '@/store/AppStore'
import { STATUS_LABELS } from '@/types'
import PageHeader from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
  StatusBadge,
} from '@/components/ui'

const PRODUCTION_GRADE_DEFINITION =
  'A project is production-grade when another engineer can reproduce, test, deploy, observe, and roll back the system without relying on undocumented knowledge.'

export default function ProjectsPage() {
  const { state, ready, derived } = useApp()

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

  const sortedProjects = [...state.projects].sort((a, b) => a.phaseNumber - b.phaseNumber)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Projects"
        description="Three production-style ML systems that form your portfolio evidence ladder."
      />

      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="flex gap-4 pt-6">
          <Quote className="size-8 shrink-0 text-primary" aria-hidden />
          <blockquote className="text-sm leading-relaxed text-foreground">
            <p className="font-medium">Production-grade definition</p>
            <p className="mt-1 text-muted-foreground">{PRODUCTION_GRADE_DEFINITION}</p>
          </blockquote>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedProjects.map((project) => {
          const readiness = projectReadiness(state.projectCapabilities, project.id)
          const score = derived.projectScores[project.id] ?? readiness.percent

          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FolderKanban className="size-5" aria-hidden />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <StatusBadge status={project.status}>{STATUS_LABELS[project.status]}</StatusBadge>
                    {project.optional ? (
                      <Badge variant="outline">Optional</Badge>
                    ) : null}
                  </div>
                </div>
                <CardTitle className="mt-3 text-lg">{project.name}</CardTitle>
                <CardDescription>{project.problem}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Readiness</span>
                    <span className="font-medium">{score}%</span>
                  </div>
                  <Progress value={score} aria-label={`${project.name} readiness ${score} percent`} />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Current milestone
                  </p>
                  <p className="mt-1 text-sm">{project.currentMilestone}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">Phase {project.phaseNumber}</Badge>
                  {readiness.blockers.length > 0 ? (
                    <Badge variant="destructive">{readiness.blockers.length} blocker(s)</Badge>
                  ) : null}
                </div>
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={`/projects/${project.id}`}>
                    View project
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
