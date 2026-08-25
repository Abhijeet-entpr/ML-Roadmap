import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  AlertTriangle,
  ExternalLink,
  Search,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '@/store/AppStore'
import { safeExternalUrl } from '@/lib/utils'
import PageHeader from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/layout/EmptyState'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui'

type SearchResult =
  | { kind: 'resource'; id: string; title: string; subtitle: string; href: string; external?: boolean }
  | { kind: 'task'; id: string; title: string; subtitle: string; href: string }
  | { kind: 'project'; id: string; title: string; subtitle: string; href: string }
  | { kind: 'evidence'; id: string; title: string; subtitle: string; href: string }

export default function ResourcesPage() {
  const { state, ready } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('search') ?? ''
  const [localQuery, setLocalQuery] = useState(query)

  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  const normalizedQuery = query.trim().toLowerCase()

  const filteredResources = useMemo(() => {
    if (!normalizedQuery) return state.resources
    return state.resources.filter(
      (r) =>
        r.title.toLowerCase().includes(normalizedQuery) ||
        r.description.toLowerCase().includes(normalizedQuery) ||
        r.category.toLowerCase().includes(normalizedQuery),
    )
  }, [state.resources, normalizedQuery])

  const globalResults = useMemo((): SearchResult[] => {
    if (!normalizedQuery) return []
    const results: SearchResult[] = []

    for (const r of state.resources) {
      if (
        r.title.toLowerCase().includes(normalizedQuery) ||
        r.description.toLowerCase().includes(normalizedQuery)
      ) {
        const url = safeExternalUrl(r.url)
        results.push({
          kind: 'resource',
          id: r.id,
          title: r.title,
          subtitle: r.category,
          href: url ?? r.url,
          external: !!url,
        })
      }
    }

    for (const t of state.tasks) {
      if (
        t.title.toLowerCase().includes(normalizedQuery) ||
        t.description.toLowerCase().includes(normalizedQuery)
      ) {
        results.push({
          kind: 'task',
          id: t.id,
          title: t.title,
          subtitle: `Week ${t.weekNumber} · ${t.track}`,
          href: `/roadmap/week/${t.weekNumber}`,
        })
      }
    }

    for (const p of state.projects) {
      if (
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.problem.toLowerCase().includes(normalizedQuery)
      ) {
        results.push({
          kind: 'project',
          id: p.id,
          title: p.name,
          subtitle: `Phase ${p.phaseNumber}`,
          href: `/projects/${p.id}`,
        })
      }
    }

    for (const e of state.evidence) {
      if (
        e.title.toLowerCase().includes(normalizedQuery) ||
        e.description.toLowerCase().includes(normalizedQuery)
      ) {
        results.push({
          kind: 'evidence',
          id: e.id,
          title: e.title,
          subtitle: e.type.replace(/_/g, ' '),
          href: '/evidence',
        })
      }
    }

    return results.slice(0, 30)
  }, [state, normalizedQuery])

  const groupedResources = useMemo(() => {
    const map = new Map<string, typeof filteredResources>()
    for (const r of filteredResources) {
      const list = map.get(r.category) ?? []
      list.push(r)
      map.set(r.category, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filteredResources])

  const handleSearch = (value: string) => {
    setLocalQuery(value)
    if (value.trim()) {
      setSearchParams({ search: value.trim() })
    } else {
      setSearchParams({})
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground" role="status">Loading…</p>
      </div>
    )
  }

  if (!state.profile?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Resources"
        description="Curated learning links, documentation, and global search across your plan."
      />

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="pl-10"
          placeholder="Search resources, tasks, projects, evidence…"
          value={localQuery}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search resources and content"
        />
      </div>

      {normalizedQuery && globalResults.length > 0 ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Global search results</CardTitle>
            <CardDescription>{globalResults.length} matches for &ldquo;{query}&rdquo;</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {globalResults.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  {item.kind === 'resource' && item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      </div>
                      <Badge variant="outline">
                        {item.kind}
                        <ExternalLink className="ml-1 size-3" aria-hidden />
                        <span className="sr-only"> (opens in new tab)</span>
                      </Badge>
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      </div>
                      <Badge variant="secondary">{item.kind}</Badge>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : normalizedQuery ? (
        <EmptyState
          className="mb-8"
          title="No matches"
          description={`Nothing found for "${query}". Try a broader term.`}
        />
      ) : null}

      {groupedResources.length === 0 && !normalizedQuery ? (
        <EmptyState title="No resources" description="Resources will appear here from your curriculum." />
      ) : (
        <div className="space-y-8">
          {groupedResources.map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-4 font-display text-xl font-semibold">{category}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((resource) => {
                  const url = safeExternalUrl(resource.url)
                  return (
                    <li key={resource.id}>
                      <Card className="h-full">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{resource.title}</CardTitle>
                            {resource.official ? (
                              <Badge variant="success">Official</Badge>
                            ) : null}
                          </div>
                          <CardDescription>{resource.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              Open link
                              <ExternalLink className="size-3" aria-hidden />
                              <Badge variant="outline" className="ml-1">external</Badge>
                              <span className="sr-only"> (opens in new tab)</span>
                            </a>
                          ) : (
                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                              <AlertTriangle className="size-3" aria-hidden />
                              Invalid URL
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
