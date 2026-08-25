import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Download, Save } from 'lucide-react'
import { toast } from 'sonner'
import { createId, debounce, downloadText, nowIso } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { SystemDesignResponse } from '@/types'
import PageHeader from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Textarea,
} from '@/components/ui'

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function buildMarkdown(
  title: string,
  prompt: string,
  sections: Record<string, string>,
  mermaidDiagram: string,
  checklist: Record<string, boolean>,
): string {
  const lines = [
    `# ${title}`,
    '',
    '## Prompt',
    prompt,
    '',
    '## Response',
    ...Object.entries(sections).flatMap(([section, content]) => [
      `### ${section}`,
      content || '_Not filled_',
      '',
    ]),
    '## Architecture diagram (Mermaid)',
    '```mermaid',
    mermaidDiagram || '%% Add your diagram here',
    '```',
    '',
    '## Checklist',
    ...Object.entries(checklist).map(([item, done]) => `- [${done ? 'x' : ' '}] ${item}`),
  ]
  return lines.join('\n')
}

export default function SystemDesignExercisePage() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const { state, ready, saveSystemDesignResponse } = useApp()

  const exercise = useMemo(
    () => state.systemDesignExercises.find((e) => e.id === exerciseId),
    [state.systemDesignExercises, exerciseId],
  )

  const existingResponse = useMemo(
    () => state.systemDesignResponses.find((r) => r.exerciseId === exerciseId),
    [state.systemDesignResponses, exerciseId],
  )

  const [draft, setDraft] = useState<SystemDesignResponse | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const draftRef = useRef<SystemDesignResponse | null>(null)
  const timerRef = useRef(0)

  useEffect(() => {
    if (!exercise) return
    if (existingResponse) {
      setDraft(existingResponse)
      setTimerSeconds(existingResponse.timerSeconds)
    } else {
      const initial: SystemDesignResponse = {
        id: createId(),
        exerciseId: exercise.id,
        sections: Object.fromEntries(exercise.rubric.map((s) => [s, ''])),
        mermaidDiagram: 'graph TD\n  A[Client] --> B[API Gateway]\n  B --> C[Model Service]',
        checklist: Object.fromEntries(exercise.rubric.map((s) => [s, false])),
        timerSeconds: 0,
        version: 0,
        notes: '',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      setDraft(initial)
    }
  }, [exercise, existingResponse])

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    timerRef.current = timerSeconds
  }, [timerSeconds])

  const persist = useCallback(
    (response: SystemDesignResponse) => {
      saveSystemDesignResponse({
        ...response,
        timerSeconds: timerRef.current,
        updatedAt: nowIso(),
      })
      setLastSaved(new Date().toLocaleTimeString())
    },
    [saveSystemDesignResponse],
  )

  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        const current = draftRef.current
        if (current) persist(current)
      }, 500),
    [persist],
  )

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setTimerSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  useEffect(() => {
    if (draft) debouncedSave()
  }, [draft, debouncedSave])

  const handleSectionChange = (section: string, value: string) => {
    if (!draft) return
    setDraft({ ...draft, sections: { ...draft.sections, [section]: value } })
  }

  const handleChecklistChange = (item: string, checked: boolean) => {
    if (!draft) return
    setDraft({ ...draft, checklist: { ...draft.checklist, [item]: checked } })
  }

  const handleManualSave = () => {
    if (!draft) return
    persist({ ...draft, timerSeconds })
    toast.success('Response saved.')
  }

  const handleExport = () => {
    if (!draft || !exercise) return
    const md = buildMarkdown(
      exercise.title,
      exercise.prompt,
      draft.sections,
      draft.mermaidDiagram,
      draft.checklist,
    )
    const slug = exercise.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    downloadText(`${slug}-system-design.md`, md, 'text/markdown')
    toast.success('Markdown exported.')
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground" role="status">
          Loading…
        </p>
      </div>
    )
  }

  if (!state.profile?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  if (!exercise || !draft) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Exercise not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/system-design">Back to System Design</Link>
        </Button>
      </div>
    )
  }

  const checkedCount = Object.values(draft.checklist).filter(Boolean).length

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/system-design">
          <ArrowLeft className="size-4" aria-hidden />
          System Design
        </Link>
      </Button>

      <PageHeader
        title={exercise.title}
        description={exercise.prompt}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 font-mono text-sm">
              <Clock className="size-4 text-muted-foreground" aria-hidden />
              <span aria-live="polite">{formatTimer(timerSeconds)}</span>
              <Button size="sm" variant="outline" onClick={() => setTimerRunning((r) => !r)}>
                {timerRunning ? 'Pause' : 'Start'}
              </Button>
            </div>
            <Badge variant="secondary">v{Math.max(draft.version, 1)}</Badge>
            {lastSaved ? (
              <span className="text-xs text-muted-foreground">Saved {lastSaved}</span>
            ) : null}
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Constraints</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {exercise.constraints.map((c) => (
              <Badge key={c} variant="outline">
                {c}
              </Badge>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={handleManualSave}>
          <Save className="size-4" aria-hidden />
          Save now
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" aria-hidden />
          Export Markdown
        </Button>
        <Badge variant="outline" className="self-center">
          Checklist {checkedCount}/{exercise.rubric.length}
        </Badge>
      </div>

      <div className="space-y-6">
        {exercise.rubric.map((section, index) => (
          <Card key={section}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    Step {index + 1}
                  </Badge>
                  <CardTitle className="text-base">{section}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`check-${section}`}
                    checked={draft.checklist[section] ?? false}
                    onCheckedChange={(checked) =>
                      handleChecklistChange(section, checked === true)
                    }
                  />
                  <Label htmlFor={`check-${section}`} className="cursor-pointer text-xs">
                    Done
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={`Your response for "${section}"…`}
                value={draft.sections[section] ?? ''}
                onChange={(e) => handleSectionChange(section, e.target.value)}
                rows={5}
              />
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Architecture diagram (Mermaid)</CardTitle>
            <CardDescription>
              Sketch your architecture. Paste valid Mermaid syntax.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="graph TD&#10;  A --> B"
              value={draft.mermaidDiagram}
              onChange={(e) => setDraft({ ...draft, mermaidDiagram: e.target.value })}
              rows={10}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Assumptions, open questions, follow-ups…"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
