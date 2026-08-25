import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
} from 'lucide-react'
import {
  applicationFunnel,
  applicationWeeklyTarget,
} from '@/lib/rules'
import { createId, formatDate, todayIsoDate } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { ApplicationStatus, JobApplication } from '@/types'
import { APPLICATION_STATUS_LABELS } from '@/types'
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
  Dialog,
  DialogContent,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui'

const STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]

const KANBAN_COLUMNS: { key: ApplicationStatus[]; label: string }[] = [
  { key: ['saved', 'researching'], label: 'Research' },
  { key: ['networking', 'referral_requested'], label: 'Network' },
  { key: ['applied', 'recruiter_screen'], label: 'Applied' },
  { key: ['technical_screen', 'system_design'], label: 'Technical' },
  { key: ['hiring_manager', 'final_round'], label: 'Late stage' },
  { key: ['offer'], label: 'Offer' },
  { key: ['rejected', 'withdrawn'], label: 'Closed' },
]

const SUGGESTED_ROLES = [
  'ML Engineer',
  'Applied Scientist',
  'MLOps Engineer',
  'ML Platform Engineer',
  'Computer Vision Engineer',
  'NLP Engineer',
  'Research Engineer',
  'Data Scientist (ML-heavy)',
]

const EMPTY_APP: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'> = {
  company: '',
  roleTitle: '',
  jobUrl: '',
  location: '',
  remoteStatus: 'unspecified',
  source: '',
  dateDiscovered: todayIsoDate(),
  status: 'saved',
  resumeVersion: '',
  referralContact: '',
  recruiter: '',
  skillMatchPercent: 65,
  missingRequirements: '',
  salaryRange: '',
  interviewStages: [],
  notes: '',
  outcome: '',
}

function statusIndex(status: ApplicationStatus): number {
  return STATUSES.indexOf(status)
}

function adjacentStatus(status: ApplicationStatus, direction: 'prev' | 'next'): ApplicationStatus {
  const idx = statusIndex(status)
  const next = direction === 'next' ? idx + 1 : idx - 1
  return STATUSES[Math.max(0, Math.min(STATUSES.length - 1, next))] ?? status
}

export default function ApplicationsPage() {
  const { state, ready, upsertApplication } = useApp()
  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<JobApplication | null>(null)
  const [form, setForm] = useState(EMPTY_APP)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())

  const currentWeek = state.meta.currentWeek
  const weeklyTarget = applicationWeeklyTarget(currentWeek)

  const funnelData = useMemo(
    () =>
      applicationFunnel(state.applications)
        .filter((s) => s.count > 0)
        .map((s) => ({
          status: APPLICATION_STATUS_LABELS[s.status].slice(0, 14),
          count: s.count,
        })),
    [state.applications],
  )

  const weekStats = useMemo(() => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const recent = state.applications.filter(
      (a) => a.dateApplied && new Date(a.dateApplied) >= weekStart,
    )
    return { appliedThisWeek: recent.length }
  }, [state.applications])

  const followUpByDate = useMemo(() => {
    const map = new Map<string, JobApplication[]>()
    for (const app of state.applications) {
      if (!app.followUpDate) continue
      const list = map.get(app.followUpDate) ?? []
      list.push(app)
      map.set(app.followUpDate, list)
    }
    return map
  }, [state.applications])

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const first = new Date(year, month, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<{ date: string | null; apps: JobApplication[] }> = []
    for (let i = 0; i < startPad; i++) cells.push({ date: null, apps: [] })
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ date: iso, apps: followUpByDate.get(iso) ?? [] })
    }
    return cells
  }, [calendarMonth, followUpByDate])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_APP })
    setFormOpen(true)
  }

  const openEdit = (app: JobApplication) => {
    setEditing(app)
    setForm({
      company: app.company,
      roleTitle: app.roleTitle,
      jobUrl: app.jobUrl,
      location: app.location,
      remoteStatus: app.remoteStatus,
      source: app.source,
      dateDiscovered: app.dateDiscovered,
      dateApplied: app.dateApplied,
      status: app.status,
      resumeVersion: app.resumeVersion,
      referralContact: app.referralContact,
      recruiter: app.recruiter,
      skillMatchPercent: app.skillMatchPercent,
      missingRequirements: app.missingRequirements,
      salaryRange: app.salaryRange,
      interviewStages: app.interviewStages,
      followUpDate: app.followUpDate,
      notes: app.notes,
      outcome: app.outcome,
    })
    setFormOpen(true)
  }

  const handleSave = () => {
    const app: JobApplication = {
      ...form,
      id: editing?.id ?? createId(),
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    upsertApplication(app)
    setFormOpen(false)
  }

  const moveStatus = (app: JobApplication, direction: 'prev' | 'next') => {
    upsertApplication({
      ...app,
      status: adjacentStatus(app.status, direction),
    })
  }

  const matchGuidance =
    form.skillMatchPercent >= 60 && form.skillMatchPercent <= 70
      ? 'Ideal range: selective applications where you can speak to most requirements.'
      : form.skillMatchPercent < 60
        ? 'Below 60%: likely a stretch role — prioritize skill gaps before applying.'
        : 'Above 70%: strong match — highlight project evidence that maps to JD keywords.'

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
        title="Applications"
        description="Track selective job search — portfolio projects demonstrate capability but are not professional ML employment."
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" aria-hidden />
            Add application
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly targets</CardTitle>
            <CardDescription>Week {currentWeek}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Applications: <strong>{weeklyTarget.applications}</strong> (this week: {weekStats.appliedThisWeek})</p>
            <p>Referrals: <strong>{weeklyTarget.referrals}</strong></p>
            <p>Networking: <strong>{weeklyTarget.networking}</strong></p>
            <p className="pt-2 text-muted-foreground">{weeklyTarget.guidance}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Role match guidance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Target <strong className="text-foreground">60–70%</strong> skill match for selective applications.</p>
            <p className="mt-2">Apply when you can defend project evidence for most listed requirements — not when every bullet matches.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Suggested role titles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-1">
              {SUGGESTED_ROLES.map((role) => (
                <li key={role}>
                  <Badge variant="outline">{role}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {funnelData.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Application funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    width={75}
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList className="mb-4">
          <TabsTrigger value="kanban">
            <LayoutGrid className="mr-1 size-4" aria-hidden />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="table">
            <List className="mr-1 size-4" aria-hidden />
            Table
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="mr-1 size-4" aria-hidden />
            Follow-ups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          {state.applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Add your first targeted role when readiness criteria are met."
              action={{ label: 'Add application', onClick: openNew }}
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {KANBAN_COLUMNS.map((col) => {
                const apps = state.applications.filter((a) => col.key.includes(a.status))
                return (
                  <div
                    key={col.label}
                    className="min-w-[240px] shrink-0 rounded-xl border border-border/60 bg-muted/30 p-3"
                  >
                    <h3 className="mb-3 text-sm font-semibold">
                      {col.label}
                      <Badge variant="secondary" className="ml-2">{apps.length}</Badge>
                    </h3>
                    <ul className="space-y-2">
                      {apps.map((app) => (
                        <li key={app.id} className="rounded-lg border border-border bg-card p-3">
                          <p className="font-medium">{app.company}</p>
                          <p className="text-sm text-muted-foreground">{app.roleTitle}</p>
                          <Badge variant="outline" className="mt-2">{app.skillMatchPercent}% match</Badge>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Button size="sm" variant="ghost" onClick={() => moveStatus(app, 'prev')} aria-label="Move to previous status">
                              ←
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => moveStatus(app, 'next')} aria-label="Move to next status">
                              →
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEdit(app)}>
                              Edit
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          {state.applications.length === 0 ? (
            <EmptyState title="No applications" description="Start tracking selective applications here." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="p-3 font-medium">Company</th>
                    <th className="p-3 font-medium">Role</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Match</th>
                    <th className="p-3 font-medium">Applied</th>
                    <th className="p-3 font-medium">Follow-up</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {state.applications.map((app) => (
                    <tr key={app.id} className="border-b border-border/50">
                      <td className="p-3">{app.company}</td>
                      <td className="p-3">{app.roleTitle}</td>
                      <td className="p-3">{APPLICATION_STATUS_LABELS[app.status]}</td>
                      <td className="p-3">{app.skillMatchPercent}%</td>
                      <td className="p-3">{formatDate(app.dateApplied)}</td>
                      <td className="p-3">{formatDate(app.followUpDate)}</td>
                      <td className="p-3">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(app)}>Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Follow-up calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[140px] text-center text-sm font-medium">
                  {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>
                ))}
                {calendarDays.map((cell, i) => (
                  <div
                    key={i}
                    className={`min-h-[72px] rounded-lg border p-1 ${
                      cell.date ? 'border-border/60 bg-card' : 'border-transparent'
                    }`}
                  >
                    {cell.date ? (
                      <>
                        <span className="text-muted-foreground">{Number(cell.date.slice(8))}</span>
                        {cell.apps.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            className="mt-1 block w-full truncate rounded bg-primary/10 px-1 text-left text-[10px] text-primary hover:bg-primary/20"
                            onClick={() => openEdit(a)}
                          >
                            {a.company}
                          </button>
                        ))}
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit application' : 'Add application'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleTitle">Role title</Label>
              <Input id="roleTitle" value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jobUrl">Job URL</Label>
              <Input id="jobUrl" type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remoteStatus">Remote status</Label>
              <Select value={form.remoteStatus} onValueChange={(v) => setForm({ ...form, remoteStatus: v as JobApplication['remoteStatus'] })}>
                <SelectTrigger id="remoteStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['remote', 'hybrid', 'onsite', 'unspecified'] as const).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ApplicationStatus })}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateDiscovered">Date discovered</Label>
              <Input id="dateDiscovered" type="date" value={form.dateDiscovered} onChange={(e) => setForm({ ...form, dateDiscovered: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateApplied">Date applied</Label>
              <Input id="dateApplied" type="date" value={form.dateApplied ?? ''} onChange={(e) => setForm({ ...form, dateApplied: e.target.value || undefined })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpDate">Follow-up date</Label>
              <Input id="followUpDate" type="date" value={form.followUpDate ?? ''} onChange={(e) => setForm({ ...form, followUpDate: e.target.value || undefined })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillMatch">Skill match %</Label>
              <Input
                id="skillMatch"
                type="number"
                min={0}
                max={100}
                value={form.skillMatchPercent}
                onChange={(e) => setForm({ ...form, skillMatchPercent: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">{matchGuidance}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resumeVersion">Resume version</Label>
              <Input id="resumeVersion" value={form.resumeVersion} onChange={(e) => setForm({ ...form, resumeVersion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralContact">Referral contact</Label>
              <Input id="referralContact" value={form.referralContact} onChange={(e) => setForm({ ...form, referralContact: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiter">Recruiter</Label>
              <Input id="recruiter" value={form.recruiter} onChange={(e) => setForm({ ...form, recruiter: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryRange">Salary range</Label>
              <Input id="salaryRange" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="missingRequirements">Missing requirements</Label>
              <Textarea id="missingRequirements" value={form.missingRequirements} onChange={(e) => setForm({ ...form, missingRequirements: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="interviewStages">Interview stages (comma-separated)</Label>
              <Input
                id="interviewStages"
                value={form.interviewStages.join(', ')}
                onChange={(e) => setForm({ ...form, interviewStages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Input id="outcome" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
