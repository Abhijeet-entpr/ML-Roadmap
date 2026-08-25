# `BUILD-PACKAGE-v1.0` — Complete Implementation Reference

Five documents. `00-CANON.md` is the anti-hallucination artifact: every value an agent might otherwise invent is fixed here.

---
---

# `00-CANON.md`
## Single Source of Truth — Nothing Below May Be Invented

> **PRIME DIRECTIVE FOR ALL AGENTS**
> If a value, ID, enum, string, formula, threshold, question, or answer is required and is **not** in this document, you must **STOP and report a `CANON_GAP`**. You may not invent it. You may not infer it. You may not "use a reasonable default."
>
> Report format: `CANON_GAP: <what is missing> — needed for <ticket>.<file>`

---

## 1. Constants

Every magic number in the system. No numeric literal may appear in `packages/domain` that is not imported from `packages/contracts/src/constants.ts`.

```ts
// packages/contracts/src/constants.ts — CANONICAL. Do not modify without a spec change.
export const CONST = {
  // ── buffers & scheduling ──
  BUFFER_RATIO_DEFAULT:        0.20,
  BUFFER_RATIO_TIME_PRESSURE:  0.30,   // prior_failure_mode = 'ran_out_of_time'
  FEASIBILITY_HEADROOM:        0.80,   // required must be ≤ capacity × this
  WEEK_FILL_TOLERANCE:         1.18,   // a week may overfill to 118% before spilling
  FLEX_DAYS_PER_WEEK:          1,
  MILESTONE_BUFFER_EVERY_WEEKS: 6,

  // ── mastery inference ──
  MASTERY_SELF_WEIGHT:         0.40,
  MASTERY_DIAG_WEIGHT:         0.60,
  MASTERY_SELF_ONLY_CONF:      0.80,   // self-report checked, no diagnostic
  MASTERY_SELF_ONLY_UNCHECKED: 0.15,
  MASTERY_SKIP_SIGNAL:         0.30,   // diagnostic answered "I don't know"
  MASTERY_THRESHOLD_CAP:       0.55,   // threshold concepts, no diagnostic evidence
  MASTERED_AT:                 0.75,
  PARTIAL_AT:                  0.40,
  PARTIAL_HOURS_MULTIPLIER:    0.55,

  // ── diagnostic ──
  DIAG_MAX_ITEMS:              8,
  DIAG_START_LEVEL:            2,
  DIAG_LEVEL_MIN:              1,
  DIAG_LEVEL_MAX:              5,
  DIAG_STEP_CORRECT:          +1,
  DIAG_STEP_INCORRECT:        -1,
  DIAG_STEP_SKIP:              0,

  // ── projection ──
  VELOCITY_EWMA_ALPHA:         0.50,
  VELOCITY_COLD_START_WEEKS:   2,      // weeks 1–2 use committed hours
  VELOCITY_FLOOR:              0.50,   // h/week, prevents divide-by-zero
  DECAY_K:                     0.08,   // per day overdue
  DECAY_CAP_MULTIPLIER:        3.0,
  CONFIDENCE_LOW_BELOW_WEEKS:  2,
  CONFIDENCE_HIGH_ABOVE_WEEKS: 4,

  // ── spacing (FSRS-lite) ──
  REVIEW_INTERVALS:            [2, 7, 21, 60] as const,
  REVIEW_MULT_CORRECT:         2.2,
  REVIEW_MULT_PARTIAL:         1.0,
  REVIEW_RESET_DAYS:           2,
  REVIEW_RESETS_BEFORE_REOPEN: 2,
  REVIEW_MAX_ITEMS_PER_DAY:    10,
  REVIEW_BLOCK_POSITION:       'start' as const,

  // ── scaffold ladder ──
  SCAFFOLD_ADVANCE_AT_MAX:     3,      // difficulty ≤ 3 → advance
  SCAFFOLD_HOLD_AT:            4,
  SCAFFOLD_DROP_AT:            5,
  SCAFFOLD_AGGRESSIVE_OFFSET:  1,      // challenge_preference = 'aggressive'

  // ── slip & recovery ──
  MAX_VISIBLE_OVERDUE:         3,
  RECOVERY_DEBT_MULTIPLE:      1.5,    // debt > 1.5 × weekly capacity
  RECOVERY_CONSECUTIVE_DAYS:   3,
  RECOVERY_LOAD_FACTOR:        0.60,
  RECOVERY_DROP_OPTIONAL_WEEKS: 2,
  RECOVERY_EXIT_STREAK:        3,
  STREAK_GRACE_HOURS:          48,

  // ── stuck protocol (multipliers on task.estimatedMinutes) ──
  STUCK_HINT1_AT:              0.60,
  STUCK_HINT2_AFTER_MINUTES:   10,
  STUCK_ABANDON_AT:            1.50,

  // ── realism check (Q5) ──
  REALISM_GAP_TRIGGER:         5,      // committed > last + 5
  REALISM_LAST_WEEK_MAX:       3,      // AND last < 3
  REALISM_SUGGEST_OFFSET:      2,      // suggest last + 2

  // ── task placement ──
  MAX_WATCH_TASKS_PER_DAY:     1,
  WATCH_EXEMPT_UNDER_MINUTES:  30,
  MOTIVATIONAL_HOIST_WITHIN_N_TASKS: 5,
  MAX_TUTORIAL_HELL_CONSECUTIVE_PASSIVE: 1,

  // ── horizon rendering ──
  HORIZON_DETAILED_DAYS:       14,
  HORIZON_WEEK_LEVEL_WEEKS:    6,

  // ── engineering ──
  MAX_FILE_LOC:                300,
  MAX_FILES_PER_TICKET:        6,
  ESTIMATE_MULTIPLIER_INIT:    1.0,
} as const;
```

---

## 2. Enums — Exact String Values

Every enum below must appear **verbatim**. No pluralisation, no case changes, no synonyms.

```ts
// packages/contracts/src/enums.ts — CANONICAL

export const GOAL_ARCHETYPE = ['ship_feature','pass_interviews','read_papers',
                               'apply_domain','portfolio','understand'] as const;

export const DEPTH_RUNG = [1,2,3,4] as const;

export const DOMAIN_FOCUS = ['nlp','cv','tabular','rl','undecided'] as const;

export const DEADLINE_TYPE = ['hard','soft'] as const;

export const COMPUTE_TIER = ['cpu_only','apple_silicon','local_gpu','cloud_paid'] as const;

export const BUDGET_TIER = ['free','under_30','flexible'] as const;

export const FORMAT_PREFERENCE = ['video_lean','text_lean','balanced'] as const;

export const NOTATION_TOLERANCE = ['low','medium','high'] as const;

export const CHALLENGE_PREFERENCE = ['gentle','balanced','aggressive'] as const;

export const PRIOR_FAILURE_MODE = ['first_attempt','stuck_on_math','tutorial_hell',
                                   'lost_motivation','ran_out_of_time','cant_apply'] as const;

export const ACCOUNTABILITY_MODE = ['solo','streak','public'] as const;

export const LEARNER_STATUS = ['onboarding','active','paused','completed','churned'] as const;

export const PLAN_STATUS = ['active','paused','completed','abandoned'] as const;

export const MASTERY_STATE = ['unknown','not_started','in_progress','partial',
                              'mastered','decaying'] as const;

export const MASTERY_SOURCE = ['self_report','diagnostic','task_completion','retrieval'] as const;

export const TASK_TYPE = ['setup','watch','read','predict','code_along','parsons',
                          'completion','modify','build','debug','retrieve','transfer',
                          'reflect','verify'] as const;

export const SCAFFOLD_LEVEL = ['worked_example','completion','parsons',
                               'independent','transfer'] as const;

export const TASK_STATE = ['scheduled','available','in_progress','completed','partial',
                           'deferred','skipped','missed','rescheduled','dropped'] as const;

export const DELIVERABLE_TYPE = ['none','file','number','screenshot','text'] as const;

export const RESOURCE_FORMAT = ['video','article','interactive','notebook',
                                'paper','docs','exercise'] as const;

export const RESOURCE_STATUS = ['active','broken','deprecated'] as const;

export const RESOURCE_COST = ['free','paid'] as const;

export const DEBT_PRIORITY = ['blocking','normal','optional'] as const;

export const DEBT_RESOLUTION = ['pending','rescheduled','dropped','absorbed'] as const;

export const REVIEW_OUTCOME = ['correct','partial','incorrect'] as const;

export const LEVER = ['absorb','push','compress','trim'] as const;

export const FEASIBILITY_OPTION = ['extend','intensify','narrow','lower_rung'] as const;

export const PROJECTION_CONFIDENCE = ['low','medium','high'] as const;

export const DIAG_ANSWER = ['correct','incorrect','skipped'] as const;
```

### 2.1 Legal task state transitions — exhaustive

Any transition not in this table **must throw** `DomainError('ILLEGAL_TRANSITION')`.

| From | Event | To |
|---|---|---|
| `scheduled` | `DATE_ARRIVED` | `available` |
| `scheduled` | `LEARNER_DEFERRED` | `deferred` |
| `scheduled` | `LEARNER_SKIPPED` | `skipped` |
| `scheduled` | `PLAN_TRIMMED` | `dropped` |
| `available` | `LEARNER_STARTED` | `in_progress` |
| `available` | `LEARNER_DEFERRED` | `deferred` |
| `available` | `LEARNER_SKIPPED` | `skipped` |
| `available` | `MIDNIGHT_ROLLOVER` | `missed` |
| `in_progress` | `LEARNER_COMPLETED` | `completed` |
| `in_progress` | `LEARNER_PARTIAL` | `partial` |
| `in_progress` | `MIDNIGHT_ROLLOVER` | `missed` |
| `partial` | `LEARNER_COMPLETED` | `completed` |
| `partial` | `MIDNIGHT_ROLLOVER` | `missed` |
| `missed` | `DEBT_REALLOCATED` | `rescheduled` |
| `missed` | `PLAN_TRIMMED` | `dropped` |
| `deferred` | `DEBT_REALLOCATED` | `rescheduled` |
| `rescheduled` | `DATE_ARRIVED` | `available` |

Terminal states: `completed`, `skipped`, `dropped`.

---

## 3. Onboarding Questionnaire — Canonical Copy

Order is fixed. Copy is fixed. Option IDs are fixed. **Do not paraphrase user-facing strings.**

### Q1 — `goal_archetype` · single · **required**
> **What do you want to be able to do at the end?**
> *Everything downstream is derived from this. Pick the closest match.*

| id | Label | Sub-label | default rung |
|---|---|---|---|
| `ship_feature` | Ship an AI feature at work | Integrate models into a product you already own | 2 |
| `pass_interviews` | Pass ML / AI engineer interviews | Portfolio, fundamentals, and system design | 3 |
| `read_papers` | Read and reproduce research papers | Depth in internals and the literature | 4 |
| `apply_domain` | Apply DL to data in my own field | Domain-specific modelling | 2 |
| `portfolio` | Build a strong portfolio project | One substantial, deployed, evaluated system | 2 |
| `understand` | Understand how modern AI actually works | Rigorous mental models, no hand-waving | 3 |

### Q2 — `depth_rung` · single · **required**
> **How deep do you need to go?**
> *This is the single largest scope lever. You can change it later.*

| id | Label | Sub-label | Estimate shown |
|---|---|---|---|
| `1` | Use existing models via APIs | Prompting, orchestration, no training | `~70h` |
| `2` | Fine-tune models on my own data | LoRA, datasets, evaluation | `~150h` |
| `3` | Train from scratch and understand internals | Backprop, transformers, GPT built by hand | `~220h` |
| `4` | Contribute novel research | Everything above plus paper reproduction | `~300h` |

### Q3 — `domain_focus` · single · **required**
> **What kind of problems interest you most?**
> *Determines the branch you take after the shared core.*

| id | Label | Sub-label |
|---|---|---|
| `nlp` | Text & language models | LLMs, RAG, fine-tuning — the largest job market |
| `cv` | Images & vision | CNNs, ViTs, detection |
| `tabular` | Tabular & business data | Structured prediction, gradient boosting |
| `rl` | Reinforcement learning | Agents, policy learning |
| `undecided` | Not sure — recommend for me | We will start with the shared core |

`undecided` resolves to `nlp` at plan generation. v1 content exists for `nlp` only; other branches emit `CONTENT_GAP`.

### Q4 — `target_date`, `deadline_type` · **required**
> **When you want to be done?**
> *We will tell you honestly if this is achievable given your available hours.*
>
> Field 1: date picker, label `Target date`, default = today + 4 months, min = today + 14 days
> Field 2: chips, label `How firm is it?` → `hard` "Hard deadline" · `soft` "Rough target"
>
> Live note: `That is {N} weeks from today.` If N < 10 append: ` — tight for a rung-{rung} plan. We will check feasibility before generating anything.`

### Q5 — `hours_last_week`, `committed_hours_per_week` · **required**
> **How much time do you really have?**
> *Two questions. The first is the honest one.*

| Field | Label | Type | Range | Default |
|---|---|---|---|---|
| `hours_last_week` | In the **last 7 days**, how many hours did you actually spend learning something technical? | stepper | 0–40 | 0 |
| `committed_hours_per_week` | How many hours per week can you realistically commit going forward? | stepper | 1–40 | 10 |

Helper on field 1: `hours — be honest, not aspirational`

**Realism check (§3.2), blocking modal.** Trigger:
`committed_hours_per_week > hours_last_week + 5 AND hours_last_week < 3`

Modal copy — verbatim:
> **Let's start smaller**
> You spent **{last}h** last week but plan **{committed}h/week**. Most self-study plans die here — not from inability, but from a schedule that was never real.
>
> We suggest starting at **{suggested}h/week** and raising it once you have a two-week streak. The plan re-projects automatically when your velocity goes up.
>
> `[Start at {suggested}h/week]` (primary) · `[Keep {committed}h — I'm sure]`

`suggested = max(2, hours_last_week + 2)`

### Q6 — `active_days`, `session_length_minutes` · **required**
> **Which days, and how long per session?**
> *Task size is generated to fit your session length exactly.*
>
> Field 1: day chips, ISO numbering `1`=Mon … `7`=Sun. Default `[1,2,3,4,5]`. Min 1 selected.
> Field 2: chips `25` · `45` · `60` · `90` · `120` minutes.
>
> Live note: `{days} days/week at {hpw}h total means about {mins} minutes per day.` If mins > 150 append: ` That is a long daily session — consider adding a day.` Always append: ` One day each week is reserved as flex and receives no new tasks.`

### Q7 — `python_anchors` · multi · optional
> **Which of these are true about your Python?**
> *Behavioural anchors, not a 1–10 scale. Self-ratings are unreliable; concrete statements are not.*

| anchor id | Label |
|---|---|
| `py.weekly` | I write Python at least weekly |
| `py.class` | I can write a class with methods without looking it up |
| `py.comprehension` | I use list comprehensions naturally |
| `py.numpy` | I am comfortable with numpy arrays and broadcasting |
| `py.git` | I use git branches regularly |
| `py.debugger` | I have debugged with a real debugger, not just print statements |

Footer: `Unchecked items add a foundations track. The diagnostic will verify a sample of what you check.`
"None of these" option clears all.

### Q8 — `math_anchors` · multi · optional
> **Which of these are true about your math?**
> *Math is delivered just-in-time. Nothing abstract before you need it.*

| anchor id | Label |
|---|---|
| `math.vecmat` | I know what a vector and a matrix are |
| `math.matmul` | I can multiply matrices and reason about shapes |
| `math.derivative` | I know what a derivative measures |
| `math.chainrule` | I can apply the chain rule |
| `math.partial` | I know what a partial derivative and a gradient are |
| `math.distributions` | I am comfortable with probability distributions |
| `math.notation` | Reading mathematical notation does not slow me down |

Footer: `Chain rule is the one that matters most — it is the whole of backpropagation.`
**Side effect:** `math.notation` checked → `notation_tolerance = 'high'`; unchecked → `'medium'`. Overridden to `'low'` by Q11 = `stuck_on_math`.

### Q9 — `ml_anchors` · multi · optional
> **Which of these have you actually done?**
> *Done, not read about. This prunes the most content of any question.*

| anchor id | Label |
|---|---|
| `ml.sklearn` | Trained a model with scikit-learn |
| `ml.valset` | Explained why we hold out a validation set |
| `ml.trainloop` | Written a PyTorch or TensorFlow training loop |
| `ml.backprop` | Implemented backpropagation by hand |
| `ml.finetune` | Fine-tuned a pretrained model |
| `ml.paper` | Read a deep learning paper end to end |
| `ml.deploy` | Deployed a model behind an API |

Footer: `Threshold concepts such as backpropagation and attention are never skipped on self-report alone — they must be confirmed by diagnostic.`

### Q10 — `compute_tier`, `budget_tier` · **required**
> **Hardware and budget**
> *Filters the resource library and determines which exercises are feasible.*

| `compute_tier` | Label | Sub-label |
|---|---|---|
| `cpu_only` | CPU only | Everything routes through Colab or Kaggle free tiers |
| `apple_silicon` | Apple Silicon | Local MPS training for smaller models |
| `local_gpu` | Local NVIDIA GPU | Full local training |
| `cloud_paid` | I'll pay for cloud GPU | No constraints |

| `budget_tier` | Label |
|---|---|
| `free` | Free only |
| `under_30` | Up to $30/mo |
| `flexible` | Flexible |

Conditional note if `cpu_only`: `On CPU only, week 11 (fine-tuning a 7B model) routes to a free Colab T4. Budget one session for setup.`

### Q11 — `prior_failure_mode` · single · **required**
> **Have you tried learning this before?**
> *The most predictive question here. Each answer changes how the plan is built.*

| id | Label | Adjustment copy (shown on select) | Config applied |
|---|---|---|---|
| `first_attempt` | This is my first attempt | — | defaults |
| `stuck_on_math` | I got stuck on the math | Math is delivered just-in-time and visually before it is delivered formally. Notation is capped at low for four weeks. | `notation_tolerance='low'` for 4 weeks; concreteness fading forced on all L1 nodes |
| `tutorial_hell` | Endless tutorials, could not build anything myself | At least 50% of tasks from week 2 are unaided builds. No more than one consecutive watch or read task. | `MAX_TUTORIAL_HELL_CONSECUTIVE_PASSIVE=1`; independent/build ratio ≥ 0.5 from week 2 |
| `lost_motivation` | I lost motivation after a few weeks | Week 1 ends with a shippable artifact. Daily load capped at 80% of stated capacity. | daily load × 0.8; force `accountability_mode` reminders on; motivational hoist mandatory |
| `ran_out_of_time` | I ran out of time | Buffer raised from 20% to 30%. Task granularity reduced to 25-minute blocks. | `BUFFER_RATIO=0.30`; `session_length_minutes` capped at 25 for task splitting |
| `cant_apply` | Finished courses but cannot apply it | Every skill ends in a transfer task using a dataset the tutorial never touched. | append `transfer` task to every kept node |

### Q12 — `format_preference`, `accountability_mode` · **required**
> **Two quick preferences**
>
> Field 1 label: `Format preference — this is about bandwidth and reading speed, not "learning styles"`
> `video_lean` "Video-heavy" · `text_lean` "Text-heavy" · `balanced` "A mix"
>
> Field 2 label: `Accountability`
> `solo` "Just me" · `streak` "Streaks and reminders" · `public` "Public commitment"
>
> Footer: `We do not ask about VARK or learning styles. There is no evidence they predict anything, and asking would tell you we had not read the literature.`

---

## 4. Diagnostic Item Bank — Canonical, 20 Items

**Schema:** `answer_index` is 0-based. Every item has exactly 4 options. `level` ∈ 1–5.

```yaml
# packages/content/diagnostics.yaml — CANONICAL. Do not alter text or answer indices.

- id: D01
  node: py.core
  level: 1
  tag: Python
  stem: "What does this print?"
  code: |
    print([x * 2 for x in range(3)])
  options: ["[0, 1, 2]", "[0, 2, 4]", "[2, 4, 6]", "[1, 2, 3]"]
  answer_index: 1
  explanation: "range(3) yields 0,1,2 and each is doubled → [0, 2, 4]."

- id: D02
  node: la.mm
  level: 1
  tag: Shapes
  stem: "A batch of 32 samples with 128 features passes through nn.Linear(128, 64). What is the output shape?"
  options: ["(128, 64)", "(32, 64)", "(64, 32)", "(32, 128, 64)"]
  answer_index: 1
  explanation: "Linear maps the last dimension: (32,128) @ (128,64) → (32,64)."

- id: D03
  node: ml.frame
  level: 1
  tag: ML
  stem: "You have 50,000 product reviews with no labels and want to group them by topic. What kind of problem is this?"
  options: ["Supervised classification", "Unsupervised clustering", "Reinforcement learning", "Regression"]
  answer_index: 1
  explanation: "No labels and a grouping objective is unsupervised clustering."

- id: D04
  node: py.oop
  level: 2
  tag: Python
  stem: "What does this print?"
  code: |
    class Counter:
        def __init__(self):
            self.n = 0
        def tick(self):
            self.n += 1
            return self

    c = Counter()
    print(c.tick().tick().n)
  options: ["0", "1", "2", "AttributeError"]
  answer_index: 2
  explanation: "tick() returns self, so the calls chain and n increments twice."

- id: D05
  node: np
  level: 2
  tag: numpy
  stem: "What is the resulting shape?"
  code: |
    a = np.ones((3, 1))
    b = np.ones((1, 4))
    (a + b).shape
  options: ["(3, 1)", "(1, 4)", "(3, 4)", "ValueError — incompatible"]
  answer_index: 2
  explanation: "Broadcasting aligns from the right; size-1 dimensions stretch. (3,1)+(1,4) → (3,4)."

- id: D06
  node: ca.chain
  level: 2
  tag: Calculus
  stem: "What is the derivative of f(x) = sin(x²)?"
  options: ["cos(x²)", "2x · cos(x²)", "2x · sin(x)", "x² · cos(x²)"]
  answer_index: 1
  explanation: "Chain rule: outer derivative cos(x²) times inner derivative 2x."

- id: D07
  node: ml.split
  level: 2
  tag: ML
  stem: "Why should you not tune hyperparameters on the test set?"
  options:
    - "It is slower to compute"
    - "The test set is usually too small"
    - "You leak test information into model selection, so the score no longer estimates generalization"
    - "Test sets are not shuffled"
  answer_index: 2
  explanation: "Repeated selection against the test set turns it into a second validation set. You lose your unbiased estimate."

- id: D08
  node: ml.gen
  level: 2
  tag: ML
  stem: "Training accuracy is 99%, validation accuracy is 62%, and the gap is widening each epoch. What is happening?"
  options:
    - "Underfitting — increase model capacity"
    - "Overfitting — regularize or get more data"
    - "The learning rate is too low"
    - "Vanishing gradients"
  answer_index: 1
  explanation: "A large and growing train/val gap is the definition of overfitting."

- id: D09
  node: dl.loop
  level: 3
  tag: PyTorch
  stem: "What happens if you omit optimizer.zero_grad() in this loop?"
  code: |
    for x, y in loader:
        pred = model(x)
        loss = criterion(pred, y)
        loss.backward()
        optimizer.step()
  options:
    - "Nothing — PyTorch clears gradients automatically"
    - "Gradients accumulate across batches, producing incorrect updates"
    - "The model trains faster"
    - "It raises a RuntimeError"
  answer_index: 1
  explanation: "PyTorch accumulates gradients by design. Without zero_grad() every step uses the sum of all previous batches."

- id: D10
  node: nlp.tok
  level: 3
  tag: Tokenization
  stem: "Why do LLMs frequently miscount the letters in a word like 'strawberry'?"
  options:
    - "The context window is too short"
    - "Models see subword tokens, not characters, so letter-level structure is not directly visible"
    - "Attention cannot count"
    - "The tokenizer removes duplicate letters"
  answer_index: 1
  explanation: "'strawberry' may be 2–3 tokens. The model never sees individual characters unless they happen to be separate tokens."

- id: D11
  node: dl.data
  level: 3
  tag: PyTorch
  stem: "Your validation DataLoader is constructed with shuffle=True. What is the consequence?"
  options:
    - "Validation loss becomes incorrect"
    - "Nothing meaningful for the metric, but per-batch logs are no longer comparable across epochs and it wastes time"
    - "The model starts training on validation data"
    - "It raises a warning and disables itself"
  answer_index: 1
  explanation: "Aggregate metrics are unaffected since every sample is still seen once, but ordering changes make per-batch inspection and any order-dependent logging unreliable."

- id: D12
  node: ml.met
  level: 3
  tag: Metrics
  stem: "A fraud detector reaches 99.2% accuracy on a dataset where 99% of transactions are legitimate. What should you conclude?"
  options:
    - "The model is excellent"
    - "Accuracy is nearly uninformative here; check precision, recall, and the confusion matrix"
    - "The dataset is too small"
    - "The model is overfitting"
  answer_index: 1
  explanation: "Predicting 'legitimate' every time already scores 99%. With severe class imbalance, accuracy hides total failure on the minority class."

- id: D13
  node: dl.bp
  level: 4
  tag: Backprop
  stem: "In a hand-written autograd engine, a node feeds two downstream nodes. Its _backward uses `self.grad = incoming` instead of `+=`. What breaks?"
  options:
    - "Nothing — the last write is correct"
    - "Only one of the two gradient paths is counted, silently understating the true gradient"
    - "The graph becomes cyclic"
    - "The forward pass produces NaN"
  answer_index: 1
  explanation: "Gradients from multiple downstream paths must sum. Assignment discards all but the last, and the model trains slowly and wrongly with no error raised."

- id: D14
  node: attn
  level: 4
  tag: Attention
  stem: "For Q, K, V each of shape (B, T, d), what is the shape of softmax(QKᵀ/√d)V?"
  options: ["(B, T, T)", "(B, T, d)", "(B, d, d)", "(B, T, 2d)"]
  answer_index: 1
  explanation: "QKᵀ is (B,T,T); multiplying by V of shape (B,T,d) returns (B,T,d) — one output vector per position."

- id: D15
  node: dl.dbg
  level: 4
  tag: Debugging
  stem: "Your model cannot drive the loss below 0.6 even on a single batch of 8 samples it sees repeatedly. Most likely cause?"
  options:
    - "Learning rate too high — lower it"
    - "Needs more data"
    - "A structural bug: detached graph, frozen parameters, or misaligned labels"
    - "Normal — 8 samples is too few to fit"
  answer_index: 2
  explanation: "Any correctly-wired network can memorize 8 examples. Failure to overfit a single batch always indicates a bug, not a tuning issue."

- id: D16
  node: dl.norm
  level: 4
  tag: Normalization
  stem: "A model with BatchNorm scores 94% during training but 71% at inference on the same data. Most likely cause?"
  options:
    - "The model is overfitting"
    - "model.eval() was not called, so BatchNorm uses batch statistics instead of running statistics"
    - "The learning rate is too high"
    - "Dropout is disabled at inference"
  answer_index: 1
  explanation: "In train mode BatchNorm normalizes with the current batch's statistics. At inference it must use accumulated running statistics — model.eval() makes that switch."

- id: D17
  node: attn.mask
  level: 4
  tag: Attention
  stem: "In a causal mask you set future positions to 0 before the softmax instead of -inf. What happens?"
  options:
    - "It works identically"
    - "Future positions receive exp(0)=1 weight, so the model attends to the future and the loss looks impossibly good"
    - "The softmax raises a runtime error"
    - "Gradients become NaN immediately"
  answer_index: 1
  explanation: "softmax(0) is not zero — it is a substantial weight. Masking requires -inf so exp(-inf)=0. This bug produces suspiciously low training loss and a model that fails completely at generation."

- id: D18
  node: peft
  level: 5
  tag: PEFT
  stem: "In LoRA, what does the rank r primarily control?"
  options:
    - "The learning rate for adapter weights"
    - "The dimensionality of the low-rank update, trading capacity against trainable parameters"
    - "How many layers get adapters"
    - "The quantization bit-width"
  answer_index: 1
  explanation: "ΔW = BA where B is (d×r) and A is (r×k). r sets the rank of the update — higher r means more capacity and more trainable parameters."

- id: D19
  node: kv
  level: 5
  tag: Inference
  stem: "How does KV cache memory scale as you double the generation length?"
  options:
    - "Stays constant — the cache is fixed size"
    - "Doubles — it grows linearly with sequence length"
    - "Quadruples — it grows quadratically"
    - "Halves — longer sequences compress better"
  answer_index: 1
  explanation: "Cache size = 2 × layers × heads × head_dim × seq_len × batch × bytes. Linear in seq_len. The attention *computation* is quadratic; the cache is not."

- id: D20
  node: ev.judge
  level: 5
  tag: Evaluation
  stem: "You use an LLM to compare response A against response B. Swapping the order changes the verdict 30% of the time. What does this mean?"
  options:
    - "The two responses are genuinely of equal quality"
    - "The judge exhibits position bias; results are substantially measuring order rather than quality"
    - "The temperature is too low"
    - "You need a larger judge model — this is expected and acceptable"
  answer_index: 1
  explanation: "A reliable judge should be near-invariant to presentation order. 30% flip rate means a large share of your signal is positional artifact. Mitigate by evaluating both orders and averaging."
```

### 4.1 Adaptive selection algorithm — canonical

```
selectNextDiagnosticItem(answered, candidates, maxItems):
  if answered.length >= CONST.DIAG_MAX_ITEMS: return null

  pool = candidates
    .filter(item => item.id not in answered.map(a => a.itemId))
    .filter(item => NODE[item.node].minRung <= profile.depthRung)
    .filter(item => NODE[item.node].domain in ['core', resolvedDomain])

  if pool.empty: return null

  sort pool by:
    1. NODE[item.node].isThresholdConcept DESC     // threshold concepts first
    2. abs(item.level - currentLevel) ASC          // nearest to current level
    3. item.id ASC                                 // determinism

  return pool[0]

// level update, applied AFTER each answer
currentLevel = clamp(
  currentLevel + (outcome === 'correct'   ? CONST.DIAG_STEP_CORRECT
               :  outcome === 'incorrect' ? CONST.DIAG_STEP_INCORRECT
               :                            CONST.DIAG_STEP_SKIP),
  CONST.DIAG_LEVEL_MIN, CONST.DIAG_LEVEL_MAX)
```

Initial `currentLevel = CONST.DIAG_START_LEVEL` (= 2).

---

## 5. Skill Graph — Canonical, 63 Nodes

`ID | Title | Hours | Layer | MinRung | Domain | Threshold | Anchor | Diagnostics | Prerequisites`

```yaml
# packages/content/skills.yaml — CANONICAL

# ── L0 Foundations ──
py.core:    {t: "Python fundamentals",          h: 8,  L:0, r:1, d:core, th:false, ak:py.weekly,       dg:[D01],     pre:[]}
py.oop:     {t: "Classes & OOP patterns",       h: 4,  L:0, r:1, d:core, th:false, ak:py.class,        dg:[D04],     pre:[py.core]}
py.tools:   {t: "venv, CLI, packaging",         h: 3,  L:0, r:1, d:core, th:false, ak:py.weekly,       dg:[],        pre:[py.core]}
git:        {t: "Git workflow",                 h: 3,  L:0, r:1, d:core, th:false, ak:py.git,          dg:[],        pre:[]}
np:         {t: "numpy & broadcasting",         h: 6,  L:0, r:1, d:core, th:false, ak:py.numpy,        dg:[D05],     pre:[py.core]}

# ── L1 Mathematics ──
la.vec:     {t: "Vectors & matrices",           h: 6,  L:1, r:1, d:core, th:false, ak:math.vecmat,     dg:[],        pre:[]}
la.mm:      {t: "Matmul & shape reasoning",     h: 4,  L:1, r:1, d:core, th:false, ak:math.matmul,     dg:[D02],     pre:[la.vec]}
ca.der:     {t: "Derivatives",                  h: 4,  L:1, r:1, d:core, th:false, ak:math.derivative, dg:[],        pre:[]}
ca.chain:   {t: "Chain rule & partials",        h: 5,  L:1, r:1, d:core, th:TRUE,  ak:math.chainrule,  dg:[D06],     pre:[ca.der]}
ca.grad:    {t: "Gradients & gradient descent", h: 4,  L:1, r:1, d:core, th:false, ak:math.partial,    dg:[],        pre:[ca.chain, la.vec]}
prob:       {t: "Probability & distributions",  h: 5,  L:1, r:2, d:core, th:false, ak:math.distributions, dg:[],     pre:[]}

# ── L2 Classical ML ──
ml.frame:   {t: "Supervised learning framing",  h: 3,  L:2, r:1, d:core, th:false, ak:ml.sklearn,      dg:[D03],     pre:[np]}
ml.split:   {t: "Splits & leakage",             h: 3,  L:2, r:1, d:core, th:false, ak:ml.valset,       dg:[D07],     pre:[ml.frame]}
ml.gen:     {t: "Generalization & overfitting", h: 4,  L:2, r:1, d:core, th:TRUE,  ak:ml.valset,       dg:[D08],     pre:[ml.split]}
ml.met:     {t: "Metrics & evaluation",         h: 4,  L:2, r:1, d:core, th:false, ak:ml.sklearn,      dg:[D12],     pre:[ml.split]}
ml.sk:      {t: "Linear/logistic + sklearn",    h: 6,  L:2, r:1, d:core, th:false, ak:ml.sklearn,      dg:[],        pre:[ml.met, ca.grad]}

# ── L3 Deep Learning Core ──
dl.mlp:     {t: "MLP & activations",            h: 5,  L:3, r:1, d:core, th:false, ak:ml.trainloop,    dg:[],        pre:[ml.sk, la.mm]}
dl.loss:    {t: "Loss functions",               h: 4,  L:3, r:1, d:core, th:false, ak:ml.trainloop,    dg:[],        pre:[dl.mlp]}
dl.bp:      {t: "Backprop from scratch",        h: 8,  L:3, r:2, d:core, th:TRUE,  ak:ml.backprop,     dg:[D13],     pre:[dl.loss, ca.chain]}
dl.ag:      {t: "Autograd mechanics",           h: 5,  L:3, r:2, d:core, th:false, ak:ml.backprop,     dg:[],        pre:[dl.bp]}
dl.loop:    {t: "PyTorch training loop",        h: 6,  L:3, r:1, d:core, th:false, ak:ml.trainloop,    dg:[D09],     pre:[dl.ag, py.oop]}
dl.opt:     {t: "Optimizers & schedules",       h: 5,  L:3, r:1, d:core, th:false, ak:ml.trainloop,    dg:[],        pre:[dl.loop, ca.grad]}
dl.data:    {t: "Dataset & DataLoader",         h: 4,  L:3, r:1, d:core, th:false, ak:ml.trainloop,    dg:[D11],     pre:[dl.loop]}
dl.norm:    {t: "Normalization & init",         h: 5,  L:3, r:2, d:core, th:false, ak:null,            dg:[D16],     pre:[dl.opt]}
dl.reg:     {t: "Regularization",               h: 4,  L:3, r:1, d:core, th:false, ak:ml.valset,       dg:[],        pre:[dl.norm, ml.gen]}
dl.dbg:     {t: "Debugging recipe",             h: 8,  L:3, r:1, d:core, th:TRUE,  ak:null,            dg:[D15],     pre:[dl.reg]}
dl.trk:     {t: "Experiment tracking",          h: 3,  L:3, r:1, d:core, th:false, ak:null,            dg:[],        pre:[dl.loop]}

# ── L4 NLP branch ──
nlp.tok:    {t: "Tokenization & BPE",           h: 6,  L:4, r:1, d:nlp,  th:false, ak:null,            dg:[D10],     pre:[dl.data]}
nlp.emb:    {t: "Embeddings",                   h: 5,  L:4, r:1, d:nlp,  th:false, ak:null,            dg:[],        pre:[nlp.tok, dl.mlp]}
nlp.samp:   {t: "Sampling strategies",          h: 4,  L:4, r:1, d:nlp,  th:false, ak:null,            dg:[],        pre:[nlp.emb]}
attn:       {t: "Self-attention",               h: 8,  L:4, r:2, d:nlp,  th:TRUE,  ak:null,            dg:[D14],     pre:[nlp.emb, dl.dbg]}
attn.mask:  {t: "Causal masking",               h: 4,  L:4, r:2, d:nlp,  th:false, ak:null,            dg:[D17],     pre:[attn]}
attn.mh:    {t: "Multi-head attention",         h: 5,  L:4, r:2, d:nlp,  th:false, ak:null,            dg:[],        pre:[attn.mask]}
tf.block:   {t: "Transformer block",            h: 8,  L:4, r:2, d:nlp,  th:false, ak:null,            dg:[],        pre:[attn.mh, dl.norm]}
tf.pos:     {t: "Positional encoding & RoPE",   h: 5,  L:4, r:2, d:nlp,  th:false, ak:null,            dg:[],        pre:[tf.block]}
tf.gpt:     {t: "GPT end to end",               h:10,  L:4, r:3, d:nlp,  th:TRUE,  ak:null,            dg:[],        pre:[tf.pos]}
tf.scale:   {t: "Scaling laws & FLOPs",         h: 4,  L:4, r:3, d:nlp,  th:false, ak:null,            dg:[],        pre:[tf.gpt]}

# ── L4 CV branch (content gap in v1) ──
cv.conv:    {t: "Convolutions",                 h: 6,  L:4, r:1, d:cv,   th:false, ak:null,            dg:[],        pre:[dl.data]}
cv.arch:    {t: "CNN architectures",            h: 5,  L:4, r:1, d:cv,   th:false, ak:null,            dg:[],        pre:[cv.conv, dl.norm]}
cv.tl:      {t: "Transfer learning",            h: 5,  L:4, r:1, d:cv,   th:false, ak:null,            dg:[],        pre:[cv.arch]}

# ── L5 Applied LLM ──
hf.eco:     {t: "HF ecosystem",                 h: 4,  L:5, r:1, d:nlp,  th:false, ak:ml.finetune,     dg:[],        pre:[nlp.tok]}
hf.load:    {t: "Load pretrained into own impl",h: 8,  L:5, r:3, d:nlp,  th:TRUE,  ak:null,            dg:[],        pre:[hf.eco, tf.gpt]}
hf.ft:      {t: "Fine-tuning",                  h: 6,  L:5, r:1, d:nlp,  th:false, ak:ml.finetune,     dg:[],        pre:[hf.eco]}
hf.sft:     {t: "Instruction tuning",           h: 6,  L:5, r:2, d:nlp,  th:false, ak:null,            dg:[],        pre:[hf.ft]}
data.cur:   {t: "Data curation & contamination",h: 5,  L:5, r:2, d:core, th:false, ak:null,            dg:[],        pre:[ml.split]}
peft:       {t: "LoRA / QLoRA",                 h: 8,  L:5, r:2, d:nlp,  th:false, ak:null,            dg:[D18],     pre:[hf.ft]}
quant:      {t: "Quantization",                 h: 5,  L:5, r:2, d:nlp,  th:false, ak:null,            dg:[],        pre:[peft]}
kv:         {t: "KV cache & inference opt",     h: 6,  L:5, r:2, d:nlp,  th:TRUE,  ak:null,            dg:[D19],     pre:[tf.block]}
ev.harn:    {t: "Eval harness",                 h: 7,  L:5, r:1, d:core, th:TRUE,  ak:null,            dg:[],        pre:[ml.met, dl.trk]}
ev.judge:   {t: "LLM-as-judge & bias",          h: 6,  L:5, r:2, d:nlp,  th:false, ak:null,            dg:[D20],     pre:[ev.harn]}
rag.ret:    {t: "Retrieval & embeddings",       h: 6,  L:5, r:1, d:nlp,  th:false, ak:null,            dg:[],        pre:[nlp.emb]}
rag.chunk:  {t: "Chunking & indexing",          h: 6,  L:5, r:1, d:nlp,  th:false, ak:null,            dg:[],        pre:[rag.ret]}
rag.pipe:   {t: "RAG pipeline & citations",     h: 7,  L:5, r:1, d:nlp,  th:false, ak:null,            dg:[],        pre:[rag.chunk, hf.eco]}
rag.ev:     {t: "RAG evaluation",               h: 5,  L:5, r:2, d:nlp,  th:false, ak:null,            dg:[],        pre:[rag.pipe, ev.harn]}

# ── L6 Production ──
dep.serve:  {t: "Model serving",                h: 6,  L:6, r:1, d:core, th:false, ak:ml.deploy,       dg:[],        pre:[dl.loop]}
dep.pkg:    {t: "Docker & artifacts",           h: 5,  L:6, r:1, d:core, th:false, ak:ml.deploy,       dg:[],        pre:[dep.serve]}
dep.perf:   {t: "Latency & cost",               h: 5,  L:6, r:1, d:core, th:false, ak:null,            dg:[],        pre:[dep.pkg]}
dep.mon:    {t: "Monitoring & drift",           h: 5,  L:6, r:2, d:core, th:false, ak:null,            dg:[],        pre:[dep.perf]}
dep.scale:  {t: "vLLM & scale",                 h: 5,  L:6, r:2, d:nlp,  th:false, ak:null,            dg:[],        pre:[dep.perf, kv]}
pap:        {t: "Reading papers",               h: 6,  L:6, r:3, d:core, th:false, ak:ml.paper,        dg:[],        pre:[dl.dbg]}
sysd:       {t: "ML system design",             h: 7,  L:6, r:1, d:core, th:false, ak:null,            dg:[],        pre:[dep.perf]}
cap:        {t: "Capstone project",             h:30,  L:6, r:1, d:core, th:false, ak:null,            dg:[],        pre:[ev.harn, dep.serve]}
intv:       {t: "Interview prep",               h:12,  L:6, r:1, d:core, th:false, ak:null,            dg:[],        pre:[cap, sysd]}
```

**Trimmable subtrees** (used by the `trim` lever and `narrow` feasibility option, in drop order):
`rag.ev` → `tf.scale` → `dep.mon` → `ev.judge` → `dep.scale` → `pap`

**Threshold concepts** (8): `ca.chain`, `ml.gen`, `dl.bp`, `dl.dbg`, `attn`, `tf.gpt`, `hf.load`, `kv`, `ev.harn`

---

## 6. Canonical Formulas

Every formula the domain layer implements. **These are the specification. Do not derive alternatives.**

```
── MASTERY ────────────────────────────────────────────────────────────
selfSignal(node)  = node.anchorKey ∈ learner.allCheckedAnchors ? 1 : 0
diagSignal(node)  = null                    if no diagnostic answered for node
                  = 1                       if correct
                  = 0                       if incorrect
                  = MASTERY_SKIP_SIGNAL      if skipped        (= 0.30)

confidence = diagSignal === null
             ? (selfSignal ? MASTERY_SELF_ONLY_CONF : MASTERY_SELF_ONLY_UNCHECKED)
             : MASTERY_SELF_WEIGHT * selfSignal + MASTERY_DIAG_WEIGHT * diagSignal

if node.isThresholdConcept AND diagSignal === null:
    confidence = min(confidence, MASTERY_THRESHOLD_CAP)    // = 0.55

state = confidence >= MASTERED_AT ? 'mastered'
      : confidence >= PARTIAL_AT  ? 'partial'
      :                             'not_started'

needsVerification = (state === 'mastered' AND diagSignal === null)

── PLAN SIZING ────────────────────────────────────────────────────────
effectiveHours(node) = state === 'partial'
                       ? node.hours * PARTIAL_HOURS_MULTIPLIER   // × 0.55
                       : node.hours

requiredHours = Σ effectiveHours(node) for all kept nodes
bufferRatio   = priorFailureMode === 'ran_out_of_time'
                ? BUFFER_RATIO_TIME_PRESSURE : BUFFER_RATIO_DEFAULT
weeksAvailable = max(1, round((targetDate - today) / 7 days)) − blackoutWeeks
capacity      = committedHoursPerWeek * weeksAvailable
usable        = capacity * (1 − bufferRatio)

feasible = requiredHours <= usable * FEASIBILITY_HEADROOM

── FEASIBILITY OPTIONS ────────────────────────────────────────────────
extend.newWeeks   = ceil(requiredHours / (committedHoursPerWeek * (1 − bufferRatio)))
intensify.hours   = requiredHours / (weeksAvailable * (1 − bufferRatio))
narrow.savedHours = Σ hours of trimmable subtrees dropped in canonical order
lowerRung.hours   = recompute requiredHours with depthRung − 1

── VELOCITY & PROJECTION ──────────────────────────────────────────────
velocity = weeksElapsed < VELOCITY_COLD_START_WEEKS
           ? committedHoursPerWeek
           : EWMA(weeklyCompletedHours, alpha = VELOCITY_EWMA_ALPHA)

  EWMA:  v₀ = x₀ ;  vₙ = α·xₙ + (1−α)·vₙ₋₁

decayPenaltyHours = Σ over overdue ReviewInstances:
    baseReviewMinutes/60 * min(1 + DECAY_K * daysOverdue, DECAY_CAP_MULTIPLIER)

remainingHours = Σ effectiveHours(incomplete tasks) + debtHours + decayPenaltyHours
projectedWeeks = remainingHours / max(velocity, VELOCITY_FLOOR)
projectedCompletionDate = today + (projectedWeeks * 7 calendar days),
                          skipping blackout ranges
slipDays = projectedCompletionDate − originalTargetDate

confidence = weeksOfHistory < CONFIDENCE_LOW_BELOW_WEEKS  ? 'low'
           : weeksOfHistory <= CONFIDENCE_HIGH_ABOVE_WEEKS ? 'medium'
           :                                                 'high'

���─ IMMEDIATE SLIP (per missed day) ────────────────────────────────────
unabsorbedHours = max(0, missedHours − remainingBufferHoursThisWeek)

if unabsorbedHours == 0:  impact = ABSORBED
else:
  hoursPerActiveDay  = committedHoursPerWeek / activeDays.length
  extraActiveDays    = unabsorbedHours / hoursPerActiveDay
  slipCalendarDays   = ceil(extraActiveDays * 7 / activeDays.length)

── SCAFFOLD LADDER ────────────────────────────────────────────────────
ladder = [worked_example, completion, parsons, independent, transfer]

next(current, difficultyRating):
  rating <= SCAFFOLD_ADVANCE_AT_MAX (3) → index + 1
  rating == SCAFFOLD_HOLD_AT        (4) → index  (hold)
  rating == SCAFFOLD_DROP_AT        (5) → index − 1, insertRemedial = true
  challengePreference == 'aggressive'    → starting index + 1

── SPACING (FSRS-lite) ────────────────────────────────────────────────
initial intervals: REVIEW_INTERVALS = [2, 7, 21, 60]  (days after node start)

nextInterval(current, repetition, outcome):
  correct   → current * REVIEW_MULT_CORRECT   (× 2.2)
  partial   → current * REVIEW_MULT_PARTIAL   (× 1.0)
  incorrect → REVIEW_RESET_DAYS               (= 2)
              and if this is reset #REVIEW_RESETS_BEFORE_REOPEN (2nd),
              reopenNode = true, scaffold reset to 'completion'

── DEBT & RECOVERY ────────────────────────────────────────────────────
debtPriority(task) = task.template.isOptional              ? 'optional'
                   : descendantCount(task.skillNode) >= 3  ? 'blocking'
                   :                                         'normal'

reallocation order: blocking → normal → optional
placement order:    this week's flex → next week's flex → future weeks

shouldEnterRecovery = debtHours > weeklyCapacity * RECOVERY_DEBT_MULTIPLE (1.5)
                   OR consecutiveMissedDays >= RECOVERY_CONSECUTIVE_DAYS  (3)

visibleOverdue: show at most MAX_VISIBLE_OVERDUE (3); remainder reported as
                "+{n} more ({h}h) auto-deferred"

── RESOURCE MATCHING ──────────────────────────────────────────────────
hard filters (all must pass):
  resource.cost <= budgetTier
  resource.requiresGpu implies computeTier != 'cpu_only'
  resource.status == 'active'
  skillNodeId ∈ resource.skillNodeIds

score = 0.30 * formatMatch(resource.format, formatPreference)
      + 0.25 * (resource.qualityScore / 5)
      + 0.20 * (1 − abs(resource.level − targetLevel) / 3)
      + 0.15 * notationFit(resource.notationHeaviness, notationTolerance)
      + 0.10 * durationFit(resource.durationMinutes, sessionLengthMinutes)

tie-break: lower durationMinutes wins, then resource.id ASC
no candidate → return null, planner emits CONTENT_GAP (fails CI seed validation)

── TOPOLOGICAL ORDER (Kahn) tie-break, in order ───────────────────────
1. descendantCount DESC
2. isThresholdConcept DESC
3. layer ASC
4. id ASC                       // determinism — required for golden fixtures
```

---

## 7. Error Codes

```ts
// packages/contracts/src/errors.ts — CANONICAL
export const ERROR_CODE = [
  'CANON_GAP',            // agent-facing: required value not in canon
  'CONTENT_GAP',          // no resource matches a required skill node
  'ILLEGAL_TRANSITION',   // task state machine violation
  'INFEASIBLE_PLAN',      // required > usable; must negotiate
  'CYCLIC_GRAPH',         // skill DAG contains a cycle
  'ORPHAN_NODE',          // node unreachable from any terminal
  'MISSING_SUCCESS_CRITERION',
  'MULTIPLE_ACTIVE_PLANS',
  'STALE_SNAPSHOT',
  'TIMEZONE_MISSING',
  'DIAGNOSTIC_EXHAUSTED',
] as const;

export class DomainError extends Error {
  constructor(public code: (typeof ERROR_CODE)[number], public detail?: unknown) {
    super(code);
  }
}
```

---
---

# `01-STACK-IMPLEMENTATION.md`
## Deep Implementation Reference

---

## 1. Version Policy — Read This First

> **Anti-hallucination rule for versions: RESOLVE, DO NOT RECALL.**
>
> An agent must **never** write a version number from memory into `package.json`. Doing so is the single most common source of broken builds.
>
> **Required procedure:**
> ```bash
> pnpm add <package>            # resolves latest compatible
> pnpm add -D <package>
> ```
> Then commit `pnpm-lock.yaml`. The lockfile is the source of truth, not the spec.
>
> Same rule for **API signatures**: verify against `node_modules/<pkg>/dist/*.d.ts` or the installed source. Never write a call signature from memory.

| Package | Constraint | Notes |
|---|---|---|
| `node` | `>=22 <23` | pinned in `.nvmrc` and `package.json#engines` |
| `pnpm` | `>=9` | pinned via `packageManager` field |
| `typescript` | `^5.6` | `strict: true`, `noUncheckedIndexedAccess: true` |
| `next` | `^15` | App Router only |
| `react` / `react-dom` | `^19` | |
| `@trpc/server`, `@trpc/client`, `@trpc/react-query` | `^11` | must all be the same major |
| `@tanstack/react-query` | `^5` | required by tRPC v11 |
| `drizzle-orm`, `drizzle-kit` | latest matching pair | resolve together |
| `pg` | `^8` | |
| `pg-boss` | `^10` | |
| `zod` | `^3` | do not use v4 until tRPC support confirmed |
| `luxon`, `@types/luxon` | `^3` | |
| `tailwindcss` | `^4` | CSS-first config |
| `recharts` | `^2` | |
| `@xyflow/react`, `dagre` | latest | |
| `vitest` | `^2` | |
| `@playwright/test` | latest | |
| `@clerk/nextjs` | latest | |
| `ai` (Vercel AI SDK) | `^4` | |

---

## 2. Repository Tree — Annotated

```
dl-planner/
├── .nvmrc                        # "22"
├── package.json                  # packageManager, engines, turbo scripts only
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── eslint.config.js              # flat config, boundary rules (§4)
├── .env.example                  # every var, no secrets
├── AGENTS.md                     # ≤120 lines, always loaded
├── CHANGELOG-AGENT.md            # 5 lines per merged ticket
├── docs/
│   ├── 00-CANON.md
│   ├── 01-STACK-IMPLEMENTATION.md
│   ├── 02-CONTEXT-ENGINEERING.md
│   ├── 03-AGENT-GUARDRAILS.md
│   └── tickets/T*.md             # one card per ticket
│
├── apps/
│   ├── web/
│   │   ├── next.config.ts
│   │   ├── app/
│   │   │   ├── layout.tsx                    # Clerk provider, tRPC provider, fonts
│   │   │   ├── globals.css                   # Tailwind v4 @theme block
│   │   │   ├── (auth)/sign-in/[[...rest]]/page.tsx
│   │   │   ├── (onboarding)/
│   │   │   │   ├── layout.tsx                # progress rail
│   │   │   │   ├── questions/page.tsx        # Q1–Q12 wizard
│   │   │   │   ├── diagnostic/page.tsx
│   │   │   │   ├── feasibility/page.tsx
│   │   │   │   └── preview/page.tsx
│   │   │   ├── (app)/
│   │   │   │   ├── layout.tsx                # sidebar shell
│   │   │   │   ├── today/page.tsx
│   │   │   │   ├── task/[id]/page.tsx
│   │   │   │   ├── progress/page.tsx
│   │   │   │   ├── skills/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── recovery/page.tsx
│   │   │   └── api/trpc/[trpc]/route.ts
│   │   ├── server/
│   │   │   ├── trpc.ts                       # initTRPC, context, middleware
│   │   │   ├── context.ts                    # { db, learnerId, now, tz }
│   │   │   └── routers/
│   │   │       ├── _app.ts
│   │   │       ├── onboarding.ts
│   │   │       ├── plan.ts
│   │   │       ├── task.ts
│   │   │       ├── review.ts
│   │   │       ├── progress.ts
│   │   │       └── impact.ts
│   │   ├── components/                       # see §7
│   │   └── lib/{trpc.ts,offline.ts,analytics.ts,cn.ts}
│   │
│   └── worker/
│       ├── index.ts                          # pg-boss bootstrap + graceful shutdown
│       ├── lock.ts                           # advisory lock helper
│       └── jobs/{midnight-rollover,weekly-recompute,review-scheduler,
│                 snapshot-writer,link-health-check,reminder-dispatch}.ts
│
└── packages/
    ├── contracts/src/
    │   ├── constants.ts     # §1 of CANON — the ONLY place numeric literals live
    │   ├── enums.ts         # §2 of CANON
    │   ├── errors.ts        # §7 of CANON
    │   ├── profile.ts  skill.ts  task.ts  plan.ts  projection.ts  diagnostic.ts
    │   └── index.ts         # the ONLY barrel in the repo
    │
    ├── domain/src/          # PURE. imports: contracts, zod, luxon. NOTHING ELSE.
    │   ├── graph/{closure,topo-sort,prune,descendants}.ts
    │   ├── mastery/{infer,diagnostic-adaptive}.ts
    │   ├── planner/{feasibility,match-resource,expand-tasks,generate-plan}.ts
    │   ├── schedule/{calendar,place-tasks,buffers}.ts
    │   ├── slip/{state-machine,reallocate-debt,recovery-mode,visible-overdue}.ts
    │   ├── impact/{velocity,decay-penalty,project,immediate,levers}.ts
    │   ├── scaffold/ladder.ts
    │   ├── spacing/fsrs-lite.ts
    │   ├── recompute/weekly.ts
    │   └── index.ts
    │
    ├── db/
    │   ├── drizzle.config.ts
    │   ├── src/schema/{learner,content,plan,index}.ts
    │   ├── src/repos/{learner,plan,task,review,snapshot,content}.ts
    │   ├── src/{client,tx}.ts
    │   ├── drizzle/*.sql                     # GENERATED. never hand-edited.
    │   └── seed/{content.ts,dev.ts}
    │
    ├── content/
    │   ├── skills.yaml  resources.yaml  diagnostics.yaml  retrieval.yaml
    │   ├── tasks/*.yaml
    │   └── src/{load.ts,validate.ts,schemas.ts}
    │
    └── fixtures/                             # golden JSON, shared by all tests
        ├── graph/  mastery/  planner/  schedule/  slip/  impact/  spacing/
```

---

## 3. Configuration Files — Exact Contents

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test":      { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "lint":      {},
    "db:generate": { "cache": false },
    "db:migrate":  { "cache": false },
    "dev":       { "cache": false, "persistent": true }
  }
}
```

### `tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "exclude": ["node_modules", "dist", ".next"]
}
```

`noUncheckedIndexedAccess` is deliberate: it forces agents to handle `undefined` on array access, which catches a whole class of off-by-one errors at compile time.

### `.env.example` — every variable, no exceptions
```bash
# ── database ──
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@host/db?sslmode=require   # migrations

# ── auth (Clerk) ──
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/today

# ── worker ──
WORKER_CONCURRENCY=5
PGBOSS_SCHEMA=pgboss

# ── llm (optional; system must degrade gracefully without) ──
ANTHROPIC_API_KEY=
LLM_MODEL=
LLM_ENABLED=false

# ── observability ──
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
SENTRY_DSN=

# ── runtime ──
NODE_ENV=development
APP_URL=http://localhost:3000
```

---

## 4. Boundary Enforcement (the mechanism that makes context isolation real)

```js
// eslint.config.js — dependency rules
export default [
  {
    files: ['packages/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@dl/db', '@dl/db/*', '@dl/content', '@dl/content/*',
                    '**/apps/**', 'drizzle-orm', 'pg', 'next', 'react'],
            message: 'packages/domain must remain PURE. Only @dl/contracts, zod, luxon.' }
        ]
      }],
      'no-restricted-globals': ['error',
        { name: 'Date',   message: 'Inject `now` as a parameter. Domain must be deterministic.' },
        { name: 'Math',   message: 'Math.random() forbidden. Inject randomness if needed.' }
      ],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    }
  },
  {
    files: ['packages/content/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [
      { group: ['@dl/db*', '@dl/domain*', '**/apps/**'] }] }] }
  },
  {
    files: ['packages/**/*.ts', 'apps/**/*.ts', 'apps/**/*.tsx'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'no-restricted-syntax': ['error', {
        selector: "ExportAllDeclaration",
        message: 'No barrel re-exports below package root. Import direct paths.'
      }],
    }
  }
];
```

`Date` and `Math` are globally banned inside `domain`. Every function receives `now: DateTime` explicitly. This is what makes golden-fixture testing possible and is non-negotiable.

---

## 5. Database Layer

### 5.1 Client and transaction helper
```ts
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
export const db = drizzle(pool, { schema });
export type DB = typeof db;
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];
```

```ts
// packages/db/src/tx.ts
export async function withPlanLock<T>(
  db: DB, planId: string, fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // 64-bit advisory lock keyed on planId — serialises all plan mutations
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${planId}, 0))`);
    return fn(tx);
  });
}
```

**Rule:** every mutation that changes a plan runs inside `withPlanLock` and ends by inserting a `ScheduleSnapshot`. No exceptions.

### 5.2 Migration policy
```bash
pnpm db:generate   # drizzle-kit generate  → emits packages/db/drizzle/NNNN_*.sql
pnpm db:migrate    # drizzle-kit migrate
```

> **Agents may never hand-write, hand-edit, or invent SQL migration files.** Modify the Drizzle schema in TypeScript, run `db:generate`, and commit both the schema change and the generated SQL. A PR containing a hand-authored file in `drizzle/` is rejected.

### 5.3 Repository pattern
One file per aggregate. Repositories accept `Tx | DB` as the first argument so they compose inside transactions.

```ts
// packages/db/src/repos/task.ts  — shape reference
export const taskRepo = {
  async forDate(x: Tx | DB, planId: string, date: string) { /* ... */ },
  async transition(x: Tx, id: string, to: TaskState) { /* ... */ },
  async bulkReschedule(x: Tx, moves: { id: string; date: string }[]) { /* ... */ },
};
```

Repositories contain **zero business logic**. They read, write, and map rows. All decisions happen in `packages/domain`.

---

## 6. tRPC Layer

### 6.1 Context
```ts
// apps/web/server/context.ts
export async function createContext(opts: FetchCreateContextFnOptions) {
  const { userId } = await auth();                    // Clerk
  const learner = userId ? await learnerRepo.byClerkId(db, userId) : null;
  return {
    db,
    clerkId: userId,
    learner,
    // injected time — makes every procedure testable and timezone-correct
    now: DateTime.now().setZone(learner?.timezone ?? 'UTC'),
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
```

### 6.2 Middleware chain
```ts
// apps/web/server/trpc.ts
const t = initTRPC.context<Context>().create({ transformer: superjson });

const authed = t.middleware(({ ctx, next }) => {
  if (!ctx.clerkId) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, clerkId: ctx.clerkId } });
});

const onboarded = authed.unstable_pipe(({ ctx, next }) => {
  if (!ctx.learner) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'NO_LEARNER' });
  return next({ ctx: { ...ctx, learner: ctx.learner } });
});

// domain errors → tRPC errors, consistently
const domainErrors = t.middleware(async ({ next }) => {
  const r = await next();
  if (!r.ok && r.error.cause instanceof DomainError) {
    r.error.message = r.error.cause.code;
  }
  return r;
});

export const publicProcedure  = t.procedure.use(domainErrors);
export const authedProcedure  = publicProcedure.use(authed);
export const learnerProcedure = publicProcedure.use(onboarded);
```

### 6.3 Procedure implementation pattern — mandatory

Every mutation follows this exact shape. Deviation is a review rejection.

```ts
complete: learnerProcedure
  .input(CompleteTaskInput)                        // Zod from @dl/contracts
  .mutation(async ({ ctx, input }) => {
    return withPlanLock(ctx.db, input.planId, async (tx) => {
      // 1. LOAD — gather everything the pure function needs
      const state = await taskRepo.loadForCompletion(tx, input.taskId);

      // 2. DECIDE — call pure domain, pass `now` explicitly
      const result = domain.completeTask({ ...state, input, now: ctx.now });

      // 3. PERSIST — apply the returned deltas, no decisions here
      await taskRepo.applyDeltas(tx, result.deltas);
      await snapshotRepo.write(tx, result.snapshot);

      // 4. EMIT — telemetry outside the decision path
      track('task_completed', result.telemetry);

      return result.response;
    });
  }),
```

---

## 7. Frontend

### 7.1 Component inventory
```
components/
├── ui/                    # shadcn primitives — copied in, editable
│   button.tsx card.tsx dialog.tsx progress.tsx slider.tsx checkbox.tsx
│   radio-group.tsx badge.tsx accordion.tsx tooltip.tsx skeleton.tsx
├── onboarding/
│   question-single.tsx question-multi.tsx question-chips.tsx
│   question-stepper.tsx question-date.tsx realism-modal.tsx
│   diagnostic-item.tsx diagnostic-dots.tsx
│   feasibility-levers.tsx plan-preview.tsx
├── task/
│   task-card.tsx task-detail.tsx hint-chain.tsx stuck-timer.tsx
│   difficulty-rating.tsx deliverable-input.tsx
├── charts/
│   trajectory-chart.tsx      # V1  Recharts LineChart + ReferenceLine/Area
│   capacity-bars.tsx         # V2  Recharts BarChart stacked, horizontal
│   impact-simulator.tsx      # V3  Dialog + Slider, live recompute
│   skill-map.tsx             # V4  @xyflow/react + dagre layout
│   retention-heatmap.tsx     # V5  custom SVG grid
└── shell/
    sidebar.tsx topbar.tsx overdue-strip.tsx recovery-card.tsx
```

### 7.2 Chart data contracts

Charts receive **pre-computed** data. They perform no domain arithmetic.

```ts
type TrajectoryPoint = {
  date: string;            // ISO date
  planned: number;         // cumulative hours
  actual: number | null;   // null after today
  projected: number | null;// null before today
};
type TrajectoryProps = {
  points: TrajectoryPoint[];
  targetDate: string;
  projectedDate: string;
  slipDays: number;
  confidence: 'low' | 'medium' | 'high';   // 'low' ⇒ render a band, not a line
};
```

### 7.3 Offline layer
```ts
// apps/web/lib/offline.ts
// - persist TanStack Query cache to IndexedDB via idb-keyval
// - persist ONLY: task.today, task.get, plan.get
// - mutations queue with optimistic update; flush on 'online'
// - conflict policy: server wins on state, client wins on actualMinutes/difficultyRating
```

---

## 8. Worker

```ts
// apps/worker/index.ts
const boss = new PgBoss({ connectionString: process.env.DATABASE_URL!,
                          schema: process.env.PGBOSS_SCHEMA ?? 'pgboss' });
await boss.start();

const jobs = [
  ['midnight-rollover',  '5 * * * *',  midnightRollover],
  ['weekly-recompute',   '0 * * * *',  weeklyRecompute],
  ['review-scheduler',   '0 3 * * *',  reviewScheduler],
  ['snapshot-writer',    '30 3 * * *', snapshotWriter],
  ['link-health-check',  '0 4 * * 0',  linkHealthCheck],
  ['reminder-dispatch',  '*/15 * * * *', reminderDispatch],
] as const;

for (const [name, cron, handler] of jobs) {
  await boss.work(name, { batchSize: 1 }, handler);
  await boss.schedule(name, cron, {}, { tz: 'UTC' });
}

process.on('SIGTERM', async () => { await boss.stop({ graceful: true }); process.exit(0); });
```

**Every handler has the identical five-step shape:**
```ts
export async function handler(job: Job<Payload>) {
  const key = idempotencyKey(job.data);              // 1. compute key
  if (await alreadyRan(key)) return;                 // 2. idempotency guard
  await withPlanLock(db, job.data.planId, async tx => {
    const state  = await load(tx, job.data);         // 3. load
    const result = domain.someFn({ ...state, now }); // 4. decide (pure)
    await persist(tx, result);                       // 5. persist + snapshot
  });
}
```

**Timezone sweep pattern** — the hourly cron finds learners whose *local* hour matches:
```sql
SELECT id FROM learners
WHERE status = 'active'
  AND EXTRACT(HOUR FROM (now() AT TIME ZONE timezone)) = 0;
```

---

## 9. Testing

| Layer | Tool | Rule |
|---|---|---|
| `packages/domain` | Vitest, no DB | 100% of exported functions. Golden fixtures only — agents may not author new cases. |
| `packages/db` repos | Vitest + Neon branch | Round-trip per repo method. |
| tRPC routers | Vitest, `createCaller` | Happy path + one error path per procedure. |
| Worker jobs | Vitest | Idempotency: run twice, assert identical end state. |
| E2E | Playwright | Exactly 4 flows (below). |

**The four E2E flows — no more in v1:**
1. Onboard → diagnostic → feasibility → plan created
2. Complete a task → snapshot written → trajectory reflects it
3. Miss a day → rollover → impact shown → lever applied
4. Weekly recompute → scaffold adjusts → weeks 3–4 materialise

**Golden fixture format:**
```json
{
  "name": "3h missed, 1h buffer, 6h/wk over 3 active days",
  "input":  { "missedHours": 3, "remainingBufferHours": 1,
              "profile": { "committedHoursPerWeek": 6, "activeDays": [1,3,5] } },
  "expect": { "absorbed": false, "unabsorbedHours": 2, "slipCalendarDays": 3 }
}
```

---

## 10. CI Pipeline

```yaml
# .github/workflows/ci.yml
name: ci
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm turbo typecheck

      - name: Lint (includes boundary + max-lines + no-barrel rules)
        run: pnpm turbo lint

      - name: Content validation
        run: pnpm --filter @dl/content validate
        # asserts: DAG acyclic · no orphan nodes · every node has ≥1 matching resource
        #          per (rung × budget × compute) combo · every task has a non-empty
        #          successCriterion · every diagnostic answer_index in 0..3
        #          · every canon enum referenced actually exists

      - name: Unit tests
        run: pnpm turbo test

      - name: Migrations apply cleanly on a fresh branch DB
        run: pnpm db:migrate
        env: { DATABASE_URL: ${{ secrets.NEON_BRANCH_URL }} }

      - name: Drift check — schema and generated SQL are in sync
        run: pnpm db:generate && git diff --exit-code packages/db/drizzle

      - name: E2E
        run: pnpm exec playwright test
```

The **drift check** is important: it fails the build if an agent edited the schema without regenerating, or hand-edited a migration.

---

## 11. Deployment

| Service | Platform | Command | Notes |
|---|---|---|---|
| `web` | Railway | `pnpm --filter web build` → `pnpm --filter web start` | health: `/api/health` |
| `worker` | Railway | `pnpm --filter worker build` → `node apps/worker/dist/index.js` | 1 replica in v1; advisory locks make >1 safe |
| Postgres | Neon | — | branch per PR; `DATABASE_URL_UNPOOLED` for migrations |

Migrations run as a **release command** before the new web version receives traffic. Schema changes must be backward-compatible for one deploy (expand → migrate → contract).

---
---

# `02-CONTEXT-ENGINEERING.md`
## Token & Context Optimization

---

## 1. Cost Model

Agent cost is dominated by **context re-read**, not generation. Naive execution of this build loads the full spec (~40k tokens with the canon) plus exploratory file reading (~15k) into every one of ~37 tickets across ~4 iterations: **≈ 5.9M input tokens**. The techniques below bring it to **≈ 640k**.

**Governing principle:**
> Never let an agent read a file to learn something a type signature or a canon entry could have told it.

---

## 2. Context Budget Hierarchy

| Tier | Budget | Contents | Loaded |
|---|---|---|---|
| **T0 Always** | ≤ 1,200 tok | `AGENTS.md` — router, not manual | Every session |
| **T1 Contracts** | ≤ 3,000 tok | `packages/contracts/src/index.ts` type surface | Every implementation ticket |
| **T2 Canon slice** | ≤ 2,500 tok | **Only the canon sections the ticket cites** | Per ticket |
| **T3 Ticket** | ≤ 2,000 tok | Ticket card: goal, allowlist, acceptance, fixtures | Per ticket |
| **T4 Files** | ≤ 6,000 tok | Files on the allowlist, nothing else | Per ticket |
| **T5 On demand** | — | Additional canon sections, by explicit citation | Rare |

**Hard ceiling: ~15k tokens per ticket.** Exceeding it means the ticket is too large. Split it.

### 2.1 Canon slicing (critical)

`00-CANON.md` is ~14k tokens. Loading it whole into 37 tickets costs 518k tokens for content that is 90% irrelevant per ticket.

**Solution:** the canon is chunked at build time into addressable fragments.

```
docs/canon/
  constants.md          §1   ~1,100 tok
  enums.md              §2   ~900 tok
  transitions.md        §2.1 ~400 tok
  onboarding.md         §3   ~3,200 tok
  diagnostics.md        §4   ~4,100 tok
  skill-graph.md        §5   ~2,800 tok
  formulas.md           §6   ~1,700 tok
  errors.md             §7   ~200 tok
```

Ticket cards cite fragments by name. A ticket implementing the impact engine loads `constants.md` + `formulas.md` (~2.8k) instead of the whole canon (~14k). **Saves ~430k tokens across the build.**

---

## 3. Structural Techniques

### 3.1 The pure-domain firewall — largest single win
`packages/domain` imports only `contracts`, `zod`, `luxon`, enforced by ESLint. An agent implementing `project()` never sees Drizzle, tRPC, React, or pg-boss. The nine hardest tickets run at ~9k tokens each instead of ~45k.
**Saves ≈ 320k tokens.**

### 3.2 Contract-first, then parallel
Ticket 0.2 authors every type once. Afterwards no ticket reads another ticket's *implementation* — only its exported types. This eliminates the "open three files to learn the shape" pattern that dominates naive agent runs.
**Saves ≈ 180k tokens.**

### 3.3 File allowlists — searching is forbidden
```
ALLOWLIST (read + write):
  packages/domain/src/impact/*.ts
  packages/domain/src/impact/__tests__/*.ts
READ-ONLY:
  packages/contracts/src/projection.ts
  packages/contracts/src/constants.ts
CANON:
  docs/canon/formulas.md §"VELOCITY & PROJECTION", §"IMMEDIATE SLIP"
FIXTURES:
  packages/fixtures/impact/**/*.json
FORBIDDEN: everything else.
If you believe you need another file: STOP and emit NEEDS_FILE: <path> — <reason>.
```
Semantic search across a monorepo routinely burns 8–20k tokens returning mostly-irrelevant chunks, and encourages the agent to pattern-match on unrelated code.
**Saves ≈ 220k tokens.**

### 3.4 Golden fixtures as specification
```json
{ "name": "threshold concept, self-report only, no diagnostic",
  "input": { "node": { "id": "dl.bp", "isThresholdConcept": true },
             "selfSignal": 1, "diagSignal": null },
  "expect": { "confidence": 0.55, "state": "partial", "needsVerification": false } }
```
90 tokens, zero ambiguity. The prose paragraph describing the same rule is 180 tokens and open to interpretation — and misinterpretation costs a full iteration, which is the real expense.
**Saves ≈ 70k tokens plus roughly one iteration per algorithmic ticket.**

### 3.5 Deterministic naming — never search for a path
| Concept | Path (derivable, never searched) |
|---|---|
| domain fn `computeVelocity` | `packages/domain/src/impact/velocity.ts` |
| its test | `packages/domain/src/impact/__tests__/velocity.test.ts` |
| its fixtures | `packages/fixtures/impact/velocity/*.json` |
| tRPC `task.complete` | `apps/web/server/routers/task.ts`, export `complete` |
| table `task_instances` | `packages/db/src/schema/plan.ts`, export `taskInstances` |
| canon section §6 | `docs/canon/formulas.md` |

### 3.6 No barrel re-exports below package root
`export * from './x'` drags an entire module graph into the type-check context and into the agent's reading path. Only each package's root `index.ts` may re-export. ESLint-enforced via `no-restricted-syntax` on `ExportAllDeclaration`.

### 3.7 300-LOC file ceiling
A 900-line file costs ~12k tokens to read and ~12k to rewrite. Three 300-line files cost ~4k each, and typically only one needs touching.

---

## 4. Prompt Caching

Order every request so the stable prefix is **byte-identical** across a phase:

```
[1] AGENTS.md                    identical always            ← CACHED
[2] contracts type surface       identical within a phase    ← CACHED
[3] phase conventions block      identical within a phase    ← CACHED
──────────────────── cache boundary ────────────────────
[4] canon fragments              varies
[5] ticket card                  varies
[6] allowlisted files            varies
[7] instruction                  varies
```

Never interleave variable content into the prefix. Mutating `[2]` mid-phase invalidates the cache for every remaining ticket in that phase — which is why `contracts` is frozen after ticket 0.2 and changes only via an explicit `CONTRACT_CHANGE` ticket that restarts the phase.

**Typical saving:** 70–90% on the prefix, which is ≈35% of total input.

---

## 5. Model Routing

Uniform frontier routing is the second-largest source of waste after context bloat.

| Ticket class | Tier | Tickets | Rationale |
|---|---|---|---|
| Algorithms, orchestrators, state machines | **Frontier** | 1.1–1.9, 5.2 | Subtle correctness; silent failures are expensive |
| API routers, repositories, job scaffolding | **Mid** | 2.4, 4.x, 5.1 | Mechanical given types; typecheck catches errors |
| Schema, config, UI components, scaffolding | **Small** | 0.x, 2.1–2.3, 6.x | Highly patterned, abundant in training data |
| Content YAML authoring | **Mid + human review** | 3.x | Judgement-heavy, low technical risk, CI-gated |
| Test generation from existing fixtures | **Small** | all | Purely mechanical |

**Saves 55–65% of spend at equal quality.**

---

## 6. Generate, Never Author

| Artifact | Source of truth | Generator |
|---|---|---|
| DB types | Drizzle schema | inference |
| SQL migrations | Drizzle schema | `drizzle-kit generate` — **never hand-written** |
| API client types | tRPC router | inferred, zero codegen |
| Runtime validators | Zod in `contracts` | reused directly |
| Seed data | `content/*.yaml` | loader script |
| Test data builders | Zod schemas | `zod-fixture` |
| Canon fragments | `00-CANON.md` | split script |

Anything generated is something an agent never spends tokens producing and never subtly gets wrong.

---

## 7. Session Protocol

| Rule | Reason |
|---|---|
| **One ticket per session. Always fresh context.** | A 10-turn thread carries every prior turn into every subsequent request. Quadratic cost, zero benefit. |
| **Max 3 iterations, then escalate.** | An agent failing three times is missing context, not effort. Further attempts are pure waste. |
| **Diff-only output.** | "Return a unified diff. No explanation, no summary, no restated code." Cuts output ~60%. |
| **Tests first, same session.** | Forces fixture loading once; provides its own verification loop. |
| **Append 5 lines to `CHANGELOG-AGENT.md` on merge.** | This file — never git log, never diffs — is the only history a future agent reads. |

### `CHANGELOG-AGENT.md` entry format — exactly 5 lines
```
## T1.7 impact engine  [merged 2025-xx-xx]
Added: velocity(EWMA α=0.5), decayPenalty(k=0.08 cap 3×), project(), immediateImpact(), computeLevers()
Exports: packages/domain/src/impact/index.ts
Decision: Projection.confidence='low' when <2 weeks history — UI MUST render a range, not a date
Gotcha: slipCalendarDays uses active-day density (7/activeDays.length), not raw calendar days
```
~85 tokens replaces a 4k-token diff review.

---

## 8. Measurement

| Metric | Target | Action if breached |
|---|---|---|
| Input tokens per merged ticket | < 22k | Tighten allowlist; split ticket; slice canon harder |
| Iterations to merge | ≤ 2 | Ticket card under-specified — add fixtures |
| Prefix cache hit rate | > 70% | Prefix is being mutated mid-phase |
| `NEEDS_FILE` escalations | ≤ 1 per ticket | Allowlist is wrong |
| `CANON_GAP` reports | > 0 is **good** early | Each one prevented a hallucination — fix the canon |
| Files touched per ticket | ≤ 6 | Split ticket |
| Reverted merges | < 10% | Move ticket class up a model tier |

---

## 9. Projected Budget

| Phase | Tickets | Tier | Input tokens |
|---|---|---|---|
| 0 Scaffold | 3 | small | 26k |
| 1 Domain | 9 | frontier | 195k |
| 2 Persistence | 4 | mid | 58k |
| 3 Content | 5 | mid | 125k |
| 4 API | 5 | mid | 72k |
| 5 Worker | 2 | frontier/mid | 36k |
| 6 UI | 6 | small | 88k |
| 7 Hardening | 3 | mid | 42k |
| **Total** | **37** | | **≈ 642k** |

Against ≈5.9M at naive uniform-frontier execution: **≈89% token reduction, ≈93% cost reduction** — with fewer defects, because each agent sees only what it needs.

---
---

# `03-AGENT-GUARDRAILS.md`
## Anti-Hallucination & Anti-Drift Protocol

---

## 1. Why Agents Drift

Five root causes, each with a structural fix. Note that none of the fixes is "write a better prompt."

| Root cause | Structural fix |
|---|---|
| Asked to invent what should be specified | `00-CANON.md` + mandatory `CANON_GAP` escalation |
| Given too much irrelevant context | Allowlists + canon slicing |
| No fast verification signal | `strict` TS + golden fixtures + CI gates |
| Long conversations with accumulating drift | One ticket, one session, hard reset |
| Recalling API surfaces from training data | "Resolve, don't recall" — inspect `node_modules` |

---

## 2. The Five Escalation Signals

An agent must **stop and emit** rather than proceed on assumption. Emitting a signal is **success**, not failure — it is far cheaper than a wrong implementation.

```
CANON_GAP:   <value/enum/string/formula> — needed for <ticket>.<file>
NEEDS_FILE:  <path> — <one-line reason>
CONTRACT_GAP:<type or field> missing from @dl/contracts — needed for <what>
AMBIGUOUS:   <two or more valid readings> — which is intended?
BLOCKED:     <ticket dependency not merged> — waiting on <ticket id>
```

**Rules:**
- These are terminal for the session. Do not continue after emitting one.
- Never resolve ambiguity by picking the more likely option.
- Never stub a "reasonable default" and note it in a comment.
- Never widen a type to `any`, `unknown`, or `string` to bypass a missing enum.

---

## 3. Absolute Prohibitions

Numbered so review comments can cite them.

| # | Prohibition |
|---|---|
| **P1** | Never write a package version from memory. Run `pnpm add <pkg>` and commit the lockfile. |
| **P2** | Never write an external URL from memory. All URLs come from `content/resources.yaml`. |
| **P3** | Never hand-write or hand-edit files in `packages/db/drizzle/`. Use `db:generate`. |
| **P4** | Never write a numeric literal in `packages/domain`. Import from `CONST`. |
| **P5** | Never use `new Date()`, `Date.now()`, or `Math.random()` in `packages/domain`. Inject them. |
| **P6** | Never use `any`, `as unknown as`, or `@ts-ignore`. If types resist, emit `CONTRACT_GAP`. |
| **P7** | Never add, modify, or delete a golden fixture. Fixtures are the specification. |
| **P8** | Never touch a file outside the ticket allowlist. Emit `NEEDS_FILE`. |
| **P9** | Never invent an enum member, error code, skill node ID, or diagnostic item. Emit `CANON_GAP`. |
| **P10** | Never paraphrase user-facing copy defined in canon §3. Copy is verbatim. |
| **P11** | Never write an API call signature from memory. Verify against installed `.d.ts`. |
| **P12** | Never create a `README.md`, docs file, or summary unless the ticket asks for one. |
| **P13** | Never refactor code outside the ticket's stated goal, however tempting. |
| **P14** | Never mark a task complete with failing typecheck, lint, or tests. |
| **P15** | Never use `export *` below a package root. |

---

## 4. Hallucination-Prone Zones and Their Mitigations

| Zone | Failure mode | Mitigation |
|---|---|---|
| **Package versions** | Invents `"^4.2.1"` that does not exist | P1: resolve via install, lockfile is truth |
| **Library API signatures** | Uses a v3 API on a v4 package | P11: read `node_modules/<pkg>/dist/*.d.ts` before calling |
| **External URLs** | Fabricates plausible-looking video/doc links | P2 + `link-health-check` job + CI HEAD check on content |
| **SQL dialect** | Writes MySQL syntax into Postgres | P3: never hand-write SQL; Drizzle emits it |
| **Enum strings** | `'in-progress'` instead of `'in_progress'` | Canon §2 + TS union types make it a compile error |
| **Magic numbers** | `0.2` instead of `CONST.BUFFER_RATIO_DEFAULT` | P4 + lint rule `no-magic-numbers` in domain |
| **Timezone handling** | `new Date()` in a rollover computation | P5 + ESLint `no-restricted-globals` |
| **Skill node IDs** | Invents `dl.backpropagation` for `dl.bp` | Canon §5 + TS literal union `SkillNodeId` |
| **Diagnostic answers** | Changes an `answer_index` to match its own reasoning | P7 + content validator asserts checksums |
| **Formula variants** | Uses forward difference where central is specified | Canon §6 is the spec; fixtures fail otherwise |
| **Scope creep** | Adds "helpful" caching, logging, retries | P13 + `MAX_FILES_PER_TICKET` |
| **Copy drift** | Rewrites onboarding text to be "clearer" | P10 + snapshot test on user-facing strings |

---

## 5. Mandatory Pre-Output Self-Check

Every agent runs this checklist before emitting. It is cheap, and it catches most violations.

```
□ Every file I touched is on the allowlist
□ No package version written from memory (P1)
□ No URL written from memory (P2)
□ No file created in packages/db/drizzle/ by hand (P3)
□ No numeric literal in packages/domain — all from CONST (P4)
□ No Date/Math in packages/domain — `now` is a parameter (P5)
□ No any / as unknown as / @ts-ignore (P6)
□ No fixture added, edited, or deleted (P7)
□ Every enum value I used appears verbatim in canon §2 (P9)
□ Every user-facing string matches canon §3 verbatim (P10)
□ Every API signature verified against installed types, not memory (P11)
□ No unrequested README, doc, or summary file (P12)
□ No refactoring outside the stated goal (P13)
□ pnpm typecheck passes
□ pnpm lint passes
□ pnpm test passes (all fixtures green)
□ Output is a unified diff, no prose
□ CHANGELOG-AGENT.md updated with exactly 5 lines
```

---

## 6. Ticket Card Contract

Every ticket is a filled instance of this template. A ticket missing any field is not ready to be worked.

```md
# T1.2 — Mastery Inference
Model tier: FRONTIER
Est. context: 8.5k tokens
Depends on: T0.2 (contracts)

## Goal
Implement inferMastery() and selectNextDiagnosticItem() as pure functions.

## Canon fragments (load these, nothing more)
docs/canon/constants.md      — §"mastery inference", §"diagnostic"
docs/canon/formulas.md       — §"MASTERY"
docs/canon/skill-graph.md    — threshold concept list only

## Allowlist
WRITE:     packages/domain/src/mastery/infer.ts
           packages/domain/src/mastery/diagnostic-adaptive.ts
           packages/domain/src/mastery/index.ts
           packages/domain/src/mastery/__tests__/*.ts
READ-ONLY: packages/contracts/src/{skill,diagnostic,constants}.ts
FIXTURES:  packages/fixtures/mastery/**/*.json   (11 cases — do not add or modify)
FORBIDDEN: everything else

## Complete specification (do not consult other documents)
confidence = diagSignal === null
             ? (selfSignal ? 0.80 : 0.15)
             : 0.40 * selfSignal + 0.60 * diagSignal
if node.isThresholdConcept && diagSignal === null: confidence = min(confidence, 0.55)
state = confidence >= 0.75 ? 'mastered' : confidence >= 0.40 ? 'partial' : 'not_started'
needsVerification = state === 'mastered' && diagSignal === null
diagSignal: correct→1, incorrect→0, skipped→0.30, unanswered→null

Adaptive selection sort order:
  1. isThresholdConcept DESC
  2. abs(item.level − currentLevel) ASC
  3. item.id ASC
Level update: correct +1, incorrect −1, skipped 0; clamp [1,5]; start at 2.
Return null when answered.length >= 8 or pool is empty.

## Acceptance criteria
- [ ] All 11 fixtures pass
- [ ] pnpm typecheck && pnpm lint clean
- [ ] Zero imports outside @dl/contracts, zod, luxon
- [ ] Zero numeric literals — all values from CONST
- [ ] No Date, no Math.random
- [ ] Selection is deterministic: same input → same item, verified by a repeat-call test

## Out of scope
Persistence, tRPC procedures, UI, diagnostic content authoring.

## Escalate if
- A fixture appears to contradict the specification above → AMBIGUOUS
- A required constant is absent from CONST → CANON_GAP
```

---

## 7. `AGENTS.md` — The Only Always-Loaded File

Keep under 120 lines. It is a router, not a manual.

```md
# Agent Instructions

## Commands
pnpm typecheck · pnpm lint · pnpm test · pnpm test --filter domain · pnpm db:generate

## Dependency rule (lint-enforced — violation fails the build)
content → contracts
domain  → contracts, zod, luxon        # NEVER db, content, apps, react, next
db      → contracts, domain
apps    → all

## Invariants — never violate
1. packages/domain is PURE. No I/O. No Date. No Math.random. `now` is a parameter.
2. All numeric values in domain come from CONST (packages/contracts/src/constants.ts).
3. schedule_snapshots is APPEND-ONLY. Never UPDATE, never DELETE.
4. All plan mutations run inside withPlanLock() and end by writing a snapshot.
5. All dates use Luxon with an explicit IANA zone.
6. Max 3 overdue items are ever shown to a learner. Never punitive copy.
7. Every task template needs a non-empty successCriterion. CI enforces it.
8. Max 300 lines per file. No `export *` below package root.

## Prohibitions (docs/03-AGENT-GUARDRAILS.md §3 for full list)
P1 no versions from memory · P2 no URLs from memory · P3 no hand-written migrations
P4 no magic numbers in domain · P5 no Date/Math in domain · P6 no any/@ts-ignore
P7 never modify fixtures · P8 never leave the allowlist · P9 never invent canon values
P10 never paraphrase canon copy · P11 verify API signatures against installed types
P12 no unrequested docs · P13 no unrequested refactors · P14 never ship red CI

## When you do not know something — STOP and emit
CANON_GAP: <value> — needed for <ticket>.<file>
NEEDS_FILE: <path> — <reason>
CONTRACT_GAP: <type/field> — needed for <what>
AMBIGUOUS: <readings> — which is intended?
BLOCKED: waiting on <ticket id>
Emitting one of these is SUCCESS. Guessing is failure.

## Canon
docs/canon/{constants,enums,transitions,onboarding,diagnostics,skill-graph,formulas,errors}.md
Load ONLY the fragments your ticket cites.

## Conventions
Files kebab-case · types PascalCase · functions camelCase
Tests colocated in __tests__/<name>.test.ts
Fixtures in packages/fixtures/<area>/<name>/*.json — READ them, never invent cases
Explicit return types on all exports
Errors: throw DomainError(code) using codes from canon §7

## Protocol
- Touch ONLY allowlisted files. Need another? STOP, emit NEEDS_FILE.
- Do not search the codebase. Everything you need is listed.
- Write tests first, then implementation.
- Output a unified diff. No prose, no summary, no restated code.
- Run the pre-output self-check (docs/03-AGENT-GUARDRAILS.md §5).
- On completion append exactly 5 lines to CHANGELOG-AGENT.md.
```

---

## 8. Anti-Patterns

| Anti-pattern | Cost | Do instead |
|---|---|---|
| Pasting the full canon into every prompt | 14k × 37 tickets = 518k | Slice canon into fragments; cite by name |
| "Explore the codebase and figure out where this goes" | 10–25k, frequently wrong | File allowlist |
| Long-running chat threads | Quadratic growth, accumulating drift | One ticket, one session |
| Agent hand-writing SQL migrations | Silent schema drift, CI drift-check failure | `drizzle-kit generate` |
| Frontier model for CRUD and UI | 8–15× overspend | Route by ticket class |
| Prose behavioural specs | Ambiguity → re-work | Golden JSON fixtures |
| Requesting explanation with the diff | +40% output tokens | Diff only |
| Agent inventing test cases | Untested edges, redundant tests | Fixtures are the spec |
| One 1,200-line planner.ts | Every edit reloads 16k | 300-LOC ceiling |
| Letting an agent choose a library | Inconsistency across tickets | Stack is fixed; deviation is a lint failure |
| "Use a reasonable default for now" | Silent divergence from spec, discovered in week 6 | `CANON_GAP` |
| Accepting a PR with a new `any` | Type erosion compounds across tickets | P6 + CI |

---

## 9. Human Review Gates

Not everything can be automated. Three gates require a human.

| Gate | When | What to check |
|---|---|---|
| **Contracts review** | After T0.2, before Phase 1 | Every type in canon §2/§5 is represented; naming is final. Errors here propagate to all 37 tickets. |
| **Content review** | Phase 3, per file | Resource URLs actually resolve and are the right segment; task success criteria are objective and checkable; diagnostic answer indices are correct. |
| **Domain algorithm review** | T1.9, before Phase 2 | Read `generate-plan.ts` and `weekly.ts` line by line. These orchestrate everything; a subtle error is invisible until users hit it. |

Everything else can merge on green CI.

---

## 10. First Three Actions

1. **Split the canon** — run the fragment script, verify each fragment's token count against §2.1.
2. **Author T0.2 (`packages/contracts`) with a frontier model, then review it line by line yourself.** Every subsequent ticket depends on those types. It is the single highest-leverage artifact in the build.
3. **Write the 11 mastery fixtures by hand** before ticket T1.2. If you cannot enumerate the cases, the specification is not yet complete — and no agent will rescue that.
