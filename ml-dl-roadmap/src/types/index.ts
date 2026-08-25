export type Status =
  | 'not_started'
  | 'planned'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'skipped'

export type Track =
  | 'project'
  | 'theory'
  | 'practice'
  | 'interview'
  | 'mlops'
  | 'system_design'
  | 'career'
  | 'reading'

export type TaskType = 'build' | 'learn' | 'practice' | 'review' | 'career'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Visibility = 'private' | 'internal' | 'public'

export type EvidenceType =
  | 'github_repo'
  | 'commit'
  | 'tagged_release'
  | 'experiment_run'
  | 'metric_table'
  | 'confusion_matrix'
  | 'error_analysis'
  | 'test_output'
  | 'ci_run'
  | 'docker_image'
  | 'deployment_url'
  | 'api_docs'
  | 'architecture_diagram'
  | 'model_card'
  | 'dataset_card'
  | 'benchmark'
  | 'load_test'
  | 'monitoring_dashboard'
  | 'alert_screenshot'
  | 'mock_feedback'
  | 'demo_video'
  | 'resume_bullet'
  | 'linkedin_post'
  | 'application_submission'
  | 'referral_request'
  | 'other'

export type ApplicationStatus =
  | 'saved'
  | 'researching'
  | 'networking'
  | 'referral_requested'
  | 'applied'
  | 'recruiter_screen'
  | 'technical_screen'
  | 'system_design'
  | 'hiring_manager'
  | 'final_round'
  | 'offer'
  | 'rejected'
  | 'withdrawn'

export type SkillKey =
  | 'python'
  | 'dsa'
  | 'sql'
  | 'mathematics'
  | 'classical_ml'
  | 'deep_learning'
  | 'pytorch'
  | 'specialization'
  | 'mlops'
  | 'deployment'
  | 'testing'
  | 'ml_system_design'
  | 'communication'
  | 'project_depth'

export type CapabilityRequirement = 'required' | 'optional' | 'na'

export type AvailabilityTier = 'minimum' | 'standard' | 'intensive' | 'custom'

export interface Timestamps {
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends Timestamps {
  id: string
  currentRole: string
  yearsExperience: number
  targetRoles: string[]
  existingMlExperience: string
  preferredSpecialization: string
  primaryCloud: string
  modelFramework: string
  experimentTracking: string
  cicd: string
  serving: string
  targetMarket: string
  startDate: string
  onboardingComplete: boolean
}

export interface Preferences extends Timestamps {
  id: string
  userId: string
  weeklyHours: number
  availabilityTier: AvailabilityTier
  weekdayAvailability: string[]
  weekendAvailability: boolean
  preferredSessionLength: number
  reminderPreference: 'daily' | 'weekly' | 'none'
  deepWorkDays: string[]
  projectBalance: number
  theoryBalance: number
  interviewBalance: number
  theme: 'light' | 'dark' | 'system'
  quietHoursStart: string
  quietHoursEnd: string
  reminderCategories: Record<string, boolean>
  trackAllocation: {
    project: number
    theory: number
    practice: number
    mlops: number
    interview: number
  }
}

export interface SkillAssessment {
  skill: SkillKey
  score: number
  evidenceIds: string[]
  notes: string
  updatedAt: string
}

export interface Phase extends Timestamps {
  id: string
  number: 1 | 2 | 3
  title: string
  projectId: string
  description: string
  gateCriteria: string[]
}

export interface Week extends Timestamps {
  id: string
  number: number
  title: string
  phaseId: string
  objective: string
  plannedHours: number
  theoryTopics: string[]
  projectDeliverables: string[]
  pytorchExercise: string
  dsaTarget: string
  sqlTarget: string
  interviewTopics: string[]
  systemDesignExercise: string
  evidenceRequired: string[]
  exitCriterion: string
  commonMistakes: string[]
  weekendCheckpoint: string
  recommendedResources: string[]
  status: Status
}

export interface Task extends Timestamps {
  id: string
  weekNumber: number
  title: string
  description: string
  track: Track
  type: TaskType
  projectId?: string
  estimatedMinutes: number
  actualMinutes: number
  difficulty: Difficulty
  status: Status
  prerequisites: string[]
  completionCriteria: string
  deliverable?: string
  commonMistake?: string
  relatedResources: string[]
  interviewConcepts: string[]
  notes: string
  evidenceIds: string[]
  scheduledDate?: string
  completedAt?: string
  parentTaskId?: string
  order: number
  deferred?: boolean
  deferredReason?: string
}

export interface StudySession extends Timestamps {
  id: string
  taskId?: string
  durationMinutes: number
  plannedDuration: 25 | 50 | 90
  notes: string
  startedAt: string
  endedAt?: string
  status: 'active' | 'paused' | 'completed' | 'abandoned'
}

export interface Project extends Timestamps {
  id: string
  slug: string
  name: string
  problem: string
  users: string
  baseline: string
  mainModel: string
  metrics: string[]
  latencyTarget: string
  deployment: string
  monitoring: string[]
  security: string[]
  stretchGoals: string[]
  status: Status
  currentMilestone: string
  completionScore: number
  phaseNumber: 1 | 2 | 3
  optional?: boolean
}

export interface ProductionCapability {
  id: string
  key: string
  label: string
  description: string
}

export interface ProjectCapabilityStatus extends Timestamps {
  id: string
  projectId: string
  capabilityId: string
  requirement: CapabilityRequirement
  status: Status
  notes: string
  evidenceIds: string[]
  completedAt?: string
  reviewerFeedback: string
}

export interface LearningModule extends Timestamps {
  id: string
  slug: string
  title: string
  objective: string
  explanation: string
  keyConcepts: string[]
  practicalExercise: string
  projectConnection: string
  misconceptions: string[]
  interviewQuestions: string[]
  resourceIds: string[]
  completed: boolean
  confidence: number
  notes: string
}

export interface PracticeQuestion extends Timestamps {
  id: string
  track: string
  title: string
  prompt: string
  difficulty: Difficulty
  topic: string
  weekNumber?: number
  hint: string
  rubric: string
  tags: string[]
}

export interface PracticeAttempt extends Timestamps {
  id: string
  questionId: string
  answer: string
  selfRating: number
  confidence: number
  markedForRevision: boolean
  timeSpentSeconds: number
  revealedHint: boolean
  revealedRubric: boolean
  notes: string
}

export interface MockInterview extends Timestamps {
  id: string
  title: string
  category: string
  formatMinutes: 30 | 45 | 60 | 75
  scheduledAt?: string
  status: Status
  mode: 'timed' | 'written' | 'outline'
  notes: string
  scores: {
    clarity: number
    correctness: number
    structure: number
    depth: number
    confidence: number
  }
  strengths: string
  gaps: string
  retryItems: string[]
}

export interface ProjectDefense extends Timestamps {
  id: string
  projectId: string
  thirtySecond: Record<string, string>
  twoMinute: Record<string, string>
  fiveMinute: Record<string, string>
}

export interface SystemDesignExercise extends Timestamps {
  id: string
  title: string
  prompt: string
  constraints: string[]
  rubric: string[]
}

export interface SystemDesignResponse extends Timestamps {
  id: string
  exerciseId: string
  sections: Record<string, string>
  mermaidDiagram: string
  checklist: Record<string, boolean>
  timerSeconds: number
  version: number
  notes: string
}

export interface ReadingAssignment extends Timestamps {
  id: string
  weekNumber: number
  chapter: string
  focus: string
  plannedSections: string
  timeEstimateMinutes: number
  status: Status
  notes: string
  summary: string
  interviewQuestions: string[]
  projectLinks: string[]
  relatedExperiment: string
  difficultConcepts: string[]
  confidence: number
}

export interface Resource extends Timestamps {
  id: string
  title: string
  url: string
  category: string
  description: string
  official: boolean
}

export interface EvidenceItem extends Timestamps {
  id: string
  title: string
  type: EvidenceType
  weekNumber?: number
  projectId?: string
  url?: string
  description: string
  date: string
  verificationStatus: 'unverified' | 'verified' | 'needs_review'
  skillsDemonstrated: SkillKey[]
  interviewTalkingPoints: string[]
  visibility: Visibility
  notes: string
  metricPlaceholder?: string
  taskIds: string[]
}

export interface JobApplication extends Timestamps {
  id: string
  company: string
  roleTitle: string
  jobUrl: string
  location: string
  remoteStatus: 'remote' | 'hybrid' | 'onsite' | 'unspecified'
  source: string
  dateDiscovered: string
  dateApplied?: string
  status: ApplicationStatus
  resumeVersion: string
  referralContact: string
  recruiter: string
  skillMatchPercent: number
  missingRequirements: string
  salaryRange: string
  interviewStages: string[]
  followUpDate?: string
  notes: string
  outcome: string
}

export interface NotificationItem extends Timestamps {
  id: string
  category: string
  title: string
  body: string
  read: boolean
  snoozedUntil?: string
  href?: string
}

export interface WeeklyReview extends Timestamps {
  id: string
  weekNumber: number
  completed: string
  evidenceCreated: string
  learned: string
  failed: string
  blocked: string
  metricChanged: string
  tookLonger: string
  weakInterviewTopic: string
  carryOver: string
  workloadRealistic: boolean
  markdownReport: string
  completionPercent: number
  plannedHours: number
  actualHours: number
  riskLevel: 'low' | 'moderate' | 'high'
}

export interface Reflection extends Timestamps {
  id: string
  date: string
  completedWork: string
  hoursLogged: number
  evidenceCreated: string
  blockers: string
  reflection: string
  tomorrowFirstTask: string
}

export interface AppMeta {
  version: string
  currentWeek: number
  streak: number
  lastStudyDate?: string
  planGeneratedAt?: string
  deferredItems: string[]
}

export interface AppState {
  meta: AppMeta
  profile: UserProfile | null
  preferences: Preferences | null
  skillAssessments: SkillAssessment[]
  phases: Phase[]
  weeks: Week[]
  tasks: Task[]
  studySessions: StudySession[]
  projects: Project[]
  capabilities: ProductionCapability[]
  projectCapabilities: ProjectCapabilityStatus[]
  learningModules: LearningModule[]
  questions: PracticeQuestion[]
  practiceAttempts: PracticeAttempt[]
  mockInterviews: MockInterview[]
  projectDefenses: ProjectDefense[]
  systemDesignExercises: SystemDesignExercise[]
  systemDesignResponses: SystemDesignResponse[]
  readingAssignments: ReadingAssignment[]
  resources: Resource[]
  evidence: EvidenceItem[]
  applications: JobApplication[]
  notifications: NotificationItem[]
  weeklyReviews: WeeklyReview[]
  reflections: Reflection[]
}

export const SKILL_LABELS: Record<SkillKey, string> = {
  python: 'Python',
  dsa: 'DSA',
  sql: 'SQL',
  mathematics: 'Mathematics',
  classical_ml: 'Classical ML',
  deep_learning: 'Deep Learning',
  pytorch: 'PyTorch',
  specialization: 'Specialization',
  mlops: 'MLOps',
  deployment: 'Deployment',
  testing: 'Testing',
  ml_system_design: 'ML System Design',
  communication: 'Communication',
  project_depth: 'Project Depth',
}

export const STATUS_LABELS: Record<Status, string> = {
  not_started: 'Not started',
  planned: 'Planned',
  in_progress: 'In progress',
  blocked: 'Blocked',
  completed: 'Completed',
  skipped: 'Skipped',
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  researching: 'Researching',
  networking: 'Networking',
  referral_requested: 'Referral requested',
  applied: 'Applied',
  recruiter_screen: 'Recruiter screen',
  technical_screen: 'Technical screen',
  system_design: 'System design',
  hiring_manager: 'Hiring manager',
  final_round: 'Final round',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}
