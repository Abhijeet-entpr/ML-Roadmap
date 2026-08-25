from __future__ import annotations

from datetime import datetime, timezone

from app.catalog import load_diagnostic_banks
from app.models import (
    CalibratedSkill,
    DiagnoseRequest,
    DiagnoseResponse,
    SkillScoreInput,
)

ALL_SKILLS = [
    "python",
    "dsa",
    "sql",
    "mathematics",
    "classical_ml",
    "deep_learning",
    "pytorch",
    "specialization",
    "mlops",
    "deployment",
    "testing",
    "ml_system_design",
    "communication",
    "project_depth",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def score_from_sliders(skills: list[SkillScoreInput]) -> list[CalibratedSkill]:
    by_skill = {s.skill: s.score for s in skills}
    result: list[CalibratedSkill] = []
    for skill in ALL_SKILLS:
        raw = float(by_skill.get(skill, 2))
        proficiency = max(0.0, min(5.0, raw))
        # Slider self-report is low confidence by design
        confidence = 0.45 if skill in by_skill else 0.3
        result.append(
            CalibratedSkill(
                skill=skill,
                proficiency=proficiency,
                confidence=confidence,
                evidence=["self_report_slider"] if skill in by_skill else [],
                lastUpdated=_now(),
            )
        )
    return result


def score_from_answers(request: DiagnoseRequest) -> list[CalibratedSkill]:
    banks = load_diagnostic_banks()
    questions = {q["id"]: q for cluster in banks.get("clusters", []) for q in cluster.get("questions", [])}

    totals: dict[str, list[float]] = {s: [] for s in ALL_SKILLS}
    answered_skills: set[str] = set()

    for answer in request.answers or []:
        q = questions.get(answer.questionId)
        if not q:
            continue
        skill = q["skill"]
        option = next((o for o in q.get("options", []) if o["id"] == answer.selectedOptionId), None)
        if not option:
            continue
        totals.setdefault(skill, []).append(float(option.get("score", 0)))
        answered_skills.add(skill)

    # Seed from optional sliders for unanswered skills
    slider_map = {s.skill: s.score for s in request.skills or []}

    # Years of experience soft prior
    years = request.profile.yearsExperience
    year_boost = min(1.0, years / 8.0)

    result: list[CalibratedSkill] = []
    for skill in ALL_SKILLS:
        scores = totals.get(skill) or []
        if scores:
            proficiency = sum(scores) / len(scores)
            confidence = min(0.95, 0.55 + 0.1 * len(scores))
            evidence = ["diagnostic_quiz"]
        elif skill in slider_map:
            proficiency = float(slider_map[skill])
            confidence = 0.45
            evidence = ["self_report_slider"]
        else:
            proficiency = 1.5 + year_boost
            confidence = 0.25
            evidence = ["experience_prior"]

        # Soft prior from years for foundations
        if skill in {"python", "sql", "dsa"} and years >= 3:
            proficiency = max(proficiency, min(4.0, 2.0 + year_boost))

        result.append(
            CalibratedSkill(
                skill=skill,
                proficiency=round(max(0.0, min(5.0, proficiency)), 2),
                confidence=round(confidence, 2),
                evidence=evidence,
                lastUpdated=_now(),
            )
        )
    return result


def diagnose(request: DiagnoseRequest) -> DiagnoseResponse:
    if request.answers:
        skills = score_from_answers(request)
    elif request.skills:
        skills = score_from_sliders(request.skills)
    else:
        skills = score_from_sliders([SkillScoreInput(skill=s, score=2) for s in ALL_SKILLS])

    needs_reprobe = [s.skill for s in skills if s.confidence < 0.4]
    return DiagnoseResponse(skills=skills, needsReprobe=needs_reprobe)
