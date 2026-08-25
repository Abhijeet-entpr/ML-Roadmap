import { evaluateExitGate } from '@/lib/rules'
import { cn, formatMinutes } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { Week } from '@/types'
import { STATUS_LABELS } from '@/types'
import { StatusBadge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react'

interface ExitGateWidgetProps {
  week: Week
  className?: string
  compact?: boolean
}

export default function ExitGateWidget({ week, className, compact }: ExitGateWidgetProps) {
  const { state } = useApp()
  const gate = evaluateExitGate(week, state.tasks, state.evidence)
  const weekTasks = state.tasks.filter((t) => t.weekNumber === week.number && !t.deferred)

  return (
    <Card className={cn('border-primary/20', className)}>
      <CardHeader className={compact ? 'p-4 pb-2' : undefined}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className={compact ? 'text-base' : undefined}>Exit gate — Week {week.number}</CardTitle>
          <StatusBadge status={gate.exitStatus}>{STATUS_LABELS[gate.exitStatus]}</StatusBadge>
        </div>
        {!compact ? (
          <CardDescription>{week.exitCriterion}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className={compact ? 'space-y-3 p-4 pt-0' : 'space-y-4'}>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Tasks</span>
          <span className="font-medium">{gate.taskCompletion}%</span>
          <span className="text-muted-foreground">
            ({weekTasks.filter((t) => t.status === 'completed').length}/{weekTasks.length})
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Required evidence</p>
          <ul className="space-y-1.5">
            {gate.requiredEvidence.map((req) => {
              const done = gate.completedEvidence.includes(req)
              return (
                <li key={req} className="flex items-start gap-2 text-sm">
                  {done ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{req}</span>
                </li>
              )
            })}
          </ul>
        </div>

        {gate.missingEvidence.length > 0 ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p>
              {gate.missingEvidence.length} evidence item{gate.missingEvidence.length > 1 ? 's' : ''} still
              missing. Attach artifacts from Today or Evidence pages.
            </p>
          </div>
        ) : null}

        {!compact && weekTasks.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Planned {formatMinutes(weekTasks.reduce((s, t) => s + t.estimatedMinutes, 0))} this week
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
