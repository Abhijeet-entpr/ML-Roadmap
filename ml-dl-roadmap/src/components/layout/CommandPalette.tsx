import { useEffect, useMemo, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command as CommandPrimitive } from 'cmdk'
import {
  Archive,
  BookOpen,
  Briefcase,
  Clock,
  Library,
  Map,
  Mic,
  Network,
  PenLine,
  Search,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getNavIcon, NAV_ITEMS } from './nav-items'

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { state, startFocusSession } = useApp()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  const run = (callback: () => void) => {
    onOpenChange(false)
    callback()
  }

  const resourceMatches = useMemo(
    () => state.resources.slice(0, 8),
    [state.resources],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>Search commands and navigate anywhere in the app.</DialogDescription>
        </DialogHeader>

        <CommandPrimitive
          className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground"
          loop
        >
          <div className="flex items-center border-b border-border/60 px-3">
            <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              placeholder="Type a command or search…"
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <CommandPrimitive.List className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
            <CommandPrimitive.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </CommandPrimitive.Empty>

            <CommandGroup heading="Actions">
              <CommandItem
                icon={PenLine}
                onSelect={() => run(() => navigate('/today?action=task'))}
              >
                Add task
              </CommandItem>
              <CommandItem
                icon={Clock}
                onSelect={() => run(() => navigate('/today?action=study-session'))}
              >
                Log study session
              </CommandItem>
              <CommandItem
                icon={Timer}
                onSelect={() => run(() => startFocusSession(25))}
              >
                Start focus timer
              </CommandItem>
              <CommandItem
                icon={Map}
                onSelect={() => run(() => navigate(`/roadmap?week=${state.meta.currentWeek}`))}
              >
                Open current week
              </CommandItem>
              <CommandItem
                icon={Archive}
                onSelect={() => run(() => navigate('/evidence?action=add'))}
              >
                Add evidence
              </CommandItem>
              <CommandItem
                icon={Mic}
                onSelect={() => run(() => navigate('/interviews?action=new'))}
              >
                Start mock interview
              </CommandItem>
              <CommandItem
                icon={Network}
                onSelect={() => run(() => navigate('/system-design?action=new'))}
              >
                Create system-design response
              </CommandItem>
              <CommandItem
                icon={Briefcase}
                onSelect={() => run(() => navigate('/applications?action=add'))}
              >
                Add job application
              </CommandItem>
              <CommandItem
                icon={Library}
                onSelect={() => run(() => navigate('/resources'))}
              >
                Search resources
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Navigate">
              {NAV_ITEMS.map((item) => {
                const Icon = getNavIcon(item.icon)
                return (
                  <CommandItem
                    key={item.href}
                    icon={Icon}
                    onSelect={() => run(() => navigate(item.href))}
                  >
                    {item.title}
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {resourceMatches.length > 0 ? (
              <CommandGroup heading="Resources">
                {resourceMatches.map((resource) => (
                  <CommandItem
                    key={resource.id}
                    icon={BookOpen}
                    onSelect={() => run(() => navigate(`/resources?highlight=${resource.id}`))}
                  >
                    {resource.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  )
}

function CommandGroup({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <CommandPrimitive.Group heading={heading} className="overflow-hidden px-1 py-2">
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>
      <div className="space-y-0.5">{children}</div>
    </CommandPrimitive.Group>
  )
}

function CommandItem({
  icon: Icon,
  children,
  onSelect,
}: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  onSelect: () => void
}) {
  return (
    <CommandPrimitive.Item
      value={String(children)}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none',
        'aria-selected:bg-accent aria-selected:text-accent-foreground',
        'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>{children}</span>
    </CommandPrimitive.Item>
  )
}
