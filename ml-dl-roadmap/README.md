# ML Engineer Launchpad

**A 12-Week Deep Learning Project and Interview Platform**

Transform a detailed ML career roadmap into an interactive learning operating system for software engineers transitioning into ML Engineering, Applied AI, Computer Vision, NLP, and Generative AI roles.

This is a **local-first** Vite + React app. You can zip the repo, share it, and run it without cloud credentials. Optional Supabase hooks are included for a later cloud sync.

## Product purpose

In 12 weeks, the learner aims to:

1. Build three portfolio-quality, production-style ML systems
2. Practice PyTorch, Transformers, FastAPI, Docker, MLflow, CI/CD, Azure, DSA, SQL, and interviews
3. Follow a selective 16-week Goodfellow reading plan
4. Collect measurable evidence (repos, experiments, deployments, mocks, applications)
5. Become interview-ready for ML / Applied AI / NLP / CV / GenAI / MLOps / Search roles

Positioning reinforced by the product:

> Software engineer with three years of experience building reliable applications, specializing in production-oriented ML systems using Python, PyTorch, Transformers, FastAPI, Docker, MLflow, CI/CD, and Azure.

## Technology stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- shadcn-style Radix UI primitives
- Lucide icons, Recharts, Framer Motion
- React Hook Form + Zod
- TanStack Query ready
- LocalStorage persistence with a repository abstraction for future Supabase

## Quick start (shareable zip / git clone)

```bash
npm install --legacy-peer-deps
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

No `.env` file is required for the first runnable version.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run test` | Unit / component tests (Vitest) |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint (if configured) |

## Environment variables

Copy `.env.example` to `.env` only if you want optional cloud features:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `VITE_EMAIL_PROVIDER_API_KEY` | No | Future email reminders |

When unset, the app uses **localStorage** and in-app notifications.

## Database setup (optional)

Apply `supabase/schema.sql` in a Supabase project when you are ready for cloud sync. Row-level security policies isolate user data. Until then, all learner data stays in the browser.

## Seed process

On first load (or after **Settings → Reset sample data**), the app seeds:

- 12-week curriculum with tasks and exit criteria
- 3 project workspaces + production-readiness matrix
- 16-week Goodfellow reading plan (links only; no book text)
- Learning modules, practice questions, system-design exercises
- Official external resource links

## Key product surfaces

- **Today** — daily agenda, focus timer, reflection
- **Dashboard** — progress, exit gates, skill radar, insights
- **Roadmap** — timeline / kanban / calendar + week detail
- **Projects** — workspaces, defense builder, readiness matrix
- **Learn / Practice / Interview Lab / System Design**
- **Goodfellow Plan** — reading tracker with learner notes only
- **Evidence Vault** — proof linked to skills and projects
- **Readiness** — scorecard vs month and application targets
- **Applications** — pipeline, funnel, weekly targets
- **Analytics** — real activity-based charts + weekly review export
- **Settings** — theme, import/export JSON, reset

## Data model

Normalized TypeScript entities cover users/profiles, weeks/tasks, projects/capabilities, practice, mocks, system design, reading, evidence, applications, notifications, and weekly reviews. See `src/types/index.ts` and Zod validators in `src/data/schemas.ts`.

## Key product decisions

1. **Local-first** so a zip/git share works anywhere
2. **Evidence before high skill scores** (4–5 require linked proof)
3. **Capability gates preserved** even when a 6-hour plan defers Project 1 scope
4. **Honest portfolio language** — production-style, load-tested at, designed for
5. **No copyrighted book content** — only official links + user notes
6. **Deterministic insights** — rule-based analytics, not fake AI

## Sharing the project

### As a git repo

```bash
git add .
git commit -m "feat: ML Engineer Launchpad learning platform"
git remote add origin <your-remote>
git push -u origin main
```

### As a zip

Zip the project **excluding** `node_modules` and `dist`:

```bash
# PowerShell example
Compress-Archive -Path * -DestinationPath ml-engineer-launchpad.zip
```

Recipients run:

```bash
npm install --legacy-peer-deps
npm run dev
```

### Static hosting

```bash
npm run build
```

Deploy the `dist/` folder to Netlify, Vercel, GitHub Pages, Azure Static Web Apps, or any static host.

## Testing

```bash
npm run test
npm run build
```

CI workflow: `.github/workflows/ci.yml`

## Architecture overview

```
src/
  components/layout   App shell, nav, command palette
  components/ui       Design system primitives
  data/seed           Curriculum + projects + practice seeds
  data/schemas        Zod validators
  lib/rules           Progress, gates, readiness, insights
  lib/storage         Local / optional Supabase repository
  pages               Route-level workspaces
  store               AppProvider + persistence
  types               Domain model
```

## Security and privacy

- Input validation via Zod where forms need it
- Safe external URL checks
- Confirmation before reset/import destructive actions
- Evidence visibility labels: private / internal / public
- No secrets committed; `.env.example` only

## Known limitations

- Supabase sync is scaffolded, not fully wired for multi-device realtime
- Email reminders are in-app only until a provider is configured
- Drag-and-drop roadmap rescheduling is simplified (status/date controls work)
- Metrics are never fabricated — placeholders say “Enter measured value”

## Future roadmap

- Full Supabase auth + sync
- Optional grounded coaching assistant
- Deeper Playwright e2e suite
- Calendar integrations for mock interviews

## License

Use and share freely for personal learning and portfolio preparation.
