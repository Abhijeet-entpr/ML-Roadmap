import { useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { CommandPalette } from './CommandPalette'
import { Header } from './Header'
import { LoadingScreen } from './LoadingScreen'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

const QUICK_NOTES_KEY = 'ml-launchpad-quick-notes'

export interface AppShellProps {
  showRightPanel?: boolean
  className?: string
}

export function AppShell({ showRightPanel = true, className }: AppShellProps) {
  const navigate = useNavigate()
  const { ready, state } = useApp()
  const [commandOpen, setCommandOpen] = useState(false)
  const [quickNotes, setQuickNotes] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(QUICK_NOTES_KEY) ?? ''
  })

  useEffect(() => {
    window.localStorage.setItem(QUICK_NOTES_KEY, quickNotes)
  }, [quickNotes])

  const currentWeek = state.meta.currentWeek
  const weekData = useMemo(
    () => state.weeks.find((week) => week.number === currentWeek),
    [state.weeks, currentWeek],
  )

  const topTasks = useMemo(
    () =>
      state.tasks
        .filter(
          (task) =>
            task.weekNumber === currentWeek &&
            task.status !== 'completed' &&
            task.status !== 'skipped',
        )
        .sort((a, b) => a.order - b.order)
        .slice(0, 3),
    [state.tasks, currentWeek],
  )

  if (!ready) {
    return <LoadingScreen />
  }

  return (
    <div className={cn('flex min-h-screen bg-background', className)}>
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onSearch={(query) => navigate(`/resources?search=${encodeURIComponent(query)}`)}
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-auto pb-24 lg:pb-6">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6"
            >
              <Outlet />
            </motion.div>
          </main>

          {showRightPanel ? (
            <aside className="hidden w-80 shrink-0 border-l border-border/60 bg-card/40 xl:block">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  <Card className="border-border/60 shadow-none">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">Current week</CardTitle>
                        <Badge variant="secondary">Week {currentWeek}</Badge>
                      </div>
                      <CardDescription>{weekData?.title ?? 'Weekly objective'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2 rounded-xl bg-primary/5 p-3">
                        <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <p className="text-sm leading-relaxed text-foreground/90">
                          {weekData?.objective ?? 'Define your weekly objective from the roadmap.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Top tasks</CardTitle>
                      <CardDescription>Next incomplete items this week</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {topTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No open tasks for this week.</p>
                      ) : (
                        topTasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => navigate('/today')}
                            className="flex w-full items-start gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                          >
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <span className="line-clamp-2">{task.title}</span>
                          </button>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Quick notes</CardTitle>
                      <CardDescription>Scratchpad saved locally on this device</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={quickNotes}
                        onChange={(event) => setQuickNotes(event.target.value)}
                        placeholder="Capture ideas, blockers, or interview prompts…"
                        className="min-h-[140px] resize-none bg-background/70"
                        aria-label="Quick notes"
                      />
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </aside>
          ) : null}
        </div>
      </div>

      <MobileNav />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      <Separator className="sr-only" />
    </div>
  )
}
