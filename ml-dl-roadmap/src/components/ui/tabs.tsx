import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

function Tabs({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Root>>
}) {
  return (
    <TabsPrimitive.Root
      ref={ref}
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.List>>
}) {
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      className={cn(
        'inline-flex h-10 w-fit items-center justify-center gap-1 rounded-xl bg-muted p-1 text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Trigger>>
}) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Content>>
}) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      data-slot="tabs-content"
      className={cn(
        'mt-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
