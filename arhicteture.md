# Product Specification v1.0 — Adaptive Deep Learning Study Planner

**Status:** Implementation-ready draft. Stack-agnostic.
**Purpose:** Enable a development agent to begin building without further clarification on domain logic, data models, algorithms, or screens.

---

## 1. Product Scope

### 1.1 One-line definition
A self-study system that converts a learner's goal, available time, and verified prior knowledge into a day-by-day executable deep-learning curriculum, and continuously re-projects the completion date as the learner slips or accelerates.

### 1.2 v1 In Scope
- Onboarding questionnaire + adaptive diagnostic
- Skill-graph-based plan generation against a curated resource library
- Daily task feed with objective success criteria
- Overdue handling with automatic debt reallocation
- Schedule Impact Engine + visualisations
- Spaced retrieval scheduling
- Weekly recompute and replan
- Progress dashboard

### 1.3 v1 Out of Scope
Social/community, cohorts, payments, mobile native apps, live web resource discovery, LLM-authored curriculum structure, code execution/grading sandbox, certificates.

### 1.4 Primary Persona (v1 target)
Working software developer, comfortable in Python, weak or rusty math, goal = applied DL/LLM competence, 6–12 hours/week, 12–24 week horizon.

---

## 2. Domain Model

### 2.1 Entity relationship overview

```
Learner ──1:1── LearnerProfile
        └─1:1── Plan ──1:N── PlanWeek ──1:N── TaskInstance ──1:N── Attempt
                  │
                  └─1:N── MasteryState ──N:1── SkillNode
SkillNode ──N:N── SkillNode (prerequisite edges, DAG)
SkillNode ──1:N── TaskTemplate ──N:1── Resource
SkillNode ──1:N── RetrievalItem ──1:N── ReviewInstance
Plan ──1:N── ScheduleSnapshot   (immutable, for trajectory viz)
Plan ──1:N── DebtItem
```

### 2.2 Core schemas

```yaml
Learner:
  id: uuid
  timezone: IANA string          # required for midnight rollover
  created_at: timestamp
  status: onboarding | active | paused | completed | churned

LearnerProfile:
  learner_id: uuid
  goal_archetype: enum
  depth_rung: 1..4
  domain_focus: enum
  target_date: date
  deadline_type: hard | soft
  committed_hours_per_week: float
  active_days: [MON..SUN]
  session_length_minutes: int
  compute_tier: cpu_only | apple_silicon | local_gpu | cloud_paid
  budget_tier: free | under_30 | flexible
  format_preference: video_lean | text_lean | balanced
  notation_tolerance: low | medium | high
  challenge_preference: gentle | balanced | aggressive
  prior_failure_mode: enum
  accountability_mode: solo | streak | public
  blackout_ranges: [{start, end, reason}]

SkillNode:
  id: string                     # e.g. "dl.backprop_manual"
  title: string
  layer: 0..5
  estimated_hours: float
  prerequisites: [skill_node_id]
  is_threshold_concept: bool
  domain_tags: [core | cv | nlp | rl | tabular]
  min_depth_rung: 1..4           # excluded if learner rung < this
  diagnostic_item_ids: [uuid]
  verification_task_id: uuid     # cheap check when pruned via self-report

MasteryState:
  learner_id, skill_node_id
  state: unknown | not_started | in_progress | partial | mastered | decaying
  confidence: 0.0..1.0
  source: self_report | diagnostic | task_completion | retrieval
  last_evidence_at: timestamp

Resource:
  id: uuid
  title, url, provider
  format: video | article | interactive | notebook | paper | docs | exercise
  start_seconds: int | null      # timestamped segments only
  end_seconds: int | null
  duration_minutes: int
  level: 0..3
  cost: free | paid
  requires_gpu: bool
  framework: pytorch | none | other
  notation_heaviness: low | medium | high
  skill_node_ids: [string]
  quality_score: 1..5
  last_verified_at: date
  status: active | broken | deprecated

TaskTemplate:
  id: uuid
  skill_node_id: string
  sequence_index: int
  type: enum (see §7.1)
  scaffold_level: worked_example | completion | parsons | independent
  estimated_minutes: int
  resource_id: uuid | null
  instruction_md: string
  success_criterion: string      # REQUIRED, objective
  starter_asset_url: string | null
  hint_chain: [string]
  deliverable_type: none | file | number | screenshot | text
  is_optional: bool              # trimmable under compression
  min_depth_rung: 1..4

TaskInstance:
  id: uuid
  plan_id, task_template_id
  scheduled_date: date
  original_scheduled_date: date
  state: enum (see §9.1)
  reschedule_count: int
  actual_minutes: int | null
  difficulty_rating: 1..5 | null
  completed_at: timestamp | null

DebtItem:
  id, plan_id, task_instance_id
  hours: float
  created_on: date
  priority: blocking | normal | optional
  resolution: pending | rescheduled | dropped | absorbed

ScheduleSnapshot:               # append-only, powers trajectory chart
  plan_id, captured_on: date
  cumulative_planned_hours: float
  cumulative_completed_hours: float
  projected_completion_date: date
  velocity_hours_per_week: float
  debt_hours: float
```

---

## 3. Onboarding Specification

**Constraint:** ≤ 12 questions + ≤ 10 diagnostic items. Target completion time ≤ 6 minutes. Progress bar mandatory. All questions skippable except Q1, Q4, Q5, Q6.

### 3.1 Question set (exact copy)

| # | Question | Type | Options | Maps to |
|---|---|---|---|---|
| 1 | **What do you want to be able to do at the end?** | single | Ship an AI feature at work · Pass ML engineer interviews · Read and reproduce research papers · Apply DL to data in my field · Build a portfolio project · Understand how modern AI actually works | `goal_archetype` → terminal node set |
| 2 | **How deep do you need to go?** | single | Use existing models via APIs · Fine-tune models on my own data · Train models from scratch and understand internals · Contribute novel research | `depth_rung` → node filter |
| 3 | **What kind of data or problems interest you most?** | single | Text & language models · Images & vision · Tabular/business data · Audio · Reinforcement learning · Not sure yet — recommend for me | `domain_focus` → DAG branch |
| 4 | **When do you want to be done?** | date + toggle | Date picker; "This is a hard deadline / a rough target" | `target_date`, `deadline_type` |
| 5a | **In the last 7 days, roughly how many hours did you actually spend learning something technical?** | number | 0–40 | anchor for realism check |
| 5b | **How many hours per week can you realistically commit going forward?** | number | 0–40 | `committed_hours_per_week` |
| 6 | **Which days will you study, and for how long per session?** | multi + single | Day chips; 25 / 45 / 60 / 90 / 120 min | `active_days`, `session_length_minutes` |
| 7 | **Which of these are true about your Python?** | checklist | I write Python weekly · I can write a class with methods without looking it up · I use list comprehensions naturally · I'm comfortable with numpy arrays and broadcasting · I use git branches · I've debugged with a debugger, not just prints · None of these | prunes L0 nodes |
| 8 | **Which of these are true about your math?** | checklist | I know what a vector and a matrix are · I can multiply matrices and reason about shapes · I know what a derivative measures · I can apply the chain rule · I know what a partial derivative is · I'm comfortable with probability distributions · Reading math notation doesn't scare me · None of these | prunes L1, sets `notation_tolerance` |
| 9 | **Which of these have you actually done?** | checklist | Trained a model with scikit-learn · Explained why we use a validation set · Written a PyTorch/TF training loop · Implemented backprop by hand · Fine-tuned a pretrained model · Read a DL paper end to end · Deployed a model · None of these | prunes L2/L3 |
| 10 | **What hardware and budget do you have?** | 2× single | CPU only / Apple Silicon / NVIDIA GPU / I'll pay for cloud — and — Free resources only / Up to $30/mo / Budget is flexible | `compute_tier`, `budget_tier` → resource filter |
| 11 | **Have you tried learning this before? What happened?** | single | First attempt · Got stuck on the math · Endless tutorials, couldn't build anything myself · Lost motivation after a few weeks · Ran out of time · Finished courses but can't apply it | `prior_failure_mode` → intervention preset (§3.3) |
| 12 | **Two quick preferences** | 2× single | Video-heavy / Text-heavy / Mix — and — Just me / Streaks and reminders / Public commitment | `format_preference`, `accountability_mode` |

### 3.2 Realism check (blocking modal)

```
if Q5b > (Q5a + 5) and Q5a < 3:
    show: "You said you spent {Q5a}h last week but plan {Q5b}h/week.
           Most plans fail here. We suggest starting at {Q5a + 2}h and
           increasing once you have a 2-week streak."
    options: [Use suggested {Q5a+2}h]  [Keep {Q5b}h, I'm sure]
```

### 3.3 Failure-mode intervention presets

| `prior_failure_mode` | Applied configuration |
|---|---|
| `stuck_on_math` | Math nodes always concreteness-faded (visual→code→formal); `notation_tolerance` capped at `low` for first 4 weeks; math delivered just-in-time, never as a front-loaded block |
| `tutorial_hell` | Scaffold ladder advances faster; ratio of `independent`/`build` tasks raised to ≥50% from week 2; no task may be pure `watch` for more than 2 consecutive days |
| `lost_motivation` | Week 1 ends with a shippable artifact; daily load capped at 80% of stated capacity; streak + reminders forced on; earliest possible "whole game" demo task |
| `ran_out_of_time` | Aggressive scope narrowing offered upfront; 25-min task granularity; buffer raised to 30% |
| `cant_apply_it` | Every skill node terminates in a `transfer` task using a novel dataset, not the tutorial's |
| `first_attempt` | Defaults |

### 3.4 Adaptive diagnostic

**Selection algorithm:**
```
candidate_nodes = nodes on the goal path where self_report is ambiguous
                  (checked in Q7–9 but at the boundary of the pruned frontier)
select up to 10 items, prioritising:
  1. threshold concepts
  2. nodes with the largest downstream subtree (highest pruning value)
  3. nodes where self-report and depth_rung conflict
adaptive rule: if item at level N is answered correctly, next item = level N+1
               on the same branch; if wrong, drop to N-1 or exit branch
```

**Item types (mix required):** 3× "what does this code output / what's the bug", 3× conceptual multiple-choice with plausible distractors, 2× shape/dimension reasoning, 2× "which is the correct next step". Avoid pure recall.

**Mastery inference:**
```
confidence = 0.4 * self_report_signal + 0.6 * diagnostic_signal

state = mastered   if confidence >= 0.75
        partial    if 0.40 <= confidence < 0.75
        not_started if confidence < 0.40
        unknown    if no evidence and node not probed
```

**Mandatory rule:** every node pruned as `mastered` on self-report alone (no diagnostic item) must have its `verification_task_id` inserted into Week 1 as a ≤15-min task. If it fails, the node and its dependents are re-inserted at the next weekly recompute.

---

## 4. Skill Graph (v1 seed content)

Directed acyclic graph. `min_depth_rung` gates inclusion. Hours are median estimates for the target persona.

### Layer 0 — Foundations (conditional)
| ID | Title | Hrs | Prereqs |
|---|---|---|---|
| `py.core` | Python syntax, functions, control flow | 8 | — |
| `py.oop` | Classes, methods, dunder basics | 4 | py.core |
| `py.env` | venv/conda, pip, CLI basics | 2 | py.core |
| `tools.git` | git add/commit/branch/merge | 3 | — |
| `np.arrays` | numpy arrays, indexing, broadcasting | 6 | py.core |
| `pd.basics` | pandas load/filter/groupby | 5 | np.arrays |

### Layer 1 — Math (just-in-time)
| ID | Title | Hrs | Prereqs |
|---|---|---|---|
| `math.linalg.vectors` | Vectors, matrices, geometric intuition | 6 | — |
| `math.linalg.matmul` | Matmul, shapes, dimension reasoning | 4 | math.linalg.vectors |
| `math.calc.derivatives` | Derivatives as rate of change | 4 | — |
| `math.calc.chainrule` | Chain rule, partial derivatives | 5 | math.calc.derivatives |
| `math.calc.gradients` | Gradients, gradient fields | 4 | math.calc.chainrule, math.linalg.vectors |
| `math.prob.basics` | Probability, conditional probability | 5 | — |
| `math.prob.distributions` | Distributions, expectation, likelihood | 4 | math.prob.basics |
| `math.opt.gd` | Gradient descent, learning rate, convexity | 4 | math.calc.gradients |

### Layer 2 — Classical ML
| ID | Title | Hrs | Prereqs |
|---|---|---|---|
| `ml.framing` | Supervised/unsupervised, features, labels | 3 | np.arrays |
| `ml.splits` | Train/val/test, leakage, cross-validation | 3 | ml.framing |
| `ml.generalization` ⚠ | Overfitting, bias-variance, regularization | 4 | ml.splits |
| `ml.metrics` | Accuracy, precision/recall, ROC, calibration | 4 | ml.splits |
| `ml.linreg` | Linear regression end to end | 4 | math.opt.gd, ml.framing |
| `ml.logreg` | Logistic regression, cross-entropy | 4 | ml.linreg, math.prob.basics |
| `ml.sklearn` | Pipelines, preprocessing, model selection | 4 | ml.metrics |

### Layer 3 — Deep Learning Core
| ID | Title | Hrs | Prereqs |
|---|---|---|---|
| `dl.mlp` | Perceptron → MLP, layers, forward pass | 5 | ml.logreg, math.linalg.matmul |
| `dl.activations` | ReLU, sigmoid, softmax, why non-linearity | 3 | dl.mlp |
| `dl.losses` | MSE, cross-entropy, loss selection | 4 | dl.activations |
| `dl.backprop` ⚠ | Backprop from scratch, manual gradients | 8 | dl.losses, math.calc.chainrule |
| `dl.autograd` | Computational graphs, autograd mechanics | 5 | dl.backprop |
| `dl.trainloop` | PyTorch training loop, device handling | 6 | dl.autograd, py.oop |
| `dl.optimizers` | SGD, momentum, Adam, LR schedules | 5 | dl.trainloop, math.opt.gd |
| `dl.data` | Dataset/DataLoader, batching, collation | 4 | dl.trainloop |
| `dl.norm_init` | Initialization, BatchNorm/LayerNorm | 5 | dl.optimizers |
| `dl.regularization` | Dropout, weight decay, augmentation, early stop | 4 | dl.norm_init, ml.generalization |
| `dl.debugging` ⚠ | Systematic debugging recipe, failure taxonomy | 8 | dl.regularization |
| `dl.tracking` | Experiment tracking, reproducibility, seeds | 3 | dl.trainloop |

### Layer 4 — Domain branches

**NLP / LLM** (`domain_focus = text`)
| ID | Title | Hrs | Prereqs |
|---|---|---|---|
| `nlp.tokenization` | Tokenizers, BPE, vocabularies | 4 | dl.data |
| `nlp.embeddings` | Embeddings, similarity, embedding layers | 5 | nlp.tokenization, dl.mlp |
| `nlp.seq` | Sequence modelling, RNN/LSTM (context only) | 5 | nlp.embeddings |
| `attn.self_attention` ⚠ | Q/K/V, scaled dot-product, multi-head | 8 | nlp.embeddings, dl.debugging |
| `tf.block` | Transformer block, residuals, positional encoding | 8 | attn.self_attention, dl.norm_init |
| `tf.pretrain_finetune` | Pretraining objectives, fine-tuning | 6 | tf.block |
| `llm.apis` | Prompting, APIs, structured output | 4 | nlp.tokenization |
| `llm.peft` | LoRA/QLoRA, parameter-efficient tuning | 6 | tf.pretrain_finetune |
| `llm.rag` | Retrieval-augmented generation, vector stores | 6 | nlp.embeddings, llm.apis |
| `llm.eval` | Evaluation, benchmarks, LLM-as-judge pitfalls | 5 | llm.apis, ml.metrics |

**Vision** (`domain_focus = images`)
| ID | Title | Hrs | Prereqs |
|---|---|---|---|
| `cv.convolution` | Convolution, kernels, stride, padding | 6 | dl.data |
| `cv.architectures` | ResNet, skip connections, modern CNNs | 5 | cv.convolution, dl.norm_init |
| `cv.transfer` | Transfer learning, freezing, fine-tuning | 5 | cv.architectures |
| `cv.augmentation` | Augmentation strategies | 3 | cv.transfer |
| `cv.vit` | Vision transformers | 6 | cv.architectures, attn.self_attention |

### Layer 5 — Practice & Deployment
| ID | Title | Hrs | Prereqs | Rung |
|---|---|---|---|---|
| `prac.dataset` | Dataset curation, labelling, splits in the wild | 5 | dl.data | 2 |
| `prac.evalharness` | Building an eval harness before optimising | 5 | ml.metrics, dl.tracking | 2 |
| `deploy.serving` | Inference APIs, batching, latency | 6 | dl.trainloop | 2 |
| `deploy.optimize` | Quantization, distillation, ONNX | 5 | deploy.serving | 3 |
| `prac.papers` | Reading papers systematically | 6 | dl.debugging | 3 |
| `prac.reproduce` | Reproduce a paper's core result | 20 | prac.papers, prac.evalharness | 3 |
| `capstone` | Original end-to-end project | 30 | branch terminal nodes | 1 |

⚠ = threshold concept: never auto-pruned by self-report alone; always diagnostic-verified; always allocated extra retrieval density.

**Reference totals:** Rung 2 / NLP path ≈ 165h excluding L0. Rung 3 / NLP ≈ 240h. Full including L0/L1 from zero ≈ 310h.

---

## 5. Plan Generation Algorithm

```
FUNCTION generate_plan(profile, mastery_states):

  # 1. Terminal objective resolution
  terminal_nodes = GOAL_MAP[profile.goal_archetype][profile.domain_focus]

  # 2. Ancestor closure
  required = transitive_closure_of_prerequisites(terminal_nodes)

  # 3. Depth filter
  required = [n for n in required if n.min_depth_rung <= profile.depth_rung]

  # 4. Mastery pruning
  FOR n IN required:
      IF mastery[n].state == 'mastered' AND NOT n.is_threshold_concept:
          prune n
          IF mastery[n].source == 'self_report':
              queue verification_task(n) into week 1
      IF mastery[n].state == 'partial':
          keep n, reduce estimated_hours × 0.5, start at scaffold=completion

  # 5. Topological sort
  #    tie-break by: (a) unlocks-most-descendants, (b) motivational value
  #                  (early "whole game" tasks), (c) threshold concepts earlier
  ordered = topo_sort(required, tiebreak=priority_fn)

  # 6. Feasibility check
  required_hours = sum(n.estimated_hours for n in ordered)
  weeks_available = weeks_between(today, profile.target_date)
                     - blackout_weeks
  capacity = profile.committed_hours_per_week * weeks_available
  usable   = capacity * (1 - BUFFER_RATIO)      # BUFFER_RATIO default 0.20

  IF required_hours > usable:
      RETURN FeasibilityNegotiation(
        gap_hours = required_hours - usable,
        option_extend  = date + ceil(gap / weekly_capacity) weeks,
        option_intensify = required_hours / (weeks_available * 0.8),
        option_narrow  = droppable_subtrees_ranked_by_hours,
        option_lower_rung = plan_at(depth_rung - 1)
      )   # BLOCKING — learner must choose before plan is created

  # 7. Task expansion
  FOR n IN ordered:
      templates = task_templates(n)
                    filtered by depth_rung, compute_tier, budget_tier
      resource-matched on format_preference, notation_tolerance, level
      scaffold ladder applied per §7.2

  # 8. Calendar placement  (see §8)
  # 9. Retrieval injection  (see §10)
  # 10. Emit Plan + PlanWeeks + TaskInstances + initial ScheduleSnapshot
```

**Resource matching score:**
```
score = 0.30 * format_match
      + 0.25 * quality_score_norm
      + 0.20 * level_fit(|resource.level - learner_level|)
      + 0.15 * notation_fit
      + 0.10 * duration_fit(session_length)
constraints (hard): cost <= budget_tier
                    requires_gpu <= compute_tier
                    status == 'active'
```

---

## 6. Feasibility Negotiation Screen

Presented before any plan exists. Four options, each with a live number:

| Option | Displayed |
|---|---|
| **Extend the deadline** | "Finish by **{new_date}** instead of {target_date} — {n} weeks later" |
| **Study more each week** | "Keep {target_date} by moving from {current}h → **{needed}h/week**" |
| **Narrow the scope** | "Keep {target_date} by dropping: {subtree_names} — saves {n}h. You'd reach {reduced_capability}" |
| **Aim one level shallower** | "Target *{rung-1 description}* instead — {n}h, finishes {date}" |

Never generate a plan that requires >100% of stated capacity.

---

## 7. Task Model

### 7.1 Task types

| Type | Purpose | Typical mins | Deliverable |
|---|---|---|---|
| `watch` | Acquire model of the concept | 15–40 | none |
| `read` | Acquire concept / reference | 15–40 | none |
| `predict` | State expected output before running (PRIMM) | 5–10 | text |
| `code_along` | Reproduce with the source | 25–45 | file |
| `parsons` | Reorder scrambled correct code | 10–15 | ordering |
| `completion` | Fill blanked sections of working code | 20–40 | file |
| `modify` | Change behaviour of working code | 20–40 | file |
| `build` | Write from spec, unaided | 45–90 | file |
| `debug` | Fix deliberately broken code | 20–45 | file |
| `retrieve` | Answer from memory, closed-book | 5–10 | text |
| `transfer` | Apply to a novel dataset/problem | 45–90 | file |
| `reflect` | Weekly written self-explanation | 10–15 | text |
| `verify` | Confirm a self-reported pruned skill | ≤15 | number |

### 7.2 Scaffold ladder (per skill node)

```
worked_example → completion → parsons(optional) → independent → transfer
```

Advancement rules:
- Advance one rung when the previous task completes with `difficulty_rating ≤ 3`.
- Hold rung when `difficulty_rating = 4`.
- Drop one rung and insert a remedial task when `difficulty_rating = 5` or the task is abandoned.
- `challenge_preference = aggressive` → start one rung higher.
- `prior_failure_mode = tutorial_hell` → maximum 1 consecutive `watch`/`read`/`code_along`.

### 7.3 Mandatory task properties
Every `TaskInstance` rendered to the learner must display: estimated minutes, a single primary resource with timestamps where applicable, an objective **success criterion**, and a **stuck protocol**.

**Stuck protocol (universal default):**
```
1. Attempt for {estimated_minutes × 0.6}
2. Open hint 1
3. Attempt {+10 min}
4. Open hint 2 / reference solution
5. At {estimated_minutes × 1.5}: mark PARTIAL, move on, auto-flag for weekly review
```
Unbounded struggle is a churn event and must be structurally prevented.

---

## 8. Scheduling Engine

### 8.1 Placement algorithm

```
daily_capacity_minutes = (committed_hours_per_week * 60) / len(active_days)
effective_daily = daily_capacity_minutes * (1 - BUFFER_RATIO)

FOR each active_day in chronological order (skipping blackouts):
    fill with next tasks while sum(estimated_minutes) <= effective_daily
    constraints:
      - never split a task across days
      - never schedule a task whose prerequisites are unfinished
      - max 1 task of type 'watch' per day unless total <30 min
      - every day ends with a task that has a concrete deliverable
      - 1 designated FLEX day per week: no new tasks, reserved for debt
      - week N ends with a `reflect` task + retrieval block
```

### 8.2 Buffer policy

| Buffer type | Default | Purpose |
|---|---|---|
| Daily headroom | 20% of session | Overrun absorption |
| Weekly flex day | 1 per week | Debt reallocation |
| Milestone buffer | 1 full week per 6 weeks | Consolidation + slip absorption |

`prior_failure_mode = ran_out_of_time` → raise `BUFFER_RATIO` to 0.30.

### 8.3 Horizon rendering
- **Days 1–14:** fully materialised TaskInstances, shown in detail.
- **Weeks 3–6:** week-level goals + task counts, tasks materialised on weekly recompute.
- **Beyond week 6:** milestones only.

Rationale: day-level detail for month 3 is fiction and creates false precision.

---

## 9. Overdue & Slip Handling

### 9.1 TaskInstance state machine

```
        ┌──────────────────────────────────────────┐
        ▼                                          │
   scheduled ──(date arrives)──> available ──> in_progress ──> completed
        │                            │                │
        │                            │                └──> partial
        │                            │
        │                       (midnight, TZ)
        │                            ▼
        │                         missed ──> rescheduled ──┘(back to scheduled)
        │                            │
        │                            └────> dropped (optional tasks only)
        │
        └──> deferred (learner-initiated) ──> rescheduled
        └──> skipped (learner asserts mastery) ──> triggers verify task
```

### 9.2 Nightly job (runs at learner-local 00:05)

```
1. available tasks not completed  →  state = missed
2. FOR each missed task: create DebtItem(hours, priority)
   priority = 'blocking' if it gates >=3 downstream nodes
              'optional' if template.is_optional
              else 'normal'
3. reallocate_debt():
     a. fill this week's remaining flex capacity, blocking first
     b. then next week's flex day
     c. then push into future weeks (triggers slip)
4. IF total_debt_hours > 1.5 * weekly_capacity: enter RECOVERY_MODE
5. IF consecutive_missed_days >= 3: enter RECOVERY_MODE
6. recompute_projection() and write ScheduleSnapshot
```

### 9.3 Anti-guilt rules (hard requirements)

- **Never display more than 3 overdue items.** Additional debt is silently reallocated and summarised as "+{n}h rescheduled."
- **Never show a red count badge >3.**
- **Never use punitive copy.** "Rescheduled," not "Failed" / "Overdue" / "Behind."
- Missing a day must **not** break a streak if the learner completes ≥1 task within a 48h window (grace rule).

### 9.4 Recovery Mode
Triggered per §9.2. Effects:
1. Interrupt with a single non-dismissible card offering the four impact options (§10.3).
2. Reduce next 7 days' load to 60% of nominal.
3. Drop all `is_optional` tasks from the next 2 weeks.
4. Insert one short high-success task on day 1 of recovery (self-efficacy repair — a mastery experience).
5. Exit when 3 consecutive scheduled tasks complete.

---

## 10. Schedule Impact Engine

### 10.1 Projection model

```
# Rolling velocity, exponentially weighted over last 3 weeks
velocity = EWMA(completed_hours_per_week, alpha=0.5)
           # cold start weeks 1-2: velocity = committed_hours_per_week

remaining_hours = Σ estimated_hours(tasks not completed)
                + debt_hours
                + decay_penalty

# Decay penalty: overdue retrieval reviews cost extra relearning time
decay_penalty = Σ over missed ReviewInstances:
                  base_review_minutes * (1 + DECAY_K * days_overdue)
                  capped at 3× base
                  DECAY_K default = 0.08

projected_weeks = remaining_hours / max(velocity, MIN_VELOCITY)
projected_completion = today + projected_weeks * 7 (calendar, skipping blackouts)
slip_days = projected_completion - original_target_date
```

### 10.2 Per-miss immediate impact (shown inline)

```
unabsorbed_hours = missed_hours - remaining_buffer_this_week

IF unabsorbed_hours <= 0:
    impact = "Absorbed — {remaining_buffer}h of flex left this week"
ELSE:
    hours_per_active_day = weekly_capacity / len(active_days)
    extra_active_days    = unabsorbed_hours / hours_per_active_day
    slip_calendar_days   = ceil(extra_active_days * 7 / len(active_days))
    impact = "+{slip_calendar_days} days → finish {new_date}"
```

### 10.3 The four levers (offered on material slip)

| Lever | Computation | Displayed |
|---|---|---|
| **Absorb** | Only offered if buffer ≥ debt | "No change. Uses {n}h of this week's flex." |
| **Push date** | `new_date = projected_completion` | "Finish {n} days later, on {date}." |
| **Compress** | `needed = remaining_hours / weeks_to_target` | "Hold {target_date} by studying {needed}h/week instead of {current}h." |
| **Trim** | rank `is_optional` + lowest-descendant subtrees until hours fit | "Hold {target_date} by dropping {list} — you'd skip {capability}." |

Learner choice is recorded and applied atomically. Never auto-select silently.

---

## 11. Data Visualisation Components

### V1 — Trajectory Chart (primary)
- **Type:** dual-line area chart, x = date, y = cumulative curriculum hours.
- **Series:**
  - `Plan` — solid grey, original committed trajectory.
  - `Actual` — solid accent, completed hours to date.
  - `Projection` — dashed, from today at current EWMA velocity to completion.
- **Annotations:** vertical marker at `original_target_date`; vertical marker at `projected_completion_date`; shaded region between them labelled `+{n} days` (amber) or `−{n} days` (green).
- **Interaction:** hover → date, hours completed vs planned, that week's velocity. Toggle to show milestone markers.
- **Data source:** `ScheduleSnapshot` series.

### V2 — Weekly Capacity Bars
- **Type:** stacked horizontal bars, one per week, 8-week window (2 past, current, 5 future).
- **Segments:** `completed` (accent) · `scheduled` (grey) · `carried debt` (amber) · `flex remaining` (hatched) · `overflow` (red, only when debt > capacity).
- **Purpose:** makes the debt-vs-buffer relationship legible at a glance.

### V3 — Impact Simulator (modal, interactive)
- **Trigger:** any material slip, or user-initiated "what if".
- **Controls:** hours/week slider; target-date picker; scope toggles per droppable subtree.
- **Output:** live-updating projected completion date, total remaining hours, and a delta readout. Renders the four levers from §10.3 as selectable cards.

### V4 — Skill Map
- **Type:** DAG rendered as a layered graph (layer = y-axis).
- **Node states by colour:** `locked` (prereqs incomplete) · `ready` · `in_progress` · `partial` · `mastered` · `decaying` (retrieval overdue).
- **Threshold concepts** rendered with a distinct border.
- **Interaction:** click a node → its tasks, mastery evidence, retrieval history.
- **Purpose:** primary motivational surface; makes invisible progress visible.

### V5 — Retention Heatmap (secondary)
- Calendar heatmap of daily completed minutes, plus a separate row of retrieval-quiz scores over time. Guards against the "completion ≠ learning" illusion.

---

## 12. Retrieval & Spacing

```
On skill node reaching state 'in_progress':
    generate ReviewInstances for its RetrievalItems at
    intervals [2, 7, 21, 60] days (FSRS-lite)

Interval adjustment:
    correct   → next interval × 2.2
    partial   → next interval × 1.0
    incorrect → reset to 2 days, and if this is the 2nd reset,
                re-open the skill node at scaffold=completion

Placement:  retrieval tasks are batched into a single 5–10 min
            block at the START of each session (not the end).
Cap:        max 10 items per day.
Overdue:    contributes to decay_penalty (§10.1) — this is how
            skipped review measurably moves the completion date.
```

---

## 13. Weekly Recompute (scheduled job, learner-local Sunday 18:00)

```
1. Compute velocity, adherence rate, mean difficulty rating, retrieval accuracy
2. Update MasteryState from completed tasks + retrieval outcomes
3. Adjust estimation model:
     est_multiplier = EWMA(actual_minutes / estimated_minutes)
     apply to all future task estimates for this learner
4. Adjust scaffolding:
     mean_difficulty <= 2.5 for 5+ tasks  → advance ladder, drop redundant scaffolds
     mean_difficulty >= 4.2               → insert remedial, lower ladder
5. Retrieval accuracy < 0.6 despite high completion
     → freeze new nodes for one week, insert consolidation week
6. Materialise weeks 3–4 into TaskInstances
7. Re-run projection; write ScheduleSnapshot
8. Emit weekly review digest (see §14, Screen 7)
```

**Constraint:** replanning happens weekly, not daily. Daily thrashing destroys learner trust in the plan.

---

## 14. Screen Inventory

| # | Screen | Key elements |
|---|---|---|
| 1 | Onboarding wizard | 12 questions, progress bar, realism check modal |
| 2 | Diagnostic | Adaptive items, no timer shown, "skip — I don't know" always available |
| 3 | Feasibility negotiation | Four lever cards with live numbers (§6) |
| 4 | Plan preview | Week-by-week outline, total hours, milestones, "Start" CTA |
| 5 | **Today** (default landing) | 1–4 task cards, retrieval block first, each with success criterion + stuck protocol; ≤3 rescheduled items; one-tap complete / defer / swap |
| 6 | Task detail | Instruction, embedded/linked resource with timestamps, hint chain (progressive disclosure), deliverable capture, difficulty rating on completion |
| 7 | Progress | V1 Trajectory + V2 Capacity bars + V4 Skill Map + streak + weekly digest |
| 8 | Impact simulator | Modal, V3 |
| 9 | Plan settings | Hours/week, active days, target date, pause/vacation mode, blackout ranges |
| 10 | Recovery mode | Single card, four options, empathetic copy, one easy win task |

---

## 15. API Surface (resource shape, transport-agnostic)

```
POST   /onboarding/responses
POST   /onboarding/diagnostic/next      → next adaptive item
POST   /onboarding/diagnostic/answer
POST   /plans/preview                   → feasibility result OR plan preview
POST   /plans                           → commit plan
GET    /plans/{id}
PATCH  /plans/{id}                      → hours, days, target_date, pause

GET    /tasks/today
GET    /tasks/{id}
POST   /tasks/{id}/start
POST   /tasks/{id}/complete             { actual_minutes, difficulty_rating, deliverable }
POST   /tasks/{id}/partial
POST   /tasks/{id}/defer                { to_date }
POST   /tasks/{id}/skip                 { reason }
POST   /tasks/{id}/swap                 → alternative resource/template
GET    /tasks/{id}/hints/{n}

GET    /reviews/due
POST   /reviews/{id}/answer

GET    /progress/trajectory             → ScheduleSnapshot series (V1)
GET    /progress/capacity               → weekly bars (V2)
GET    /progress/skillmap               → DAG + mastery states (V4)
GET    /progress/retention              → V5

POST   /impact/simulate                 { hours_per_week?, target_date?, drop_subtrees[] }
                                        → projected_date, remaining_hours, deltas
POST   /impact/apply                    { lever: absorb|push|compress|trim, params }

# Admin / content
GET|POST /admin/skill-nodes
GET|POST /admin/resources
POST     /admin/resources/verify        → link-health sweep
GET      /admin/resources/health        → broken / stale / low-swap-rate report
```

---

## 16. Background Jobs

| Job | Schedule | Function |
|---|---|---|
| `midnight_rollover` | Hourly (sweeps timezones at their local 00:05) | §9.2 |
| `weekly_recompute` | Hourly (sweeps local Sun 18:00) | §13 |
| `review_scheduler` | Daily | Materialise due ReviewInstances |
| `link_health_check` | Weekly | HTTP-check all active resources; flag broken; alert admin |
| `reminder_dispatch` | Per learner preference | Session reminder, streak-at-risk (only if `accountability_mode ≠ solo`) |
| `snapshot_writer` | Daily | Append ScheduleSnapshot |

---

## 17. Telemetry Events

```
onboarding_started / question_answered / abandoned{step} / completed{duration}
diagnostic_item_shown / answered{correct, level, node}
feasibility_shown{gap_hours} / lever_chosen{lever}
plan_created{total_hours, weeks, node_count}
task_shown / started / completed{actual, estimate, difficulty} / deferred / skipped / swapped{from_resource, to_resource}
hint_opened{level}
stuck_protocol_triggered
day_completed{tasks, minutes}
day_missed{tasks, hours}
recovery_mode_entered / exited{days_in_mode}
review_answered{correct, interval, node}
impact_simulated / impact_applied{lever, slip_days}
week_completed{adherence, velocity, retrieval_accuracy}
```

**North-star metric:** Week-4 survival rate (learner completed ≥1 task in each of weeks 1–4).

**Guardrail metrics:** onboarding completion rate; estimate accuracy (`actual/estimate` median, target 0.9–1.1); mean visible overdue count (must stay ≤3); retrieval accuracy trend.

---

## 18. Non-Functional Requirements

- **Timezone correctness is critical** — all rollovers, streaks, and "today" computations use learner-local time. Store UTC, compute local.
- **Idempotent jobs** — rollover and recompute must be safely re-runnable.
- **Plan mutations are transactional** — a partially-applied replan is a data-integrity failure.
- **ScheduleSnapshot is append-only** — never mutate history; the trajectory chart depends on it.
- **Resource library is versioned** — swapping a resource must not retroactively alter completed task records.
- **Offline tolerance** — Today screen and task detail should be readable without connectivity; completions queue and sync.
- **All learner-facing estimates are ranges or clearly labelled estimates** — never present a projected date as a promise.

---

## 19. Content Seeding Requirement (blocking for launch)

| Artifact | Minimum v1 volume |
|---|---|
| SkillNodes | ~55 (per §4) |
| TaskTemplates | ~350 (5–8 per node) |
| Resources (curated, timestamped, verified) | 150–250 |
| Diagnostic items | ~80 (multi-level, per node) |
| RetrievalItems | ~250 (4–6 per node) |

**Rule:** no live web search, no LLM-generated URLs. All resources hand-verified with `last_verified_at`. LLM usage in v1 is restricted to: rewriting task instructions in learner context, generating hint phrasing, and summarising weekly digests — always within a validated structural skeleton.

---

## 20. Open Decisions (require product input before build)

1. Should deliverables be verified (uploaded/checked) or self-attested? Self-attest for v1 is cheaper but weakens the retrieval integrity story.
2. Is a code-execution sandbox in scope for `verify` tasks, or do we rely on "run this and paste the number"?
3. Single domain branch at launch (recommend NLP/LLM) or two?
4. Do we allow multiple concurrent plans per learner? (Recommend: no.)
5. FSRS-lite fixed intervals vs. full FSRS scheduler — v1 recommendation is fixed intervals.

---

Ready when you are to move to stack selection. The choices that will actually constrain the stack, based on this spec: the DAG traversal and plan-generation logic, the timezone-aware scheduled job layer, the append-only snapshot store powering the charts, the interactive simulator on the client, and the content-authoring admin surface.
