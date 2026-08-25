from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ProfileInput(BaseModel):
    currentRole: str
    yearsExperience: int = 0
    targetRoles: list[str] = Field(default_factory=list)
    existingMlExperience: str = ""
    preferredSpecialization: str = "Hybrid CV + NLP/LLM"
    primaryCloud: str = "Azure"
    modelFramework: str = "PyTorch"
    experimentTracking: str = "MLflow"
    cicd: str = "GitHub Actions"
    serving: str = "FastAPI"
    targetMarket: str = ""
    startDate: str = ""


class PreferencesInput(BaseModel):
    weeklyHours: float = 13
    availabilityTier: str = "standard"
    weekdayAvailability: list[str] = Field(default_factory=list)
    weekendAvailability: bool = True
    preferredSessionLength: int = 50
    reminderPreference: str = "daily"
    deepWorkDays: list[str] = Field(default_factory=list)
    projectBalance: float = 45
    theoryBalance: float = 25
    interviewBalance: float = 15
    theme: str = "system"
    quietHoursStart: str = "22:00"
    quietHoursEnd: str = "07:00"
    reminderCategories: dict[str, bool] = Field(default_factory=dict)
    trackAllocation: dict[str, float] = Field(default_factory=dict)


class SkillScoreInput(BaseModel):
    skill: str
    score: float


class DiagnosticAnswer(BaseModel):
    questionId: str
    selectedOptionId: str


class DiagnoseRequest(BaseModel):
    profile: ProfileInput
    preferences: PreferencesInput
    answers: list[DiagnosticAnswer] | None = None
    skills: list[SkillScoreInput] | None = None


class CalibratedSkill(BaseModel):
    skill: str
    proficiency: float
    confidence: float
    evidence: list[str] = Field(default_factory=list)
    lastUpdated: str


class DiagnoseResponse(BaseModel):
    skills: list[CalibratedSkill]
    needsReprobe: list[str] = Field(default_factory=list)


class SkillGap(BaseModel):
    skill: str
    current: float
    target: float
    gap: float
    priority: float


class PlanTask(BaseModel):
    id: str
    title: str
    description: str
    track: str
    type: str
    estimatedMinutes: int
    difficulty: str
    moduleId: str | None = None
    order: int = 0


class PlanWeek(BaseModel):
    number: int
    title: str
    objective: str
    plannedHours: float
    moduleIds: list[str]
    tasks: list[PlanTask]


class ProjectRec(BaseModel):
    id: str
    title: str
    complexity: str
    specialization: str


class RecommendedPlan(BaseModel):
    weeks: list[PlanWeek]
    totalWeeks: int
    estimatedHours: float
    projects: list[ProjectRec]
    deferredTopics: list[str] = Field(default_factory=list)
    revisionWeeks: list[int] = Field(default_factory=list)
    rationale: list[str] = Field(default_factory=list)
    checkpoints: list[str] = Field(default_factory=list)
    adaptationMetadata: dict[str, Any] = Field(default_factory=dict)
    estimatedCompletionDate: str


class RecommendRequest(BaseModel):
    profile: ProfileInput
    preferences: PreferencesInput
    skills: list[CalibratedSkill]
    completedModuleIds: list[str] = Field(default_factory=list)


class RecommendResponse(BaseModel):
    skills: list[CalibratedSkill]
    gaps: list[SkillGap]
    plan: RecommendedPlan
