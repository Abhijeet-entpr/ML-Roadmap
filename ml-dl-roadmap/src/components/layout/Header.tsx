import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  Flame,
  Mic,
  Monitor,
  Moon,
  Plus,
  Search,
  StickyNote,
  Sun,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface HeaderProps {
  onSearch?: (query: string) => void
  onOpenCommandPalette?: () => void
  className?: string
}

const THEME_CYCLE: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']

function getInitials(name?: string): string {
  if (!name) return 'ML'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Header({ onSearch, onOpenCommandPalette, className }: HeaderProps) {
  const navigate = useNavigate()
  const { state, setTheme, markNotificationRead } = useApp()
  const [searchQuery, setSearchQuery] = useState('')

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications],
  )

  const currentTheme = state.preferences?.theme ?? 'system'
  const profileName = state.profile?.currentRole ?? 'ML Engineer'
  const currentWeek = state.meta.currentWeek

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    if (onSearch) {
      onSearch(query)
      return
    }
    navigate(`/resources?search=${encodeURIComponent(query)}`)
  }

  const cycleTheme = () => {
    const index = THEME_CYCLE.indexOf(currentTheme)
    const next = THEME_CYCLE[(index + 1) % THEME_CYCLE.length]
    setTheme(next)
  }

  const ThemeIcon =
    currentTheme === 'dark' ? Moon : currentTheme === 'light' ? Sun : Monitor

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md lg:px-6',
        className,
      )}
    >
      <form onSubmit={handleSearchSubmit} className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tasks, resources, evidence…"
          className="h-10 rounded-xl border-border/60 bg-card/70 pl-9 pr-24"
          aria-label="Global search"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 hidden h-8 -translate-y-1/2 text-xs text-muted-foreground md:inline-flex"
          onClick={onOpenCommandPalette}
        >
          <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </Button>
      </form>

      <Button
        variant="outline"
        size="sm"
        className="sm:hidden"
        onClick={onOpenCommandPalette}
        aria-label="Open command palette"
      >
        <Search className="size-4" />
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="secondary" className="hidden gap-1.5 rounded-xl px-2.5 py-1 md:inline-flex">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Week {currentWeek}
        </Badge>

        <Badge variant="outline" className="hidden gap-1.5 rounded-xl px-2.5 py-1 sm:inline-flex">
          <Flame className="size-3.5 text-amber-500" aria-hidden="true" />
          {state.meta.streak} day streak
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Notifications">
              <Bell className="size-4" />
              {unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unreadCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => {
                    state.notifications
                      .filter((n) => !n.read)
                      .forEach((n) => markNotificationRead(n.id))
                  }}
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </Button>
              ) : null}
            </div>
            <DropdownMenuSeparator />
            <ScrollArea className="max-h-80">
              {state.notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                state.notifications.slice(0, 12).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      'cursor-pointer flex-col items-start gap-1 rounded-none px-4 py-3',
                      !notification.read && 'bg-primary/5',
                    )}
                    onClick={() => {
                      markNotificationRead(notification.id)
                      if (notification.href) navigate(notification.href)
                    }}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="text-sm font-medium">{notification.title}</span>
                      {!notification.read ? (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                      ) : null}
                    </div>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</span>
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={cycleTheme}
          aria-label={`Theme: ${currentTheme}. Click to cycle.`}
        >
          <ThemeIcon className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="hidden h-10 gap-2 rounded-xl px-2 sm:inline-flex">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{getInitials(profileName)}</AvatarFallback>
              </Avatar>
              <span className="max-w-[120px] truncate text-sm">{profileName}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="size-4" />
              Profile & settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/readiness')}>
              <ClipboardList className="size-4" />
              Readiness report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/analytics')}>
              <CalendarDays className="size-4" />
              Analytics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5">
              <Plus className="size-4" />
              <span className="hidden md:inline">Quick add</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl">
            <DropdownMenuLabel>Create</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/today?action=task')}>
              <StickyNote className="size-4" />
              Add task note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/evidence?action=add')}>
              <ClipboardList className="size-4" />
              Add evidence
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/applications?action=add')}>
              <Briefcase className="size-4" />
              Add application
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/interview-lab?action=new')}>
              <Mic className="size-4" />
              Start mock
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
