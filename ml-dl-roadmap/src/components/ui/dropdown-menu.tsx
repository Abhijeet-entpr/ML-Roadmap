import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function DropdownMenu(props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>,
) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuGroup(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Group>,
) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuSub(props: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuRadioGroup(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>,
) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>>
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        'flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none',
        'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent> & {
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubContent>>
}) {
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      data-slot="dropdown-menu-sub-content"
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border/60 bg-popover p-1 text-popover-foreground shadow-lg shadow-primary/10',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Content>>
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border/60 bg-popover p-1 text-popover-foreground shadow-lg shadow-primary/10',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  className,
  inset,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Item>>
}) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>>
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>>
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      data-slot="dropdown-menu-radio-item"
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Label>>
}) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      data-slot="dropdown-menu-label"
      className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator> & {
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Separator>>
}) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
