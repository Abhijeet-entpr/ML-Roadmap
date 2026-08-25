import { NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, LayoutDashboard, Map, Rocket, SunMoon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import { Button } from '@/components/ui'

const navItems = [
  { to: '/today', label: 'Today', icon: CalendarDays },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
]

export default function AppLayout() {
  const { state, setTheme } = useApp()
  const theme = state.preferences?.theme ?? 'system'

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'] as const
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % order.length])
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-display font-semibold text-foreground">
            <Rocket className="size-5 text-primary" aria-hidden />
            <span>ML Launchpad</span>
          </NavLink>

          {state.profile?.onboardingComplete ? (
            <nav aria-label="Main navigation" className="hidden items-center gap-1 sm:flex">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )
                  }
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </NavLink>
              ))}
            </nav>
          ) : null}

          <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label={`Theme: ${theme}. Click to change.`}>
            <SunMoon className="size-4" aria-hidden />
          </Button>
        </div>

        {state.profile?.onboardingComplete ? (
          <nav aria-label="Mobile navigation" className="flex border-t border-border/40 sm:hidden">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </header>

      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
