import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Link2,
  Pause,
  Play,
  Plus,
  SplitSquareHorizontal,
  StickyNote,
  AlertOctagon,
} from 'lucide-react'
import { useApp } from '@/store/AppStore'
import type { EvidenceType, Task, TaskType } from '@/types'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui'
import { cn, formatMinutes, todayIsoDate } from '@/lib/utils'

const TASK_TYPES: TaskType[] = ['build', 'learn', 'practice', 'review', 'career']
const FOCUS_DURATIONS = [25, 50, 90] as const
const EVIDENCE_TYPES: EvidenceType[] = [
  'github_repo',
  'commit',
  'experiment_run',
  'test_output',
  'ci_run',
  'architecture_diagram',
  'other',
]

const SUBTASKS_HEADER = '## Subtasks'

function parseSubtasks(notes: string): string[] {
  const idx = notes.indexOf(SUBTASKS_HEADER)
  if (idx === -1) return []
  return notes
    .slice(idx + SUBTASKS_HEADER.length)
    .split('\n')
    .map((l) => l.replace(/^-\s*\[[ x]\]\s*/, '').trim())
    .filter(Boolean)
}

function appendSubtask(notes: string, title: string): string {
  const base = notes.includes(SUBTASKS_HEADER)
    ? notes
    : notes.trim()
      ? `${notes.trim()}\n\n${SUBTASKS_HEADER}\n`
      : `${SUBTASKS_HEADER}\n`
  return `${base}- [ ] ${title}\n`
}

export default function TodayPage() {
  const {
    state,
    ready,
    completeTask,
    updateTask,
    addEvidence,
    attachEvidenceToTask,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    completeFocusSession,
    saveReflection,
  } = useApp()

  const today = todayIsoDate()
  const currentWeek = state.meta.currentWeek

  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all')
  const [notesTaskId, setNotesTaskId] = useState<string | null>(null)
  const [blockerTaskId, setBlockerTaskId] = useState<string | null>(null)
  const [evidenceTaskId, setEvidenceTaskId] = useState<string | null>(null)
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null)
  const [splitTaskId, setSplitTaskId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [blockerText, setBlockerText] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState(today)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [focusDuration, setFocusDuration] = useState<25 | 50 | 90>(25)
  const [focusTaskId, setFocusTaskId] = useState<string | undefined>()
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [evidenceForm, setEvidenceForm] = useState({
    title: '',
    type: 'github_repo' as EvidenceType,
    url: '',
    description: '',
  })

  const [reflection, setReflection] = useState({
    completedWork: '',
    hoursLogged: 0,
    evidenceCreated: '',
    blockers: '',
    reflection: '',
    tomorrowFirstTask: '',
  })

  const activeSession = state.studySessions.find((s) => s.status === 'active' || s.status === 'paused')

  const todayTasks = useMemo(() => {
    let tasks = state.tasks.filter(
      (t) =>
        !t.deferred &&
        t.weekNumber === currentWeek &&
        (t.scheduledDate === today || !t.scheduledDate || t.status === 'in_progress' || t.status === 'blocked'),
    )
    if (typeFilter !== 'all') tasks = tasks.filter((t) => t.type === typeFilter)
    return tasks.sort((a, b) => a.order - b.order)
  }, [state.tasks, currentWeek, today, typeFilter])

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return
    const planned = activeSession.plannedDuration * 60
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000)
      setTimerSeconds(Math.max(0, planned - elapsed))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeSession])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleStartFocus = () => {
    startFocusSession(focusDuration, focusTaskId)
  }

  const openNotes = (task: Task) => {
    setNotesTaskId(task.id)
    setNoteText(task.notes.replace(/\n## Subtasks[\s\S]*/, '').trim())
  }

  const saveNotes = () => {
    if (!notesTaskId) return
    const task = state.tasks.find((t) => t.id === notesTaskId)
    const subtasksPart = task?.notes.includes(SUBTASKS_HEADER)
      ? task.notes.slice(task.notes.indexOf(SUBTASKS_HEADER))
      : ''
    updateTask(notesTaskId, { notes: noteText.trim() + (subtasksPart ? `\n\n${subtasksPart}` : '') })
    setNotesTaskId(null)
  }

  const saveBlocker = () => {
    if (!blockerTaskId) return
    updateTask(blockerTaskId, { status: 'blocked', notes: blockerText })
    setBlockerTaskId(null)
    setBlockerText('')
  }

  const saveReschedule = () => {
    if (!rescheduleTaskId) return
    updateTask(rescheduleTaskId, { scheduledDate: rescheduleDate, status: 'planned' })
    setRescheduleTaskId(null)
  }

  const saveSubtask = () => {
    if (!splitTaskId || !subtaskTitle.trim()) return
    const task = state.tasks.find((t) => t.id === splitTaskId)
    if (!task) return
    updateTask(splitTaskId, { notes: appendSubtask(task.notes, subtaskTitle.trim()) })
    setSplitTaskId(null)
    setSubtaskTitle('')
  }

  const saveEvidence = () => {
    if (!evidenceTaskId || !evidenceForm.title.trim()) return
    const task = state.tasks.find((t) => t.id === evidenceTaskId)
    const id = addEvidence({
      title: evidenceForm.title,
      type: evidenceForm.type,
      url: evidenceForm.url || undefined,
      description: evidenceForm.description,
      date: today,
      verificationStatus: 'unverified',
      skillsDemonstrated: [],
      interviewTalkingPoints: [],
      visibility: 'private',
      notes: '',
      weekNumber: task?.weekNumber,
      projectId: task?.projectId,
      taskIds: [],
    })
    attachEvidenceToTask(evidenceTaskId, id)
    setEvidenceTaskId(null)
    setEvidenceForm({ title: '', type: 'github_repo', url: '', description: '' })
  }

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveReflection(reflection)
    setReflection({
      completedWork: '',
      hoursLogged: 0,
      evidenceCreated: '',
      blockers: '',
      reflection: '',
      tomorrowFirstTask: '',
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Today"
        description={`Week ${currentWeek} · ${new Date(today).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Daily agenda</CardTitle>
                <CardDescription>{todayTasks.length} tasks for today</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" aria-hidden />
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TaskType | 'all')}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayTasks.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No tasks scheduled — check the Roadmap.</p>
              ) : (
                todayTasks.map((task) => (
                  <article
                    key={task.id}
                    className={cn(
                      'rounded-xl border p-4 transition-colors',
                      task.status === 'completed' && 'border-success/30 bg-success/5 opacity-80',
                      task.status === 'blocked' && 'border-destructive/30 bg-destructive/5',
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{task.type}</Badge>
                          <StatusBadge status={task.status}>{STATUS_LABELS[task.status]}</StatusBadge>
                          <span className="text-xs text-muted-foreground">{formatMinutes(task.estimatedMinutes)}</span>
                        </div>
                        <h3 className="mt-1 font-medium">{task.title}</h3>
                        {parseSubtasks(task.notes).length > 0 ? (
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {parseSubtasks(task.notes).map((st) => (
                              <li key={st} className="flex items-center gap-1.5">
                                <SplitSquareHorizontal className="size-3" aria-hidden />
                                {st}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {task.status !== 'completed' ? (
                          <Button size="sm" variant="success" onClick={() => completeTask(task.id)}>
                            <CheckCircle2 className="size-3.5" aria-hidden />
                            Done
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline" onClick={() => openNotes(task)} aria-label="Add notes">
                          <StickyNote className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setBlockerTaskId(task.id)
                            setBlockerText(task.notes)
                          }}
                          aria-label="Report blocker"
                        >
                          <AlertOctagon className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEvidenceTaskId(task.id)
                            setEvidenceForm({ title: task.title, type: 'github_repo', url: '', description: '' })
                          }}
                          aria-label="Attach evidence"
                        >
                          <Link2 className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRescheduleTaskId(task.id)
                            setRescheduleDate(task.scheduledDate ?? today)
                          }}
                          aria-label="Reschedule"
                        >
                          <Calendar className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSplitTaskId(task.id)}
                          aria-label="Split into subtask"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>End-of-day reflection</CardTitle>
              <CardDescription>Capture what shipped, what blocked you, and tomorrow&apos;s first task.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReflectionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="completedWork">Completed work</Label>
                  <Textarea
                    id="completedWork"
                    value={reflection.completedWork}
                    onChange={(e) => setReflection({ ...reflection, completedWork: e.target.value })}
                    rows={2}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hoursLogged">Hours logged</Label>
                    <Input
                      id="hoursLogged"
                      type="number"
                      min={0}
                      max={16}
                      step={0.5}
                      value={reflection.hoursLogged || ''}
                      onChange={(e) => setReflection({ ...reflection, hoursLogged: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evidenceCreated">Evidence created</Label>
                    <Input
                      id="evidenceCreated"
                      value={reflection.evidenceCreated}
                      onChange={(e) => setReflection({ ...reflection, evidenceCreated: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blockers">Blockers</Label>
                  <Textarea
                    id="blockers"
                    value={reflection.blockers}
                    onChange={(e) => setReflection({ ...reflection, blockers: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reflectionNote">Reflection</Label>
                  <Textarea
                    id="reflectionNote"
                    value={reflection.reflection}
                    onChange={(e) => setReflection({ ...reflection, reflection: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tomorrowFirstTask">Tomorrow&apos;s first task</Label>
                  <Input
                    id="tomorrowFirstTask"
                    value={reflection.tomorrowFirstTask}
                    onChange={(e) => setReflection({ ...reflection, tomorrowFirstTask: e.target.value })}
                  />
                </div>
                <Button type="submit">Save reflection</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" aria-hidden />
                Focus timer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={String(focusDuration)}
                onValueChange={(v) => setFocusDuration(Number(v) as 25 | 50 | 90)}
              >
                <TabsList className="w-full">
                  {FOCUS_DURATIONS.map((d) => (
                    <TabsTrigger key={d} value={String(d)} className="flex-1">
                      {d}m
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <Select value={focusTaskId ?? 'none'} onValueChange={(v) => setFocusTaskId(v === 'none' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked task</SelectItem>
                  {todayTasks
                    .filter((t) => t.status !== 'completed')
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title.slice(0, 40)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div
                className="font-mono text-4xl font-bold tabular-nums text-center"
                role="timer"
                aria-live="polite"
              >
                {activeSession ? formatTimer(timerSeconds) : `${String(focusDuration).padStart(2, '0')}:00`}
              </div>

              <div className="flex gap-2">
                {!activeSession ? (
                  <Button className="flex-1" onClick={handleStartFocus}>
                    <Play className="size-4" aria-hidden />
                    Start
                  </Button>
                ) : (
                  <>
                    {activeSession.status === 'active' ? (
                      <Button className="flex-1" variant="outline" onClick={() => pauseFocusSession(activeSession.id)}>
                        <Pause className="size-4" aria-hidden />
                        Pause
                      </Button>
                    ) : (
                      <Button className="flex-1" variant="outline" onClick={() => resumeFocusSession(activeSession.id)}>
                        <Play className="size-4" aria-hidden />
                        Resume
                      </Button>
                    )}
                    <Button
                      className="flex-1"
                      variant="success"
                      onClick={() => completeFocusSession(activeSession.id)}
                    >
                      <CheckCircle2 className="size-4" aria-hidden />
                      Complete
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={!!notesTaskId} onOpenChange={(o) => !o && setNotesTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task notes</DialogTitle>
          </DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={5} />
          <DialogFooter>
            <Button onClick={saveNotes}>Save notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!blockerTaskId} onOpenChange={(o) => !o && setBlockerTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report blocker</DialogTitle>
            <DialogDescription>Task will be marked blocked with your notes.</DialogDescription>
          </DialogHeader>
          <Textarea value={blockerText} onChange={(e) => setBlockerText(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="destructive" onClick={saveBlocker}>
              Mark blocked
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!evidenceTaskId} onOpenChange={(o) => !o && setEvidenceTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach evidence</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={evidenceForm.title} onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={evidenceForm.type} onValueChange={(v) => setEvidenceForm({ ...evidenceForm, type: v as EvidenceType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={evidenceForm.url} onChange={(e) => setEvidenceForm({ ...evidenceForm, url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={evidenceForm.description} onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEvidence} disabled={!evidenceForm.title.trim()}>Create & attach</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rescheduleTaskId} onOpenChange={(o) => !o && setRescheduleTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule task</DialogTitle>
          </DialogHeader>
          <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
          <DialogFooter>
            <Button onClick={saveReschedule}>Save date</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!splitTaskId} onOpenChange={(o) => !o && setSplitTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add subtask</DialogTitle>
            <DialogDescription>Stored as a checklist in task notes.</DialogDescription>
          </DialogHeader>
          <Input value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} placeholder="Subtask title" />
          <DialogFooter>
            <Button onClick={saveSubtask} disabled={!subtaskTitle.trim()}>Add subtask</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
