import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getNavIcon, isNavActive, NAV_ITEMS } from './nav-items'

const SIDEBAR_STORAGE_KEY = 'ml-launchpad-sidebar-collapsed'

export interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
}

export function Sidebar({ collapsed: controlledCollapsed, onCollapsedChange, className }: SidebarProps) {
  const location = useLocation()
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  })

  const collapsed = controlledCollapsed ?? internalCollapsed

  const setCollapsed = (value: boolean) => {
    if (onCollapsedChange) onCollapsedChange(value)
    else setInternalCollapsed(value)
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value))
  }

  useEffect(() => {
    if (controlledCollapsed === undefined) return
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(controlledCollapsed))
  }, [controlledCollapsed])

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className={cn(
          'hidden h-full shrink-0 flex-col border-r border-border/60 bg-card/80 backdrop-blur-md lg:flex',
          className,
        )}
        aria-label="Main navigation"
      >
        <div className={cn('flex h-16 items-center gap-3 px-3', collapsed ? 'justify-center' : 'px-4')}>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Rocket className="size-5" aria-hidden="true" />
          </div>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="min-w-0 flex-1"
            >
              <p className="truncate font-display text-sm font-semibold leading-tight">ML Engineer Launchpad</p>
              <p className="truncate text-xs text-muted-foreground">12-week capability plan</p>
            </motion.div>
          ) : (
            <span className="sr-only">ML Engineer Launchpad</span>
          )}
        </div>

        <Separator className="opacity-60" />

        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = getNavIcon(item.icon)
              const active = isNavActive(location.pathname, item.href)

              const link = (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center px-2',
                  )}
                >
                  <Icon
                    className={cn('size-4 shrink-0', active && 'text-primary')}
                    aria-hidden="true"
                  />
                  {!collapsed ? <span className="truncate">{item.title}</span> : null}
                  {collapsed ? <span className="sr-only">{item.title}</span> : null}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                )
              }

              return link
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-border/60 p-2">
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'md'}
            className={cn('w-full', !collapsed && 'justify-start')}
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
