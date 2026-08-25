# Build Package — 4 Documents

---
---

# `00-DECISIONS.md`

## Resolved Open Decisions

| # | Decision | **Recommendation** | Rationale |
|---|---|---|---|
| 1 | Deliverable verification | **Hybrid: self-attest + auto-verified numeric checks** | Full grading is a product in itself. But `verify` and `build` tasks whose success criterion is numeric ("gradients match within 1e-5") ask the learner to paste the number; we validate the value. Covers ~40% of tasks at ~2% of the cost and preserves integrity where it matters. |
| 2 | Code execution sandbox | **No. Out of scope for v1.** | Learners already have a Python environment — requiring one is a deliberate part of the curriculum. Sandbox adds security surface, cost, and latency for zero pedagogical gain. Revisit at v2 for `parsons` tasks only. |
| 3 | Domain branches at launch | **One: NLP/LLM** | Highest demand, and `attn.self_attention` → `tf.block` is the strongest threshold-concept sequence to validate the scaffold ladder on. Vision ships as v1.1 — the DAG already supports it, only content is missing. |
| 4 | Concurrent plans | **No. One active plan per learner.** | Multiple plans destroy the projection model (velocity becomes unattributable) and are the single clearest signal of a learner avoiding hard parts. `paused` state covers the legitimate use case. |
| 5 | Spacing algorithm | **FSRS-lite: fixed intervals `[2, 7, 21, 60]` with the multiplier rules in §12** | Full FSRS needs review history to calibrate; you have none at launch. Fixed intervals are within a few percent of optimal for this volume and are trivially testable with golden fixtures. Log everything needed to migrate to full FSRS later. |

### Additional decisions locked for the build

| Area | Decision |
|---|---|
| Content storage | **Content-as-code.** YAML in `packages/content/`, Zod-validated at build, seeded by script. No admin CMS in v1. |
| Auth | Email magic link + Google OAuth. No passwords. |
| Payments | None in v1. Waitlist + manual access grants. |
| Mobile | Responsive web only. Today screen is mobile-first; Progress screen is desktop-first. |
| LLM usage | Restricted to three call sites: task instruction personalisation, hint phrasing, weekly digest prose. All structured-output, all with a non-LLM fallback string. Never in plan generation. |
| Timezone | Stored per learner; all rollovers computed in local time; all storage in UTC. |
| Analytics | PostHog (self-hostable, event-based, free tier adequate). |

---
---

# `01-STACK.md`

## Selection Criteria

This stack is optimised for **agent-buildability** first, then operational simplicity. Concretely: one language end-to-end, types shared rather than duplicated, conventions heavily represented in model training data, a fast local feedback loop, and a pure-logic core that can be built and tested with zero infrastructure context.

## The Stack

| Layer | Choice | Why this one |
|---|---|---|
| Language | **TypeScript 5.6+, `strict: true`** | One language across web, worker, domain, and content. Halves the context an agent needs. `strict` turns whole classes of agent errors into compile errors. |
| Runtime | **Node 22 LTS** | Native `--env-file`, stable fetch, broad library support. |
| Monorepo | **pnpm workspaces + Turborepo** | Enforced package boundaries — the mechanism that makes per-ticket context isolation actually work. Turbo caching keeps CI fast. |
| Web framework | **Next.js 15 (App Router), React 19** | Single deployable for UI + API. Server Components reduce client bundle. Overwhelmingly represented in training data. |
| API | **tRPC v11** | End-to-end types with no codegen step and no OpenAPI drift. An agent editing a router cannot break the client silently — the typecheck fails. This is the single biggest defect-prevention lever available. |
| Database | **PostgreSQL 16 (Neon)** | Relational data with real constraints. Neon's branching gives every agent PR an isolated database to run migrations against. |
| ORM | **Drizzle ORM** | Schema-in-TypeScript, migrations emitted as plain reviewable SQL. Agents reason about SQL correctly far more often than about an ORM DSL. |
| Job queue | **pg-boss** | Postgres-backed — no Redis, no additional vendor. Built-in cron, retries, and exactly-once semantics via advisory locks. Idempotency (§16) is straightforward. |
| Validation | **Zod** | One schema per concept, reused for tRPC input, DB insert types, content validation, and LLM structured output. Eliminates four duplicate type definitions. |
| Auth | **Clerk** | Fewest moving parts. Session handling, magic links, and OAuth in ~30 lines. Auth.js v5 is the self-hosted fallback if vendor cost becomes a concern. |
| Styling | **Tailwind CSS v4** | Colocated styles mean an agent editing a component never opens a second file. |
| Components | **shadcn/ui** | Copy-in, not a dependency. Components live in your repo and can be edited directly — no fighting a library's abstraction. |
| Charts (V1, V2, V5) | **Recharts** | Declarative, composable, extremely well represented. `ReferenceLine` / `ReferenceArea` cover the trajectory annotations natively. |
| Skill map (V4) | **@xyflow/react + dagre** | Purpose-built for layered DAG rendering with interaction. Dagre handles layout deterministically. |
| Client data | **TanStack Query** (via tRPC) | Caching, optimistic mutations, and the offline persistence layer in one library. |
| Offline | **TanStack Query persister + `idb-keyval`** | Today screen reads from IndexedDB; completions queue as optimistic mutations and flush on reconnect. |
| LLM | **Vercel AI SDK** + Anthropic/OpenAI | `generateObject` with a Zod schema — structured output, no parsing. Provider-swappable. |
| Testing | **Vitest** (unit/integration) + **Playwright** (e2e) | Vitest runs the pure domain package in milliseconds with no DB. Playwright covers 4 critical paths only. |
| Dates/TZ | **Luxon** | Explicit IANA zone handling. `date-fns-tz` is workable but Luxon's `DateTime.setZone` API is harder to misuse — critical given the midnight-rollover logic. |
| Analytics | **PostHog** | Event schema from §17 maps 1:1. |
| Errors | **Sentry** | Worker + web. |
| Hosting | **Railway** (web + worker services) | Two services from one repo. Long-running worker process without serverless constraints. |
| Database host | **Neon** | Branching per PR. |
| CI | **GitHub Actions** | typecheck → lint → unit → migrate-on-branch → e2e. |

### Explicitly rejected

| Rejected | Reason |
|---|---|
| Python backend | Would split the stack into two languages and duplicate all types. The domain logic is graph traversal and arithmetic, not numerics — Python buys nothing here. |
| GraphQL | Schema + resolvers + codegen + client cache config = four surfaces for an agent to desynchronise. tRPC gives the same safety with one. |
| Prisma | Opaque generated client; migrations harder to review. Drizzle's plain-SQL output is auditable. |
| Redis + BullMQ | A second datastore for a workload Postgres handles comfortably at this scale. |
| Inngest / Temporal | Excellent tools, unnecessary vendor and mental model for six cron jobs. |
| Microservices | Actively harmful for agent development — cross-service context is expensive and contracts drift. |
| D3 (direct) | Imperative DOM manipulation inside React is where agents most reliably produce broken code. |

---
---

# `02-LLD.md`

## 1. Architectural Principle

> **All non-trivial logic lives in `packages/domain` as pure functions with zero I/O and zero dependencies beyond `zod` and `luxon`.**

Consequences:
- The planner, projection engine, debt reallocator, scaffold ladder, and spacing scheduler are tested with plain objects — no database, no mocks, no fixtures beyond JSON.
- An agent implementing the planner needs the contracts package and nothing else. This is the primary token-cost control.
- Every side effect (DB write, LLM call, job enqueue) happens in a thin adapter that calls a pure function and persists the result.

```
┌─────────────────────────────────────────────┐
│  apps/web        (Next.js: UI + tRPC)       │
│  apps/worker     (pg-boss: 6 jobs)          │
└──────────────┬──────────────────────────────┘
               │  both depend on ↓, never on each other
┌──────────────▼──────────────────────────────┐
│  packages/db          Drizzle + repositories │  ← only layer touching Postgres
├─────────────────────────────────────────────┤
│  packages/domain      PURE. no I/O.          │  ← all algorithms
├─────────────────────────────────────────────┤
│  packages/contracts   Zod schemas + types    │  ← single source of truth
├─────────────────────────────────────────────┤
│  packages/content     YAML + loader          │
└─────────────────────────────────────────────┘
```

Dependency rule, enforced by ESLint `no-restricted-imports`:
`content → contracts` · `domain → contracts` · `db → contracts, domain` · `apps → all`
**`domain` may never import from `db`, `content`, or any app.**

---

## 2. Repository Layout

```
dl-planner/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (auth)/sign-in/page.tsx
│   │   │   ├── (onboarding)/
│   │   │   │   ├── questions/page.tsx
│   │   │   │   ├── diagnostic/page.tsx
│   │   │   │   ├── feasibility/page.tsx
│   │   │   │   └── preview/page.tsx
│   │   │   ├── (app)/
│   │   │   │   ├── today/page.tsx
│   │   │   │   ├── task/[id]/page.tsx
│   │   │   │   ├── progress/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── recovery/page.tsx
│   │   │   ├── api/trpc/[trpc]/route.ts
│   │   │   └── layout.tsx
│   │   ├── server/
│   │   │   ├── trpc.ts                 # init, context, middleware
│   │   │   └── routers/
│   │   │       ├── _app.ts
│   │   │       ├── onboarding.ts
│   │   │       ├── plan.ts
│   │   │       ├── task.ts
│   │   │       ├── review.ts
│   │   │       ├── progress.ts
│   │   │       └── impact.ts
│   │   ├── components/
│   │   │   ├── ui/                     # shadcn primitives
│   │   │   ├── charts/
│   │   │   │   ├── trajectory-chart.tsx        # V1
│   │   │   │   ├── capacity-bars.tsx           # V2
│   │   │   │   ├── impact-simulator.tsx        # V3
│   │   │   │   ├── skill-map.tsx               # V4
│   │   │   │   └── retention-heatmap.tsx       # V5
│   │   │   ├── task/
│   │   │   │   ├── task-card.tsx
│   │   │   │   ├── hint-chain.tsx
│   │   │   │   └── stuck-timer.tsx
│   │   │   └── onboarding/question-*.tsx
│   │   └── lib/{trpc-client.ts, offline.ts, analytics.ts}
│   │
│   └── worker/
│       ├── index.ts                    # pg-boss bootstrap
│       └── jobs/
│           ├── midnight-rollover.ts
│           ├── weekly-recompute.ts
│           ├── review-scheduler.ts
│           ├── snapshot-writer.ts
│           ├── link-health-check.ts
│           └── reminder-dispatch.ts
│
├── packages/
│   ├── contracts/src/
│   │   ├── enums.ts
│   │   ├── profile.ts
│   │   ├── skill.ts
│   │   ├── task.ts
│   │   ├── plan.ts
│   │   ├── projection.ts
│   │   └── index.ts
│   │
│   ├── domain/src/
│   │   ├── graph/
│   │   │   ├── closure.ts              # transitive prerequisite closure
│   │   │   ├── topo-sort.ts            # + tiebreak priority fn
│   │   │   └── prune.ts                # mastery-based pruning
│   │   ├── mastery/
│   │   │   ├── infer.ts                # confidence → state
│   │   │   └── diagnostic-adaptive.ts  # next-item selection
│   │   ├── planner/
│   │   │   ├── feasibility.ts
│   │   │   ├── expand-tasks.ts
│   │   │   ├── match-resource.ts
│   │   │   └── generate-plan.ts        # orchestrator
│   │   ├── schedule/
│   │   │   ├── place-tasks.ts
│   │   │   ├── buffers.ts
│   │   │   └── calendar.ts             # active days, blackouts, TZ
│   │   ├── slip/
│   │   │   ├── state-machine.ts
│   │   │   ├── reallocate-debt.ts
│   │   │   ├── recovery-mode.ts
│   │   │   └── visible-overdue.ts      # the ≤3 cap
│   │   ├── impact/
│   │   │   ├── velocity.ts             # EWMA
│   │   │   ├── decay-penalty.ts
│   │   │   ├── project.ts
│   │   │   └── levers.ts               # absorb/push/compress/trim
│   │   ├── scaffold/ladder.ts
│   │   ├── spacing/fsrs-lite.ts
│   │   ├── recompute/weekly.ts
│   │   └── index.ts
│   │
│   ├── db/
│   │   ├── src/schema/*.ts             # Drizzle tables
│   │   ├── src/repos/*.ts              # one repo per aggregate
│   │   ├── drizzle/*.sql               # generated migrations
│   │   └── seed/{content.ts, dev.ts}
│   │
│   └── content/
│       ├── skills/*.yaml
│       ├── tasks/*.yaml
│       ├── resources.yaml
│       ├── diagnostics.yaml
│       ├── retrieval.yaml
│       └── src/{load.ts, validate.ts}
│
├── AGENTS.md                           # ≤120 lines. Router, not manual.
├── CHANGELOG-AGENT.md                  # 5 lines per merged ticket
└── docs/{00-DECISIONS,01-STACK,02-LLD,03-TOKENS}.md
```

**File size ceiling: 300 LOC.** Enforced by ESLint `max-lines`. Files above this cost more to load and edit than they save.

---

## 3. Database Schema (Drizzle)

```ts
// packages/db/src/schema/learner.ts
export const learners = pgTable('learners', {
  id:        uuid('id').primaryKey().defaultRandom(),
  clerkId:   text('clerk_id').notNull().unique(),
  timezone:  text('timezone').notNull(),              // IANA
  status:    learnerStatusEnum('status').notNull().default('onboarding'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const learnerProfiles = pgTable('learner_profiles', {
  learnerId:            uuid('learner_id').primaryKey().references(() => learners.id, { onDelete: 'cascade' }),
  goalArchetype:        goalEnum('goal_archetype').notNull(),
  depthRung:            smallint('depth_rung').notNull(),
  domainFocus:          domainEnum('domain_focus').notNull(),
  targetDate:           date('target_date').notNull(),
  deadlineType:         deadlineEnum('deadline_type').notNull(),
  committedHoursPerWeek: real('committed_hours_per_week').notNull(),
  activeDays:           smallint('active_days').array().notNull(),   // 1=Mon..7=Sun
  sessionLengthMinutes: smallint('session_length_minutes').notNull(),
  computeTier:          computeEnum('compute_tier').notNull(),
  budgetTier:           budgetEnum('budget_tier').notNull(),
  formatPreference:     formatEnum('format_preference').notNull(),
  notationTolerance:    levelEnum('notation_tolerance').notNull(),
  challengePreference:  challengeEnum('challenge_preference').notNull(),
  priorFailureMode:     failureEnum('prior_failure_mode').notNull(),
  accountabilityMode:   accountEnum('accountability_mode').notNull(),
  blackoutRanges:       jsonb('blackout_ranges').$type<Blackout[]>().notNull().default([]),
  estimateMultiplier:   real('estimate_multiplier').notNull().default(1.0),
});
```

```ts
// packages/db/src/schema/content.ts   (seeded from YAML; immutable at runtime)
export const skillNodes = pgTable('skill_nodes', {
  id:                 text('id').primaryKey(),                 // 'dl.backprop'
  title:              text('title').notNull(),
  layer:              smallint('layer').notNull(),
  estimatedHours:     real('estimated_hours').notNull(),
  isThresholdConcept: boolean('is_threshold_concept').notNull().default(false),
  domainTags:         text('domain_tags').array().notNull(),
  minDepthRung:       smallint('min_depth_rung').notNull().default(1),
  verificationTaskId: uuid('verification_task_id'),
});

export const skillEdges = pgTable('skill_edges', {
  childId:  text('child_id').notNull().references(() => skillNodes.id),
  parentId: text('parent_id').notNull().references(() => skillNodes.id),   // prerequisite
}, t => ({ pk: primaryKey({ columns: [t.childId, t.parentId] }) }));

export const resources = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  provider: text('provider').notNull(),
  format: formatTypeEnum('format').notNull(),
  startSeconds: integer('start_seconds'),
  endSeconds: integer('end_seconds'),
  durationMinutes: integer('duration_minutes').notNull(),
  level: smallint('level').notNull(),
  cost: costEnum('cost').notNull(),
  requiresGpu: boolean('requires_gpu').notNull().default(false),
  framework: text('framework'),
  notationHeaviness: levelEnum('notation_heaviness').notNull(),
  qualityScore: smallint('quality_score').notNull(),
  status: resourceStatusEnum('status').notNull().default('active'),
  lastVerifiedAt: date('last_verified_at').notNull(),
});

export const resourceSkills = pgTable('resource_skills', {
  resourceId:  uuid('resource_id').notNull().references(() => resources.id),
  skillNodeId: text('skill_node_id').notNull().references(() => skillNodes.id),
}, t => ({ pk: primaryKey({ columns: [t.resourceId, t.skillNodeId] }) }));

export const taskTemplates = pgTable('task_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  skillNodeId: text('skill_node_id').notNull().references(() => skillNodes.id),
  sequenceIndex: smallint('sequence_index').notNull(),
  type: taskTypeEnum('type').notNull(),
  scaffoldLevel: scaffoldEnum('scaffold_level').notNull(),
  estimatedMinutes: smallint('estimated_minutes').notNull(),
  resourceId: uuid('resource_id').references(() => resources.id),
  instructionMd: text('instruction_md').notNull(),
  successCriterion: text('success_criterion').notNull(),
  expectedValue: text('expected_value'),          // for numeric auto-verify
  toleranceRel: real('tolerance_rel'),
  starterAssetUrl: text('starter_asset_url'),
  hintChain: jsonb('hint_chain').$type<string[]>().notNull().default([]),
  deliverableType: deliverableEnum('deliverable_type').notNull(),
  isOptional: boolean('is_optional').notNull().default(false),
  minDepthRung: smallint('min_depth_rung').notNull().default(1),
});
```

```ts
// packages/db/src/schema/plan.ts
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  learnerId: uuid('learner_id').notNull().references(() => learners.id),
  status: planStatusEnum('status').notNull().default('active'),
  originalTargetDate: date('original_target_date').notNull(),
  currentTargetDate:  date('current_target_date').notNull(),
  totalEstimatedHours: real('total_estimated_hours').notNull(),
  bufferRatio: real('buffer_ratio').notNull().default(0.20),
  recoveryMode: boolean('recovery_mode').notNull().default(false),
  recoveryEnteredAt: timestamp('recovery_entered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => ({
  // enforces DECISION #4: one active plan per learner
  oneActive: uniqueIndex('one_active_plan')
    .on(t.learnerId).where(sql`status = 'active'`),
}));

export const masteryStates = pgTable('mastery_states', {
  learnerId: uuid('learner_id').notNull().references(() => learners.id),
  skillNodeId: text('skill_node_id').notNull().references(() => skillNodes.id),
  state: masteryEnum('state').notNull().default('unknown'),
  confidence: real('confidence').notNull().default(0),
  source: masterySourceEnum('source').notNull(),
  lastEvidenceAt: timestamp('last_evidence_at', { withTimezone: true }),
}, t => ({ pk: primaryKey({ columns: [t.learnerId, t.skillNodeId] }) }));

export const taskInstances = pgTable('task_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  taskTemplateId: uuid('task_template_id').notNull().references(() => taskTemplates.id),
  scheduledDate: date('scheduled_date').notNull(),
  originalScheduledDate: date('original_scheduled_date').notNull(),
  state: taskStateEnum('state').notNull().default('scheduled'),
  rescheduleCount: smallint('reschedule_count').notNull().default(0),
  actualMinutes: smallint('actual_minutes'),
  difficultyRating: smallint('difficulty_rating'),
  deliverableValue: text('deliverable_value'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, t => ({
  byPlanDate: index('ti_plan_date').on(t.planId, t.scheduledDate),
  byState:    index('ti_plan_state').on(t.planId, t.state),
}));

export const debtItems = pgTable('debt_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  taskInstanceId: uuid('task_instance_id').notNull().references(() => taskInstances.id),
  hours: real('hours').notNull(),
  createdOn: date('created_on').notNull(),
  priority: debtPriorityEnum('priority').notNull(),
  resolution: debtResolutionEnum('resolution').notNull().default('pending'),
});

// APPEND ONLY — never UPDATE, never DELETE. Powers V1 trajectory chart.
export const scheduleSnapshots = pgTable('schedule_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  capturedOn: date('captured_on').notNull(),
  cumulativePlannedHours: real('cumulative_planned_hours').notNull(),
  cumulativeCompletedHours: real('cumulative_completed_hours').notNull(),
  projectedCompletionDate: date('projected_completion_date').notNull(),
  velocityHoursPerWeek: real('velocity_hours_per_week').notNull(),
  debtHours: real('debt_hours').notNull(),
}, t => ({ uniq: uniqueIndex('snap_plan_day').on(t.planId, t.capturedOn) }));

export const reviewInstances = pgTable('review_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  retrievalItemId: uuid('retrieval_item_id').notNull(),
  skillNodeId: text('skill_node_id').notNull(),
  dueDate: date('due_date').notNull(),
  intervalDays: smallint('interval_days').notNull(),
  repetition: smallint('repetition').notNull().default(0),
  outcome: reviewOutcomeEnum('outcome'),           // null = pending
  answeredAt: timestamp('answered_at', { withTimezone: true }),
}, t => ({ byDue: index('ri_plan_due').on(t.planId, t.dueDate) }));
```

---

## 4. Domain Interfaces (the contract agents build against)

```ts
// packages/domain/src/index.ts — complete public surface

// ── graph ──────────────────────────────────────────────
export function prerequisiteClosure(
  terminals: SkillNodeId[], edges: SkillEdge[]
): SkillNodeId[];

export function topoSortWithPriority(
  nodes: SkillNode[], edges: SkillEdge[], profile: LearnerProfile
): SkillNodeId[];
// tiebreak: descendantCount desc → isThresholdConcept → layer asc → id asc

export function pruneByMastery(
  nodes: SkillNode[], mastery: Map<SkillNodeId, MasteryState>
): { keep: SkillNode[]; pruned: SkillNodeId[]; needsVerification: SkillNodeId[] };
// threshold concepts are NEVER pruned on self_report alone
// state='partial' → keep with estimatedHours × 0.5, startScaffold='completion'

// ── mastery ────────────────────────────────────────────
export function inferMastery(
  selfReportSignal: number, diagnosticSignal: number | null
): { state: MasteryStateValue; confidence: number };
// confidence = 0.4*self + 0.6*diag  (self alone if diag null, capped at 0.74)

export function selectNextDiagnosticItem(
  answered: DiagnosticAnswer[], candidates: DiagnosticItem[], maxItems: number
): DiagnosticItem | null;

// ── planner ────────────────────────────────────────────
export function checkFeasibility(
  requiredHours: number, profile: LearnerProfile, today: ISODate
): FeasibilityResult;   // { feasible: true } | { feasible: false, options: FeasibilityOption[] }

export function matchResource(
  candidates: Resource[], profile: LearnerProfile, targetLevel: number
): Resource | null;      // score fn per LLD §5.3; hard constraints first

export function expandTasks(
  nodes: SkillNode[], templates: TaskTemplate[],
  resources: Resource[], profile: LearnerProfile
): PlannedTask[];

export function generatePlan(input: GeneratePlanInput): GeneratePlanResult;
// orchestrates: closure → filter → prune → topo → feasibility → expand → place → inject reviews

// ── schedule ───────────────────────────────────────────
export function activeDatesBetween(
  from: ISODate, to: ISODate, activeDays: number[], blackouts: Blackout[], tz: string
): ISODate[];

export function placeTasks(
  tasks: PlannedTask[], dates: ISODate[], profile: LearnerProfile
): ScheduledTask[];
// constraints: no split, prereqs first, ≤1 'watch'/day unless <30min,
// each day ends with a deliverable task, 1 flex day/week, weekly reflect+retrieval

// ── slip ───────────────────────────────────────────────
export function transitionTask(
  current: TaskState, event: TaskEvent
): TaskState;            // throws on illegal transition

export function reallocateDebt(
  debt: DebtItem[], weeks: WeekCapacity[], profile: LearnerProfile
): { placements: DebtPlacement[]; unabsorbedHours: number };
// order: blocking → normal → optional; this week's flex → next week's flex → future

export function shouldEnterRecovery(
  debtHours: number, weeklyCapacity: number, consecutiveMissedDays: number
): boolean;              // debt > 1.5×capacity || consecutiveMissed >= 3

export function visibleOverdue(all: TaskInstance[]): {
  shown: TaskInstance[];               // max 3
  hiddenCount: number;
  hiddenHours: number;
};

// ── impact ─────────────────────────────────────────────
export function computeVelocity(
  weeklyCompletedHours: number[], committed: number
): number;               // EWMA α=0.5; weeks 1–2 → committed

export function decayPenalty(overdue: OverdueReview[]): number;
// Σ base × min(1 + 0.08×daysOverdue, 3)

export function project(input: ProjectionInput): Projection;
// { projectedCompletionDate, slipDays, remainingHours, velocity, confidence }

export function immediateImpact(
  missedHours: number, remainingBufferHours: number, profile: LearnerProfile
): ImmediateImpact;      // absorbed | { slipCalendarDays, newDate }

export function computeLevers(
  projection: Projection, plan: PlanSummary, profile: LearnerProfile,
  droppableSubtrees: Subtree[]
): Lever[];              // absorb? push, compress, trim

// ── scaffold ───────────────────────────────────────────
export function nextScaffoldLevel(
  current: ScaffoldLevel, difficultyRating: 1|2|3|4|5, profile: LearnerProfile
): { next: ScaffoldLevel; insertRemedial: boolean };

// ── spacing ────────────────────────────────────────────
export function scheduleReviews(
  skillNodeId: SkillNodeId, items: RetrievalItem[], startDate: ISODate
): NewReviewInstance[];   // intervals [2,7,21,60]

export function nextInterval(
  current: number, repetition: number, outcome: ReviewOutcome
): { intervalDays: number; reopenNode: boolean };
// correct ×2.2 | partial ×1.0 | incorrect → 2 (2nd reset → reopenNode)

// ── recompute ──────────────────────────────────────────
export function weeklyRecompute(input: WeeklyRecomputeInput): WeeklyRecomputeResult;
// pure: returns mastery deltas, estimateMultiplier, scaffold adjustments,
// consolidation flag, tasks to materialise, new projection
```

Every one of these is a pure function. Every one gets a `*.test.ts` beside it with golden fixtures.

---

## 5. Key Algorithm Notes

### 5.1 `topoSortWithPriority` tiebreak
Kahn's algorithm; when multiple nodes have in-degree 0, order by:
1. `descendantCount` descending — unblock the most downstream work first
2. `isThresholdConcept` true first — hardest material while motivation is highest
3. `layer` ascending
4. `id` ascending — determinism, required for golden-fixture tests

### 5.2 Motivational override
Regardless of topological order, the first 5 scheduled tasks must include at least one `build` or `code_along` task producing a visible artifact ("whole game" principle). If none exists in the first 5, hoist the earliest eligible one and mark it `is_preview: true` — it does not require full prerequisites and uses maximum scaffolding.

### 5.3 `matchResource` scoring
```
hard filters:  cost ≤ budgetTier
               requiresGpu ≤ computeTier
               status = 'active'
               skillNodeId ∈ resource.skillNodeIds

score = 0.30 × formatMatch(resource.format, profile.formatPreference)
      + 0.25 × (qualityScore / 5)
      + 0.20 × (1 - |resource.level - targetLevel| / 3)
      + 0.15 × notationFit(resource.notationHeaviness, profile.notationTolerance)
      + 0.10 × durationFit(resource.durationMinutes, profile.sessionLengthMinutes)

tie → lower durationMinutes wins
no candidate → return null, planner emits a CONTENT_GAP warning (must fail CI in seed validation)
```

### 5.4 `placeTasks` — flex day selection
The flex day is the learner's active day with the historically lowest completion rate; before history exists, it is the last active day of the week. Never Monday (worst day for a rest slot — the week starts already behind).

### 5.5 Projection confidence
Return `confidence: 'low' | 'medium' | 'high'` based on weeks of history (<2 low, 2–4 medium, >4 high). The UI must render low-confidence projections as a range, never a single date.

---

## 6. tRPC Router Map

```ts
appRouter = {
  onboarding: {
    saveResponses:      mutation(OnboardingResponsesSchema) → { needsRealismCheck: boolean },
    nextDiagnosticItem: query()                             → DiagnosticItem | null,
    answerDiagnostic:   mutation({ itemId, answer })        → { correct, progress },
    finish:             mutation()                          → FeasibilityResult | PlanPreview,
  },
  plan: {
    preview:  mutation(PreviewInput)  → FeasibilityResult | PlanPreview,
    commit:   mutation(CommitInput)   → { planId },
    get:      query({ planId })       → PlanDetail,
    update:   mutation(PlanPatch)     → { planId, reprojected: Projection },
    pause:    mutation({ until })     → void,
  },
  task: {
    today:    query()                 → { tasks: TaskCard[], reviews: ReviewCard[], overdue: VisibleOverdue },
    get:      query({ id })           → TaskDetail,
    start:    mutation({ id })        → void,
    complete: mutation(CompleteInput) → { verified: boolean|null, nextScaffold, impact: ImmediateImpact|null },
    partial:  mutation({ id, actualMinutes }) → void,
    defer:    mutation({ id, toDate }) → { impact: ImmediateImpact },
    skip:     mutation({ id, reason }) → { verificationTaskId: string|null },
    swap:     mutation({ id })         → TaskDetail,
    hint:     query({ id, level })     → { text: string },
  },
  review:   { due: query() → ReviewCard[], answer: mutation(...) → { nextIntervalDays } },
  progress: { trajectory, capacity, skillmap, retention, summary },
  impact:   { simulate: mutation(SimulateInput) → SimulationResult,
              apply:    mutation({ lever, params }) → { plan: PlanDetail } },
}
```

All mutations that alter the plan run inside a single Postgres transaction and end by writing a `ScheduleSnapshot`.

---

## 7. Worker Jobs

| Job | pg-boss schedule | Idempotency key | Behaviour |
|---|---|---|---|
| `midnight-rollover` | `5 * * * *` (hourly) | `(planId, localDate)` | Selects learners whose local time is 00:05–01:05. Applies §9.2. Wrapped in advisory lock per plan. |
| `weekly-recompute` | `0 * * * *` | `(planId, isoWeek)` | Learners whose local time is Sun 18:00–19:00. Applies §13. |
| `review-scheduler` | `0 3 * * *` | `(planId, date)` | Materialises due `ReviewInstance` rows into the day's task feed. |
| `snapshot-writer` | `30 3 * * *` | `(planId, date)` | Unique index makes re-run a no-op. |
| `link-health-check` | `0 4 * * 0` | `(resourceId, week)` | HEAD request all active resources; ≥3 consecutive failures → `status='broken'` + admin alert + auto-swap affected future tasks. |
| `reminder-dispatch` | `*/15 * * * *` | `(learnerId, localDate, kind)` | Skips `accountabilityMode='solo'`. |

**Every job handler signature is identical:**
```ts
async function handler(job: Job<Payload>): Promise<void>
// 1. acquire advisory lock  2. load state  3. call pure domain fn
// 4. persist in one transaction  5. emit telemetry
```

---

## 8. Agent Build Plan — 26 Tickets

Each ticket: independently mergeable, ≤6 files touched, ships with tests, has an explicit file allowlist. Phases 2 and 4 parallelise across agents.

### Phase 0 — Scaffold (sequential, 3 tickets)
| # | Ticket | Files | Done when |
|---|---|---|---|
| 0.1 | Monorepo init: pnpm + turbo + tsconfig base + eslint boundary rules | root configs | `pnpm build` passes on empty packages; illegal import fails lint |
| 0.2 | `packages/contracts`: all enums + Zod schemas from LLD §3–4 | `contracts/src/*` | `pnpm typecheck` green; every type in §4 exported |
| 0.3 | Vitest + Playwright + CI workflow | `.github/workflows/ci.yml`, `vitest.config.ts` | CI green on empty test suites |

### Phase 1 — Domain core (parallel, 9 tickets, **highest-capability model**)
| # | Ticket | Allowlist | Fixtures |
|---|---|---|---|
| 1.1 | `graph/closure.ts` + `topo-sort.ts` + `prune.ts` | `domain/src/graph/**`, `contracts` | `fixtures/graph/*.json` |
| 1.2 | `mastery/infer.ts` + `diagnostic-adaptive.ts` | `domain/src/mastery/**` | `fixtures/mastery/*.json` |
| 1.3 | `planner/feasibility.ts` | `domain/src/planner/feasibility.ts` | 8 cases incl. all 4 options |
| 1.4 | `planner/match-resource.ts` | `domain/src/planner/match-resource.ts` | scoring table |
| 1.5 | `schedule/calendar.ts` + `place-tasks.ts` + `buffers.ts` | `domain/src/schedule/**` | DST-crossing cases mandatory |
| 1.6 | `slip/state-machine.ts` + `reallocate-debt.ts` + `visible-overdue.ts` + `recovery-mode.ts` | `domain/src/slip/**` | illegal-transition cases |
| 1.7 | `impact/velocity.ts` + `decay-penalty.ts` + `project.ts` + `levers.ts` | `domain/src/impact/**` | 12 golden projections |
| 1.8 | `scaffold/ladder.ts` + `spacing/fsrs-lite.ts` | `domain/src/scaffold/**`, `spacing/**` | interval sequences |
| 1.9 | `planner/generate-plan.ts` + `expand-tasks.ts` + `recompute/weekly.ts` (orchestrators — **after 1.1–1.8**) | `domain/src/planner/**`, `recompute/**` | 3 end-to-end personas |

### Phase 2 — Persistence (parallel, 4 tickets)
| # | Ticket | Allowlist |
|---|---|---|
| 2.1 | Drizzle schema: learner, profile, mastery | `db/src/schema/{learner,mastery}.ts` |
| 2.2 | Drizzle schema: content tables + seed loader | `db/src/schema/content.ts`, `db/seed/content.ts` |
| 2.3 | Drizzle schema: plan, taskInstance, debt, snapshot, review | `db/src/schema/plan.ts` |
| 2.4 | Repositories (one per aggregate) + transaction helper | `db/src/repos/*` |

### Phase 3 — Content (parallel with 1–2, human-reviewed)
| # | Ticket |
|---|---|
| 3.1 | `content/skills/*.yaml` — 55 nodes + edges from spec §4 |
| 3.2 | `content/resources.yaml` — 150 curated, timestamped, verified |
| 3.3 | `content/tasks/*.yaml` — 350 templates with success criteria + hint chains |
| 3.4 | `content/diagnostics.yaml` (80) + `retrieval.yaml` (250) |
| 3.5 | Zod content validator + CI gate: DAG acyclic, every node has ≥1 resource, every task has a success criterion, no orphan nodes |

### Phase 4 — API (parallel, 5 tickets)
`4.1 trpc init + context + auth middleware` · `4.2 onboarding router` · `4.3 plan router` · `4.4 task + review routers` · `4.5 progress + impact routers`

### Phase 5 — Worker (2 tickets)
`5.1 pg-boss bootstrap + advisory-lock helper + job harness` · `5.2 all six job handlers`

### Phase 6 — UI (parallel, 6 tickets)
`6.1 shadcn setup + layout + auth pages` · `6.2 onboarding wizard + realism modal` · `6.3 feasibility + plan preview` · `6.4 Today + task detail + hint chain + stuck timer` · `6.5 charts V1/V2/V5` · `6.6 skill map V4 + impact simulator V3 + recovery screen`

### Phase 7 — Hardening (3 tickets)
`7.1 offline layer (IDB persist + mutation queue)` · `7.2 PostHog events per spec §17` · `7.3 Playwright: onboard→plan, complete task, miss day→impact, weekly recompute`

**Critical path:** 0.1 → 0.2 → 1.1–1.8 → 1.9 → 2.x → 4.x → 6.x. Content (Phase 3) must complete before 4.2 can be integration-tested.

---
---

# `03-TOKEN-OPTIMIZATION.md`

## 1. The Cost Model

Agent cost is dominated not by output but by **context re-read**. A naive build of this system loads the full spec (~18k tokens) plus wandering file exploration (~15k) into every one of 26 tickets across ~4 iterations each — roughly **3.4M input tokens** before a line ships. The techniques below reduce that to **~600k**, an ~82% reduction, while *improving* output quality because the model reasons over less irrelevant material.

The governing principle:

> **Never let an agent read a file to learn something a type signature could have told it.**

---

## 2. Context Budget Hierarchy

| Tier | Budget | Contents | Loaded |
|---|---|---|---|
| **T0 — Always** | ≤1,200 tok | `AGENTS.md` (conventions, dependency rules, commands) | Every session |
| **T1 — Contracts** | ≤3,000 tok | `packages/contracts/src/index.ts` type surface only | Every implementation ticket |
| **T2 — Ticket** | ≤4,000 tok | Ticket card: goal, file allowlist, acceptance criteria, fixture paths | Per ticket |
| **T3 — Files** | ≤6,000 tok | Only files on the allowlist | Per ticket |
| **T4 — On demand** | unbounded | Spec sections, fetched by explicit reference (`docs/02-LLD.md §5.3`) | Rare |

**Hard rule:** if a ticket needs more than T0+T1+T2+T3 ≈ 14k tokens, it is too big. Split it.

---

## 3. Structural Techniques

### 3.1 The pure-domain firewall (largest single win)
`packages/domain` imports nothing but `contracts`, `zod`, `luxon`. An agent implementing `project()` never needs to see Drizzle, tRPC, React, or the job runner. Nine of the highest-difficulty tickets each run in ~8k tokens instead of ~40k.

**Saves ~290k tokens.**

### 3.2 Contract-first, then parallel
Ticket 0.2 writes every type once. Afterwards, no ticket reads another ticket's implementation — only its exported types. This eliminates the "read three files to understand the shape" pattern that dominates naive agent runs.

**Saves ~180k tokens.**

### 3.3 File allowlists, never search
Every ticket card ships an explicit list of paths the agent may open. Searching is banned:

```
ALLOWLIST (read + write):
  packages/domain/src/impact/*.ts
  packages/domain/src/impact/__tests__/*.ts
READ-ONLY:
  packages/contracts/src/projection.ts
FORBIDDEN: everything else. If you believe you need another file, STOP and report.
```

Semantic search over a monorepo routinely burns 8–20k tokens returning mostly-irrelevant chunks.

**Saves ~200k tokens.**

### 3.4 Golden fixtures as specification
Behavioural specs are JSON, not prose:

```json
// fixtures/impact/slip-unabsorbed.json
{ "name": "3h missed, 1h buffer, 6h/wk over 3 days",
  "input":  { "missedHours": 3, "remainingBufferHours": 1,
              "profile": { "committedHoursPerWeek": 6, "activeDays": [1,3,5] } },
  "expect": { "absorbed": false, "unabsorbedHours": 2, "slipCalendarDays": 3 } }
```

A fixture is ~90 tokens and unambiguous. The prose paragraph describing the same rule is ~180 tokens and open to interpretation — which causes re-work, the real cost.

**Saves ~60k tokens plus roughly one iteration per algorithmic ticket.**

### 3.5 Deterministic naming
Path is derivable from concept, so the agent never searches:
- Domain function `foo` → `packages/domain/src/<area>/<kebab-foo>.ts`
- Its test → same dir, `__tests__/<kebab-foo>.test.ts`
- Its fixtures → `fixtures/<area>/<kebab-foo>/*.json`
- tRPC procedure `x.y` → `apps/web/server/routers/x.ts`, export `y`
- Table `foo_bars` → `packages/db/src/schema/<aggregate>.ts`, export `fooBars`

### 3.6 No barrel re-exports below the package root
`import { x } from '../../index'` drags an entire module graph into context. Only each package's top-level `index.ts` may re-export; internal imports are always direct paths. Enforced by ESLint.

### 3.7 300-LOC file ceiling
Enforced. A 900-line file costs ~12k tokens to load and ~12k to rewrite; three 300-line files cost 4k each and only one usually needs touching.

---

## 4. Session Protocol

| Rule | Reason |
|---|---|
| **One ticket per session. Always start fresh.** | A 10-turn thread carries every prior turn into every subsequent request. Cost grows quadratically for zero benefit. |
| **Max 3 iterations, then escalate to human.** | An agent failing three times is missing context, not effort. Further attempts are pure waste. |
| **Diff-only output.** | "Return a unified diff. No explanation, no summary, no restated code." Cuts output tokens ~60% and eliminates copy-paste errors. |
| **Tests before implementation, same session.** | Writing tests first forces the agent to load fixtures once and serves as its own verification loop. |
| **After merge: append 5 lines to `CHANGELOG-AGENT.md`.** | This file — never the git log, never the diff — is the only history any future agent reads. |

### `CHANGELOG-AGENT.md` entry format
```
## T1.7 impact engine  [merged 2025-xx-xx]
Added: velocity(EWMA α=0.5), decayPenalty(k=0.08 cap 3×), project(), computeLevers()
Exports: packages/domain/src/impact/index.ts
Decision: projection.confidence is 'low' when <2 weeks history — UI must render a range
Gotcha: slipCalendarDays uses active-day density, not raw calendar days
Next tickets may assume: Projection type is stable
```
~80 tokens replaces a 4k-token diff review.

---

## 5. Model Routing

Match model capability to ticket class. Uniform routing to a frontier model is the second-largest source of waste after context bloat.

| Ticket class | Model tier | Tickets | Why |
|---|---|---|---|
| Algorithms, orchestrators, state machines | **Frontier** | 1.1–1.9, 5.2 | Subtle correctness; failures are expensive and hard to detect |
| API routers, repositories, job handlers | **Mid** | 2.4, 4.x, 5.1 | Mechanical given types; typecheck catches errors |
| Schema, config, scaffolding, UI components | **Small/fast** | 0.x, 2.1–2.3, 6.x | Highly patterned, abundant in training data |
| Content YAML authoring | **Mid + human review** | 3.x | Judgement-heavy but low technical risk; correctness gated by CI validator |
| Test generation from existing fixtures | **Small/fast** | all | Purely mechanical |

**Saves an estimated 55–65% of spend at equal quality.**

---

## 6. Prompt Caching

Order every request so the stable prefix is byte-identical across a phase, maximising cache hits:

```
[1] AGENTS.md                    ← identical always            CACHED
[2] contracts type surface       ← identical within a phase    CACHED
[3] phase conventions block      ← identical within a phase    CACHED
──────────────── cache boundary ────────────────
[4] ticket card                  ← varies
[5] allowlisted files            ← varies
[6] instruction                  ← varies
```

Never interleave variable content into the prefix. Regenerating `[2]` mid-phase invalidates the cache for every subsequent ticket in that phase.

**Typical saving at cached-read pricing: 70–90% on the prefix, which is ~35% of total input.**

---

## 7. Generate, Don't Write

| Artifact | Source of truth | Generator |
|---|---|---|
| DB types | Drizzle schema | `drizzle-kit` inference |
| Migrations | Drizzle schema | `drizzle-kit generate` — **agents must never hand-write SQL migrations** |
| API client types | tRPC router | Inferred, zero codegen |
| Runtime validators | Zod schemas in `contracts` | Reused directly |
| Seed data | `content/*.yaml` | Loader script |
| Test data builders | Zod schemas | `zod-fixture` |

Anything generated is anything an agent never spends tokens producing — and never gets subtly wrong.

---

## 8. `AGENTS.md` Template (the only always-loaded file — keep under 120 lines)

```md
# Agent Instructions

## Commands
pnpm typecheck | pnpm test | pnpm test:unit --filter domain | pnpm lint | pnpm db:generate

## Dependency rule (lint-enforced — violation = build failure)
content → contracts
domain  → contracts            # NEVER db, content, or apps
db      → contracts, domain
apps    → all

## Non-negotiable invariants
1. packages/domain is PURE. No I/O, no Date.now(), no randomness.
   Time and IDs are always injected as parameters.
2. schedule_snapshots is APPEND-ONLY. Never UPDATE or DELETE.
3. All plan mutations occur in one transaction ending with a snapshot write.
4. All date logic uses Luxon with an explicit IANA zone. Never `new Date()`.
5. Max 3 overdue items are ever surfaced to a learner. Never punitive copy.
6. Every task template must have a non-empty successCriterion. CI enforces this.
7. Max 300 lines per file.
8. No barrel re-exports below package root.

## Conventions
- Files: kebab-case. Types: PascalCase. Functions: camelCase.
- Tests colocated in __tests__/<name>.test.ts
- Fixtures in fixtures/<area>/<name>/*.json — read them, do not invent cases
- All exported functions need explicit return types
- Errors: throw typed DomainError, never a bare string

## Working protocol
- Touch ONLY files on your ticket's allowlist. Need another? STOP and report.
- Do not search the codebase. Everything you need is listed.
- Write tests first, then implementation.
- Output a unified diff. No prose, no summary, no restated code.
- On completion append 5 lines to CHANGELOG-AGENT.md in the standard format.
- Read docs/ only when a ticket cites a specific section.
```

---

## 9. Ticket Card Template

```md
# T1.7 — Impact & Projection Engine
Model tier: FRONTIER
Est. context: 9k tokens

## Goal
Implement velocity, decayPenalty, project, immediateImpact, computeLevers
as pure functions per docs/02-LLD.md §4 (impact block).

## Allowlist
WRITE:     packages/domain/src/impact/{velocity,decay-penalty,project,levers,index}.ts
           packages/domain/src/impact/__tests__/*.ts
READ-ONLY: packages/contracts/src/projection.ts
FIXTURES:  fixtures/impact/**/*.json   (12 golden cases — do not add cases)

## Formulas (complete — do not consult other docs)
velocity = EWMA(weeklyCompletedHours, α=0.5); weeks 1–2 → committedHoursPerWeek
decayPenalty = Σ baseReviewMinutes × min(1 + 0.08 × daysOverdue, 3)
remainingHours = Σ incompleteEstimates + debtHours + decayPenalty
projectedWeeks = remainingHours / max(velocity, 0.5)
slipCalendarDays = ceil((unabsorbedHours / (weeklyCapacity / activeDays.length))
                        × 7 / activeDays.length)
confidence = weeksOfHistory < 2 ? 'low' : weeksOfHistory <= 4 ? 'medium' : 'high'

## Acceptance
- [ ] All 12 fixtures pass
- [ ] pnpm typecheck && pnpm lint clean
- [ ] Zero imports outside contracts/zod/luxon
- [ ] No Date.now() — `today` is a parameter
- [ ] Blackout ranges excluded from projected calendar dates

## Out of scope
Persistence, tRPC, UI, snapshot writing.
```

---

## 10. Measurement

Track per merged ticket and review weekly:

| Metric | Target | Action if breached |
|---|---|---|
| Input tokens / merged ticket | < 25k | Tighten allowlist; split ticket |
| Iterations to merge | ≤ 2 | Ticket card is under-specified — add fixtures |
| Cache hit rate on prefix | > 70% | Prefix is being mutated mid-phase |
| Allowlist violations | 0 | Ticket scope is wrong |
| Files touched / ticket | ≤ 6 | Split ticket |
| Rework rate (reverted merges) | < 10% | Move ticket class to a higher model tier |

---

## 11. Anti-Patterns

| Anti-pattern | Cost | Do instead |
|---|---|---|
| Pasting the full spec into every prompt | ~18k tok × 100 calls = 1.8M | Cite sections; inline only the needed formulas |
| "Explore the codebase and figure out where this goes" | 10–25k tok, frequently wrong | File allowlist |
| Long-running chat threads | Quadratic growth | One ticket, one session |
| Agent hand-writing SQL migrations | Silent schema drift | `drizzle-kit generate` only |
| Frontier model for CRUD and UI | 8–15× overspend | Route by ticket class |
| Prose behavioural specs | Ambiguity → re-work | Golden JSON fixtures |
| Asking for explanation with the diff | +40% output | Diff only |
| Agent inventing test cases | Untested edges, redundant tests | Fixtures are the spec; adding cases is out of scope |
| One 1,200-line "planner.ts" | Every edit reloads 16k tok | 300-LOC ceiling |
| Letting an agent choose a library | Inconsistency across tickets | Stack is fixed in `01-STACK.md`; deviation is a lint failure |

---

## 12. Projected Budget

| Phase | Tickets | Model tier | Est. input tokens |
|---|---|---|---|
| 0 Scaffold | 3 | small | 25k |
| 1 Domain | 9 | frontier | 190k |
| 2 Persistence | 4 | mid | 55k |
| 3 Content | 5 | mid | 120k |
| 4 API | 5 | mid | 70k |
| 5 Worker | 2 | frontier/mid | 35k |
| 6 UI | 6 | small | 85k |
| 7 Hardening | 3 | mid | 40k |
| **Total** | **37** | | **~620k** |

Against a naive baseline of ~3.4M input tokens at uniform frontier routing, this is roughly an **80% token reduction and an ~88% cost reduction** — with fewer defects, because every agent sees only what it needs.

---

**Recommended next step:** author Ticket 0.2 (`packages/contracts`) yourself or with a frontier model and review it line by line. Every subsequent ticket depends on those types being right, and it is the single highest-leverage artifact in the build.
