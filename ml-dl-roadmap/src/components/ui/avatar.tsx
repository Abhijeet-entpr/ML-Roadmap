import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

function Avatar({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>>
}) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      data-slot="avatar"
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-border/60',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Image>>
}) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Fallback>>
}) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
