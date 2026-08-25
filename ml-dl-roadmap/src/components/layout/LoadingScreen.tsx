import { Loader2, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingScreenProps {
  message?: string
  className?: string
}

export function LoadingScreen({
  message = 'Loading your launchpad…',
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-lg shadow-primary/10">
        <Rocket className="size-7 text-primary" aria-hidden="true" />
        <Loader2
          className="absolute -right-1 -top-1 size-5 animate-spin text-primary"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-2 text-center">
        <p className="font-display text-lg font-semibold tracking-tight">ML Engineer Launchpad</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  )
}
