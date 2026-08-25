import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Today', href: '/today', icon: 'Sun' },
  { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { title: 'Roadmap', href: '/roadmap', icon: 'Map' },
  { title: 'Projects', href: '/projects', icon: 'FolderKanban' },
  { title: 'Learn', href: '/learn', icon: 'GraduationCap' },
  { title: 'Practice', href: '/practice', icon: 'Dumbbell' },
  { title: 'Interview Lab', href: '/interviews', icon: 'Mic' },
  { title: 'System Design', href: '/system-design', icon: 'Network' },
  { title: 'Goodfellow Plan', href: '/goodfellow', icon: 'BookOpen' },
  { title: 'Evidence Vault', href: '/evidence', icon: 'Archive' },
  { title: 'Applications', href: '/applications', icon: 'Briefcase' },
  { title: 'Resume', href: '/resume', icon: 'FileText' },
  { title: 'Readiness', href: '/readiness', icon: 'Target' },
  { title: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { title: 'Resources', href: '/resources', icon: 'Library' },
  { title: 'Settings', href: '/settings', icon: 'Settings' },
]

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ['Today', 'Dashboard', 'Roadmap', 'Projects', 'Practice'].includes(item.title),
)

export function getNavIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>
  return icons[name] ?? LucideIcons.Circle
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/today') return pathname === '/today' || pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
