import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, Search } from 'lucide-react'
import { percent } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
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
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'

type CompletionFilter = 'all' | 'completed' | 'incomplete'

export default function LearnPage() {
  const { state, ready } = useApp()
  const [search, setSearch] = useState('')
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all')

  const modules = useMemo(() => {
    const q = search.trim().toLowerCase()
    return state.learningModules
      .filter((m) => {
        if (completionFilter === 'completed' && !m.completed) return false
        if (completionFilter === 'incomplete' && m.completed) return false
        if (!q) return true
        return (
          m.title.toLowerCase().includes(q) ||
          m.objective.toLowerCase().includes(q) ||
          m.keyConcepts.some((c) => c.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [state.learningModules, search, completionFilter])

  const stats = useMemo(() => {
    const total = state.learningModules.length
    const completed = state.learningModules.filter((m) => m.completed).length
    const avgConfidence =
      total > 0
        ? Math.round(
            state.learningModules.reduce((sum, m) => sum + m.confidence, 0) / total,
          )
        : 0
    return { total, completed, avgConfidence, percent: percent(completed, total) }
  }, [state.learningModules])

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
        title="Learn"
        description="Theory modules aligned to your projects and interview prep. Mark completion and rate confidence as you go."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Modules completed</p>
            <p className="mt-1 font-display text-2xl font-bold">
              {stats.completed}
              <span className="text-base font-normal text-muted-foreground"> / {stats.total}</span>
            </p>
            <Progress value={stats.percent} className="mt-3" aria-label="Module completion" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Average confidence</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.avgConfidence}/5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Curriculum coverage</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.percent}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Search modules, objectives, concepts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search learning modules"
          />
        </div>
        <Select value={completionFilter} onValueChange={(v) => setCompletionFilter(v as CompletionFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="incomplete">Not completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No modules match"
          description="Try a different search term or filter."
          action={{ label: 'Clear filters', onClick: () => { setSearch(''); setCompletionFilter('all') } }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <Card key={module.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug">{module.title}</CardTitle>
                  {module.completed ? (
                    <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Completed" />
                  ) : null}
                </div>
                <CardDescription className="line-clamp-2">{module.objective}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-1">
                  {module.keyConcepts.slice(0, 3).map((c) => (
                    <Badge key={c} variant="outline">
                      {c}
                    </Badge>
                  ))}
                  {module.keyConcepts.length > 3 ? (
                    <Badge variant="secondary">+{module.keyConcepts.length - 3}</Badge>
                  ) : null}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Confidence:{' '}
                    <span className="font-medium text-foreground">
                      {module.confidence > 0 ? `${module.confidence}/5` : 'Not rated'}
                    </span>
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/learn/${module.id}`}>
                      Open
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
