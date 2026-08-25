import * as React from 'react'

import { cn } from '@/lib/utils'

function Card({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn(
        'rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm shadow-primary/5',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  )
}

function CardTitle({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { ref?: React.Ref<HTMLHeadingElement> }) {
  return (
    <h3
      ref={ref}
      data-slot="card-title"
      className={cn('font-display text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) {
  return (
    <p
      ref={ref}
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      data-slot="card-content"
      className={cn('p-6 pt-0', className)}
      {...props}
    />
  )
}

function CardFooter({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
