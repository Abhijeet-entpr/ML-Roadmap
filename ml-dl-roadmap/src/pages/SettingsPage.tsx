import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  AlertTriangle,
  Database,
  Download,
  Eye,
  Upload,
} from 'lucide-react'
import { allocationWarning } from '@/lib/rules'
import { clamp, downloadText } from '@/lib/utils'
import { useApp } from '@/store/AppStore'
import type { AvailabilityTier } from '@/types'
import PageHeader from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Textarea,
} from '@/components/ui'

const REMINDER_CATEGORIES = [
  { key: 'tasks', label: 'Tasks & deadlines' },
  { key: 'evidence', label: 'Evidence & verification' },
  { key: 'interviews', label: 'Interviews & mocks' },
  { key: 'applications', label: 'Applications & follow-ups' },
  { key: 'plan', label: 'Plan & milestones' },
]

const VISIBILITY_LABELS = [
  {
    level: 'private' as const,
    title: 'Private',
    description: 'Only visible on this device. Never shared or exported by default.',
  },
  {
    level: 'internal' as const,
    title: 'Internal',
    description: 'Safe for resume bullets and mock interviews — no public URLs required.',
  },
  {
    level: 'public' as const,
    title: 'Public',
    description: 'Portfolio-ready: GitHub repos, deployment URLs, and demo links you would show recruiters.',
  },
]

const AVAILABILITY_OPTIONS: { tier: AvailabilityTier; hours: number; label: string }[] = [
  { tier: 'minimum', hours: 6, label: '6 h/week (minimum)' },
  { tier: 'standard', hours: 13, label: '12–15 h/week (standard)' },
  { tier: 'intensive', hours: 19, label: '18–20 h/week (intensive)' },
  { tier: 'custom', hours: 15, label: 'Custom' },
]

export default function SettingsPage() {
  const {
    state,
    ready,
    updateProfile,
    updatePreferences,
    setTheme,
    exportData,
    importData,
    resetSampleData,
  } = useApp()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importPreview, setImportPreview] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [targetRolesText, setTargetRolesText] = useState(
    () => state.profile?.targetRoles.join(', ') ?? '',
  )

  const prefs = state.preferences
  const profile = state.profile
  const allocWarning = allocationWarning(prefs)
  const supabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  )

  const handleAllocationChange = (
    key: keyof NonNullable<typeof prefs>['trackAllocation'],
    value: number,
  ) => {
    if (!prefs) return
    updatePreferences({
      trackAllocation: { ...prefs.trackAllocation, [key]: clamp(value, 0, 100) },
    })
  }

  const handleExport = () => {
    const json = exportData()
    downloadText(`ml-launchpad-export-${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImportPreview(String(reader.result ?? ''))
      setImportOpen(true)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const confirmImport = () => {
    try {
      importData(importPreview)
      setImportOpen(false)
      setImportPreview('')
    } catch {
      // importJson throws on invalid data — keep dialog open
    }
  }

  const handleReset = async () => {
    await resetSampleData()
    setResetOpen(false)
  }

  const saveTargetRoles = () => {
    updateProfile({
      targetRoles: targetRolesText.split(',').map((s) => s.trim()).filter(Boolean),
    })
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground" role="status">Loading…</p>
      </div>
    )
  }

  if (!profile?.onboardingComplete || !prefs) {
    return <Navigate to="/onboarding" replace />
  }

  const reminderCategories = prefs.reminderCategories ?? {
    tasks: true,
    evidence: true,
    interviews: true,
    applications: true,
    plan: true,
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Settings"
        description="Profile, preferences, data management, and privacy."
      />

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 pt-6">
          <Database className="size-5 shrink-0 text-primary" aria-hidden />
          <div className="text-sm">
            <p className="font-medium">Data persistence</p>
            <p className="mt-1 text-muted-foreground">
              {supabaseConfigured
                ? 'Supabase sync is configured via VITE_SUPABASE_* environment variables. Local storage is used as fallback.'
                : 'Data is stored locally in your browser by default. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for optional cloud sync.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">Profile</h2>
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentRole">Current role</Label>
              <Input
                id="currentRole"
                value={profile.currentRole}
                onChange={(e) => updateProfile({ currentRole: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min={0}
                value={profile.yearsExperience}
                onChange={(e) => updateProfile({ yearsExperience: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="targetRoles">Target roles (comma-separated)</Label>
              <div className="flex gap-2">
                <Input
                  id="targetRoles"
                  value={targetRolesText}
                  onChange={(e) => setTargetRolesText(e.target.value)}
                />
                <Button variant="outline" onClick={saveTargetRoles}>Save</Button>
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="existingMlExperience">Existing ML experience</Label>
              <Textarea
                id="existingMlExperience"
                value={profile.existingMlExperience}
                onChange={(e) => updateProfile({ existingMlExperience: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetMarket">Target market</Label>
              <Input
                id="targetMarket"
                value={profile.targetMarket}
                onChange={(e) => updateProfile({ targetMarket: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredSpecialization">Specialization</Label>
              <Input
                id="preferredSpecialization"
                value={profile.preferredSpecialization}
                onChange={(e) => updateProfile({ preferredSpecialization: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">Preferences</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weeklyHours">Weekly hours</Label>
              <Input
                id="weeklyHours"
                type="number"
                min={4}
                max={40}
                value={prefs.weeklyHours}
                onChange={(e) =>
                  updatePreferences({ weeklyHours: Number(e.target.value), availabilityTier: 'custom' })
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <Button
                  key={opt.tier}
                  variant={prefs.availabilityTier === opt.tier ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updatePreferences({ availabilityTier: opt.tier, weeklyHours: opt.hours })
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Track allocation (%)</CardTitle>
            <CardDescription>How you split time across learning tracks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              Object.entries(prefs.trackAllocation) as Array<
                [keyof typeof prefs.trackAllocation, number]
              >
            ).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label htmlFor={`alloc-${key}`} className="capitalize">{key}</Label>
                  <span>{value}%</span>
                </div>
                <input
                  id={`alloc-${key}`}
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => handleAllocationChange(key, Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            ))}
            {allocWarning ? (
              <p className="flex items-start gap-2 text-sm text-warning" role="alert">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                {allocWarning}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance & reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={prefs.theme} onValueChange={(v) => setTheme(v as typeof prefs.theme)}>
                <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminderPreference">Reminder frequency</Label>
              <Select
                value={prefs.reminderPreference}
                onValueChange={(v) =>
                  updatePreferences({ reminderPreference: v as typeof prefs.reminderPreference })
                }
              >
                <SelectTrigger id="reminderPreference"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <p className="text-sm font-medium">Reminder categories</p>
            {REMINDER_CATEGORIES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`reminder-${key}`}>{label}</Label>
                <Switch
                  id={`reminder-${key}`}
                  checked={reminderCategories[key] ?? true}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      reminderCategories: { ...reminderCategories, [key]: checked },
                    })
                  }
                />
              </div>
            ))}
            <Separator />
            <p className="text-sm font-medium">Quiet hours</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quietStart">Start</Label>
                <Input
                  id="quietStart"
                  type="time"
                  value={prefs.quietHoursStart}
                  onChange={(e) => updatePreferences({ quietHoursStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quietEnd">End</Label>
                <Input
                  id="quietEnd"
                  type="time"
                  value={prefs.quietHoursEnd}
                  onChange={(e) => updatePreferences({ quietHoursEnd: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Eye className="size-5" aria-hidden />
          Data visibility
        </h2>
        <Card>
          <CardContent className="grid gap-4 pt-6">
            {VISIBILITY_LABELS.map((v) => (
              <div key={v.level} className="rounded-lg border border-border/60 p-3">
                <Badge variant="outline" className="mb-2 capitalize">{v.title}</Badge>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Data management</h2>
        <Card>
          <CardContent className="flex flex-wrap gap-3 pt-6">
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" aria-hidden />
              Export JSON
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" aria-hidden />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={handleFileSelect}
              aria-label="Import JSON file"
            />
            <Button variant="destructive" onClick={() => setResetOpen(true)}>
              Reset sample data
            </Button>
          </CardContent>
        </Card>
      </section>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import data</DialogTitle>
            <DialogDescription>
              This will replace all current data with the imported JSON. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Preview: {importPreview.slice(0, 120)}…
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={confirmImport}>Confirm import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset sample data?</DialogTitle>
            <DialogDescription>
              All progress, evidence, applications, and preferences will be cleared and replaced with fresh sample data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void handleReset()}>Reset everything</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
