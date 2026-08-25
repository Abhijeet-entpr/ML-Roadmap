import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export default PageHeader
