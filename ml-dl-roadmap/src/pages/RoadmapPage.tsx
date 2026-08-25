import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Columns3, GitBranch, ChevronRight } from 'lucide-react'
import { useApp } from '@/store/AppStore'
import type { Status, Track } from '@/types'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'

const KANBAN_STATUSES: Status[] = ['not_started', 'planned', 'in_progress', 'blocked', 'completed']
const TRACKS: Track[] = ['project', 'theory', 'practice', 'interview', 'mlops', 'system_design', 'career', 'reading']

export default function RoadmapPage() {
  const { state, ready, updateTask, setCurrentWeek } = useApp()
  const [view, setView] = useState<'timeline' | 'kanban' | 'calendar'>('timeline')
  const [weekFilter, setWeekFilter] = useState<number | 'all'>(state.meta.currentWeek)
  const [phaseFilter, setPhaseFilter] = useState<number | 'all'>('all')
  const [trackFilter, setTrackFilter] = useState<Track | 'all'>('all')

  const filteredTasks = useMemo(() => {
    let tasks = state.tasks.filter((t) => !t.deferred)
    if (weekFilter !== 'all') tasks = tasks.filter((t) => t.weekNumber === weekFilter)
    if (phaseFilter !== 'all') {
      const phase = state.phases.find((p) => p.number === phaseFilter)
      const projectId = phase?.projectId
      if (projectId) {
        const weekNums = state.weeks.filter((w) => w.phaseId === phase.id).map((w) => w.number)
        tasks = tasks.filter((t) => weekNums.includes(t.weekNumber) || t.projectId === projectId)
      }
    }
    if (trackFilter !== 'all') tasks = tasks.filter((t) => t.track === trackFilter)
    return tasks
  }, [state.tasks, state.phases, state.weeks, weekFilter, phaseFilter, trackFilter])

  const filteredWeeks = useMemo(() => {
    let weeks = [...state.weeks]
    if (weekFilter !== 'all') weeks = weeks.filter((w) => w.number === weekFilter)
    if (phaseFilter !== 'all') {
      const phase = state.phases.find((p) => p.number === phaseFilter)
      if (phase) weeks = weeks.filter((w) => w.phaseId === phase.id)
    }
    return weeks.sort((a, b) => a.number - b.number)
  }, [state.weeks, state.phases, weekFilter, phaseFilter])

  const calendarGroups = useMemo(() => {
    const groups = new Map<string, typeof filteredTasks>()
    for (const task of filteredTasks) {
      const key = task.scheduledDate ?? `week-${task.weekNumber}`
      const list = groups.get(key) ?? []
      list.push(task)
      groups.set(key, list)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filteredTasks])

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Roadmap"
        description="12-week curriculum — timeline, kanban, and calendar views."
        actions={
          <Button variant="outline" onClick={() => setCurrentWeek(state.meta.currentWeek)}>
            Current: Week {state.meta.currentWeek}
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={String(weekFilter)} onValueChange={(v) => setWeekFilter(v === 'all' ? 'all' : Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All weeks</SelectItem>
            {state.weeks.map((w) => (
              <SelectItem key={w.number} value={String(w.number)}>Week {w.number}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(phaseFilter)} onValueChange={(v) => setPhaseFilter(v === 'all' ? 'all' : Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All phases</SelectItem>
            {state.phases.map((p) => (
              <SelectItem key={p.number} value={String(p.number)}>Phase {p.number}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={trackFilter} onValueChange={(v) => setTrackFilter(v as Track | 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tracks</SelectItem>
            {TRACKS.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList>
          <TabsTrigger value="timeline" className="gap-1.5">
            <GitBranch className="size-3.5" aria-hidden />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5">
            <Columns3 className="size-3.5" aria-hidden />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <Calendar className="size-3.5" aria-hidden />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6 space-y-4">
          {filteredWeeks.map((week, i) => {
            const weekTasks = filteredTasks.filter((t) => t.weekNumber === week.number)
            const phase = state.phases.find((p) => p.id === week.phaseId)
            const done = weekTasks.filter((t) => t.status === 'completed').length
            return (
              <motion.div
                key={week.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn(week.number === state.meta.currentWeek && 'ring-2 ring-primary/30')}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>Week {week.number}: {week.title}</CardTitle>
                        {phase ? <Badge variant="secondary">Phase {phase.number}</Badge> : null}
                        {week.number === state.meta.currentWeek ? (
                          <Badge>Current</Badge>
                        ) : null}
                      </div>
                      <CardDescription className="mt-1">{week.objective}</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" onClick={() => setCurrentWeek(week.number)}>
                      <Link to={`/roadmap/week/${week.number}`}>
                        Details
                        <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-sm text-muted-foreground">
                      {done}/{weekTasks.length} tasks complete · {week.plannedHours}h planned
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {weekTasks.slice(0, 6).map((t) => (
                        <StatusBadge key={t.id} status={t.status} className="text-xs">
                          {t.title.slice(0, 30)}{t.title.length > 30 ? '…' : ''}
                        </StatusBadge>
                      ))}
                      {weekTasks.length > 6 ? (
                        <Badge variant="outline">+{weekTasks.length - 6} more</Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <div className="grid gap-4 overflow-x-auto md:grid-cols-3 lg:grid-cols-5">
            {KANBAN_STATUSES.map((status) => {
              const columnTasks = filteredTasks.filter((t) => t.status === status)
              return (
                <div key={status} className="min-w-[200px] rounded-xl border border-border/60 bg-muted/30 p-3">
                  <h3 className="mb-3 text-sm font-semibold capitalize">
                    {STATUS_LABELS[status]}
                    <span className="ml-1.5 text-muted-foreground">({columnTasks.length})</span>
                  </h3>
                  <ul className="space-y-2">
                    {columnTasks.map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          className="w-full rounded-lg border border-border/60 bg-card p-3 text-left text-sm transition-colors hover:border-primary/40"
                          onClick={() => updateTask(task.id, { status: status === 'completed' ? 'in_progress' : 'completed' })}
                        >
                          <p className="font-medium line-clamp-2">{task.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">W{task.weekNumber} · {task.track}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6 space-y-4">
          {calendarGroups.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No tasks match filters.</p>
          ) : (
            calendarGroups.map(([dateKey, tasks]) => (
              <Card key={dateKey}>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">
                    {dateKey.startsWith('week-')
                      ? `Week ${dateKey.replace('week-', '')} (unscheduled)`
                      : formatDate(dateKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                      <span>{t.title}</span>
                      <StatusBadge status={t.status}>{STATUS_LABELS[t.status]}</StatusBadge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
