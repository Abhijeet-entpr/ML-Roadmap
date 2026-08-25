import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
      {children}
    </div>
  )
}
