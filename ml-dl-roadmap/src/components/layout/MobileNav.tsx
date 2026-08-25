import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { getNavIcon, isNavActive, MOBILE_NAV_ITEMS, NAV_ITEMS } from './nav-items'

export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreItems = NAV_ITEMS.filter(
    (item) => !MOBILE_NAV_ITEMS.some((mobile) => mobile.href === item.href),
  )

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto grid max-w-lg grid-cols-6 gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = getNavIcon(item.icon)
            const active = isNavActive(location.pathname, item.href)

            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors',
              moreOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
            )}
            aria-label="More navigation links"
          >
            <Menu className="size-4" aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="fixed inset-x-0 bottom-0 top-auto max-h-[75vh] translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl sm:max-w-lg sm:rounded-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
          <DialogHeader>
            <DialogTitle>All sections</DialogTitle>
            <DialogDescription>Jump to any area of your launchpad.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] pr-2">
            <div className="grid gap-1">
              {moreItems.map((item) => {
                const Icon = getNavIcon(item.icon)
                const active = isNavActive(location.pathname, item.href)

                return (
                  <Button
                    key={item.href}
                    variant={active ? 'secondary' : 'ghost'}
                    className="h-11 w-full justify-start gap-3 rounded-xl"
                    onClick={() => {
                      setMoreOpen(false)
                      navigate(item.href)
                    }}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.title}
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
          <Separator />
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => {
              setMoreOpen(false)
              navigate('/settings')
            }}
          >
            Open settings
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
