import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Copy, Download, FileText, GitBranch, Mail, Save, Share2 } from 'lucide-react'
import { downloadText } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from '@/components/ui'

const POSITIONING_KEY = 'ml-launchpad-positioning'
const GITHUB_CHECKLIST_KEY = 'ml-launchpad-github-checklist'

const DEFAULT_POSITIONING =
  'Software engineer with three years of experience building reliable applications, specializing in production-oriented ML systems using Python, PyTorch, Transformers, FastAPI, Docker, MLflow, CI/CD, and Azure.'

const METRIC_PLACEHOLDERS = [
  '[macro-F1]',
  '[p95 latency]',
  '[Recall@5]',
  '[test coverage %]',
  '[deployment uptime in staging]',
  '[CI pass rate]',
]

const GITHUB_CHECKLIST_ITEMS = [
  'Root README with problem, metrics, and setup',
  'Architecture diagram linked or embedded',
  'Reproducible environment (Docker or lockfile)',
  'Makefile or scripts for train / test / serve',
  'CI badge and passing workflow',
  'Model card or evaluation summary',
  'Tagged release with changelog',
  'License file present',
  'No secrets in git history (scan completed)',
  'Issue templates or contribution guide',
]

const README_SECTIONS = [
  'Problem and users',
  'Dataset and validation approach',
  'Baseline and main model',
  'Evaluation metrics (with measured values)',
  'Error analysis summary',
  'API contract and local run instructions',
  'Docker build and test commands',
  'CI/CD overview',
  'Monitoring and rollback plan',
  'Limitations and next steps',
]

const DEFAULT_BULLETS = [
  'Built a production-style {project} achieving {macro-F1} macro-F1 with {baseline} → {model} improvement, containerized with Docker and validated via CI.',
  'Deployed {service} to a managed endpoint with {p95 latency} p95 latency target met in load tests (staging environment).',
  'Implemented experiment tracking with MLflow, reducing experiment reproduction time and enabling model version rollback.',
]

export default function ResumePage() {
  const { state, ready, addEvidence } = useApp()
  const [positioning, setPositioning] = useState(DEFAULT_POSITIONING)
  const [bullets, setBullets] = useState<string[]>(DEFAULT_BULLETS)
  const [newBullet, setNewBullet] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('project-ticket-intel')
  const [githubChecks, setGithubChecks] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(POSITIONING_KEY)
    if (saved) setPositioning(saved)
    const checks = localStorage.getItem(GITHUB_CHECKLIST_KEY)
    if (checks) {
      try {
        setGithubChecks(JSON.parse(checks) as Record<string, boolean>)
      } catch {
        /* ignore */
      }
    }
  }, [])

  const savePositioning = useCallback(() => {
    localStorage.setItem(POSITIONING_KEY, positioning)
    toast.success('Positioning saved locally.')
  }, [positioning])

  const toggleGithubItem = (item: string) => {
    setGithubChecks((prev) => {
      const next = { ...prev, [item]: !prev[item] }
      localStorage.setItem(GITHUB_CHECKLIST_KEY, JSON.stringify(next))
      return next
    })
  }

  const githubProgress = useMemo(() => {
    const done = GITHUB_CHECKLIST_ITEMS.filter((i) => githubChecks[i]).length
    return Math.round((done / GITHUB_CHECKLIST_ITEMS.length) * 100)
  }, [githubChecks])

  const resumeBulletsFromEvidence = useMemo(
    () => state.evidence.filter((e) => e.type === 'resume_bullet'),
    [state.evidence],
  )

  const exportMarkdown = () => {
    const project = state.projects.find((p) => p.id === selectedProject)
    const lines = [
      '# ML Engineer Resume Pack',
      '',
      '## Positioning statement',
      positioning,
      '',
      '## Project bullets',
      ...bullets.map((b, i) => `${i + 1}. ${b}`),
      '',
      '## Saved evidence bullets',
      ...resumeBulletsFromEvidence.map((b) => `- ${b.title}: ${b.description || b.metricPlaceholder || ''}`),
      '',
      '## GitHub checklist',
      ...GITHUB_CHECKLIST_ITEMS.map((item) => `- [${githubChecks[item] ? 'x' : ' '}] ${item}`),
      '',
      '## README sections to complete',
      ...README_SECTIONS.map((s) => `- ${s}`),
      '',
      project ? `## Featured project: ${project.name}` : '',
    ].filter(Boolean)

    downloadText('ml-engineer-resume-pack.md', lines.join('\n'), 'text/markdown')
    toast.success('Markdown exported.')
  }

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(`${label} copied.`)
    setTimeout(() => setCopied(null), 2000)
  }

  const insertPlaceholder = (placeholder: string) => {
    setNewBullet((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${placeholder}`)
  }

  const saveBulletAsEvidence = (text: string) => {
    if (!text.trim()) {
      toast.error('Bullet text is required.')
      return
    }
    const placeholders = text.match(/\[([^\]]+)\]/g) ?? []
    addEvidence({
      title: text.slice(0, 80),
      type: 'resume_bullet',
      description: text,
      projectId: selectedProject,
      date: new Date().toISOString().slice(0, 10),
      verificationStatus: 'unverified',
      skillsDemonstrated: ['communication', 'project_depth'],
      interviewTalkingPoints: [],
      visibility: 'private',
      notes: '',
      metricPlaceholder: placeholders[0]?.replace(/[[\]]/g, '') ?? 'Enter measured value',
      taskIds: [],
    })
    toast.success('Bullet saved as evidence.')
  }

  const linkedInHeadline = `${positioning.split(',')[0]} | Python · PyTorch · MLOps`

  const recruiterMessage = `Hi — I'm a software engineer transitioning into production-oriented ML engineering. I've been building portfolio projects with Docker, FastAPI, MLflow, and Azure-style deployments. I'd appreciate learning about ML engineer roles where reproducibility and MLOps matter. ${positioning.slice(0, 120)}…`

  const referralRequest = `Hi [Name], I'm preparing for ML engineer interviews and have been shipping production-style ML projects (containerized APIs, CI/CD, experiment tracking). Would you be open to a brief chat or referral for [Company/Role]? Happy to share my GitHub and a one-page project summary.`

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Resume & career pack"
        description="Build honest, evidence-backed positioning. Replace bracket placeholders with measured values only when verified."
        actions={
          <Button onClick={exportMarkdown}>
            <Download className="size-4" aria-hidden />
            Export markdown
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Positioning statement</CardTitle>
            <CardDescription>
              Saved locally and included in exports. Do not store in profile.existingMlExperience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={positioning}
              onChange={(e) => setPositioning(e.target.value)}
              rows={4}
              aria-label="Positioning statement"
            />
            <Button onClick={savePositioning}>
              <Save className="size-4" aria-hidden />
              Save locally
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bullet builder</CardTitle>
            <CardDescription>
              Use placeholders until you have measured values. Save completed bullets as evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {METRIC_PLACEHOLDERS.map((ph) => (
                <Button key={ph} type="button" variant="outline" size="sm" onClick={() => insertPlaceholder(ph)}>
                  {ph}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bullet-project">Link to project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="bullet-project">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {state.projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              value={newBullet}
              onChange={(e) => setNewBullet(e.target.value)}
              placeholder="Write a bullet with [metric] placeholders…"
              rows={3}
              aria-label="New resume bullet"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  if (!newBullet.trim()) return
                  setBullets((prev) => [...prev, newBullet.trim()])
                  setNewBullet('')
                }}
              >
                Add to pack
              </Button>
              <Button variant="secondary" onClick={() => saveBulletAsEvidence(newBullet)}>
                Save as evidence
              </Button>
            </div>

            <Separator />

            <ul className="space-y-3">
              {bullets.map((bullet, i) => (
                <li key={`${i}-${bullet.slice(0, 20)}`} className="rounded-xl border border-border p-4 text-sm">
                  <p>{bullet}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyText(bullet, 'Bullet')}>
                      <Copy className="size-4" aria-hidden />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => saveBulletAsEvidence(bullet)}>
                      Save as evidence
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBullets((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            {resumeBulletsFromEvidence.length > 0 ? (
              <>
                <Separator />
                <h3 className="text-sm font-medium">Evidence-backed bullets</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {resumeBulletsFromEvidence.map((b) => (
                    <li key={b.id} className="flex items-start justify-between gap-2">
                      <span>{b.description || b.title}</span>
                      {b.metricPlaceholder ? (
                        <Badge variant="outline">{b.metricPlaceholder}</Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-5" aria-hidden />
              GitHub checklist
            </CardTitle>
            <CardDescription>{githubProgress}% complete (stored in localStorage)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {GITHUB_CHECKLIST_ITEMS.map((item) => (
              <label key={item} className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  checked={!!githubChecks[item]}
                  onCheckedChange={() => toggleGithubItem(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" aria-hidden />
              README builder
            </CardTitle>
            <CardDescription>Sections to include in each project README.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              {README_SECTIONS.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="size-5" aria-hidden />
              LinkedIn headline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{linkedInHeadline}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyText(linkedInHeadline, 'LinkedIn headline')}
            >
              <Copy className="size-4" aria-hidden />
              {copied === 'LinkedIn headline' ? 'Copied' : 'Copy'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" aria-hidden />
              Recruiter message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{recruiterMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyText(recruiterMessage, 'Recruiter message')}
            >
              <Copy className="size-4" aria-hidden />
              Copy
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Referral request template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={referralRequest} readOnly rows={4} aria-label="Referral request template" />
            <Button variant="outline" size="sm" onClick={() => copyText(referralRequest, 'Referral request')}>
              <Copy className="size-4" aria-hidden />
              Copy template
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
