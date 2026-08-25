from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from app.catalog import load_modules, load_projects, load_role_targets
from app.config import settings
from app.models import (
    CalibratedSkill,
    PlanTask,
    PlanWeek,
    ProjectRec,
    RecommendRequest,
    RecommendResponse,
    RecommendedPlan,
    SkillGap,
)


def _resolve_role(target_roles: list[str]) -> str:
    targets = load_role_targets()
    for role in target_roles:
        key = role.strip()
        if key in targets:
            return key
        # fuzzy contains
        for known in targets:
            if known.lower() in key.lower() or key.lower() in known.lower():
                return known
    return "ML Engineer"


def analyze_gaps(skills: list[CalibratedSkill], target_role: str) -> list[SkillGap]:
    targets = load_role_targets()[target_role]
    skill_map = {s.skill: s for s in skills}
    gaps: list[SkillGap] = []
    for skill, target in targets.items():
        current = skill_map.get(skill).proficiency if skill in skill_map else 0.0
        gap = max(0.0, float(target) - float(current))
        if gap <= 0:
            continue
        # Priority: gap size * role weight (target itself) * low-confidence boost
        confidence = skill_map.get(skill).confidence if skill in skill_map else 0.3
        priority = gap * float(target) * (1.2 if confidence < 0.5 else 1.0)
        gaps.append(
            SkillGap(
                skill=skill,
                current=round(current, 2),
                target=float(target),
                gap=round(gap, 2),
                priority=round(priority, 2),
            )
        )
    gaps.sort(key=lambda g: g.priority, reverse=True)
    return gaps


def _matches_specialization(module: dict[str, Any], specialization: str) -> bool:
    tags = module.get("specializationTags") or ["hybrid"]
    spec = specialization.lower()
    if "hybrid" in tags:
        return True
    if "cv" in spec or "vision" in spec:
        return "cv" in tags or "hybrid" in tags
    if "nlp" in spec or "llm" in spec or "language" in spec:
        return "nlp" in tags or "hybrid" in tags
    return True


def select_modules(
    skills: list[CalibratedSkill],
    gaps: list[SkillGap],
    specialization: str,
    completed: set[str],
) -> tuple[list[dict[str, Any]], list[str], list[str]]:
    """Returns (selected_modules, deferred_topics, rationale)."""
    modules = load_modules()
    skill_map = {s.skill: s.proficiency for s in skills}
    gap_skills = {g.skill for g in gaps}

    selected: list[dict[str, Any]] = []
    deferred: list[str] = []
    rationale: list[str] = []

    # Topological-ish: sort by prereq depth then priority of covered gaps
    def prereq_depth(mod: dict[str, Any], seen: set[str] | None = None) -> int:
        seen = seen or set()
        if mod["id"] in seen:
            return 0
        seen.add(mod["id"])
        prereqs = mod.get("prereqModuleIds") or []
        if not prereqs:
            return 0
        by_id = {m["id"]: m for m in modules}
        return 1 + max((prereq_depth(by_id[p], seen) for p in prereqs if p in by_id), default=0)

    ordered = sorted(modules, key=lambda m: (prereq_depth(m), m["id"]))

    for mod in ordered:
        if mod["id"] in completed:
            rationale.append(f"Skipped {mod['title']} because it is already completed.")
            continue
        if not _matches_specialization(mod, specialization):
            deferred.append(mod["title"])
            rationale.append(
                f"Deferred {mod['title']} because it does not match specialization '{specialization}'."
            )
            continue

        tags = set(mod.get("skillTags") or [])
        skip_rules: dict[str, float] = mod.get("skipIfSkillGte") or {}
        compress_rules: dict[str, float] = mod.get("compressIfSkillGte") or {}

        # Skip if all skip thresholds met
        if skip_rules and all(skill_map.get(k, 0) >= v for k, v in skip_rules.items()):
            rationale.append(
                f"Skipped {mod['title']} because proficiency already meets skip threshold."
            )
            continue

        # Include if covers a gap OR is foundational prereq for a selected later module
        covers_gap = bool(tags & gap_skills)
        is_foundation = mod.get("alwaysInclude", False)

        if not covers_gap and not is_foundation:
            # Keep if any skill tag is below 3 (general readiness)
            if not any(skill_map.get(t, 0) < 3 for t in tags):
                continue

        chosen = dict(mod)
        if compress_rules and all(skill_map.get(k, 0) >= v for k, v in compress_rules.items()):
            chosen["estimatedHours"] = max(2, round(float(mod["estimatedHours"]) * 0.5, 1))
            chosen["compressed"] = True
            rationale.append(f"Compressed {mod['title']} due to partial mastery.")
        else:
            # Expand weak areas
            weak = [t for t in tags if skill_map.get(t, 0) < 2]
            if weak:
                chosen["estimatedHours"] = round(float(mod["estimatedHours"]) * 1.25, 1)
                chosen["expanded"] = True
                rationale.append(
                    f"Expanded {mod['title']} due to low diagnostic score in {', '.join(weak)}."
                )

        selected.append(chosen)

    # Ensure prereqs are present
    by_id = {m["id"]: m for m in modules}
    selected_ids = {m["id"] for m in selected}
    for mod in list(selected):
        for prereq in mod.get("prereqModuleIds") or []:
            if prereq not in selected_ids and prereq in by_id:
                if prereq in completed:
                    continue
                p = by_id[prereq]
                # skip if mastered
                skip_rules = p.get("skipIfSkillGte") or {}
                if skip_rules and all(skill_map.get(k, 0) >= v for k, v in skip_rules.items()):
                    continue
                selected.append(p)
                selected_ids.add(prereq)
                rationale.append(f"Added prerequisite {p['title']} for {mod['title']}.")

    # Re-sort by dependency depth
    selected = sorted(selected, key=lambda m: (prereq_depth(m), m["id"]))
    # Dedupe preserving order
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for m in selected:
        if m["id"] in seen:
            continue
        seen.add(m["id"])
        unique.append(m)

    return unique, deferred, rationale


def pack_weeks(
    modules: list[dict[str, Any]],
    weekly_hours: float,
    rationale: list[str],
) -> tuple[list[PlanWeek], list[str], list[int], float]:
    """Pack modules into weeks clamped to [min_weeks, max_weeks]."""
    hours = max(4.0, float(weekly_hours))
    total_hours = sum(float(m["estimatedHours"]) for m in modules)
    # Buffer ~15% for revision/assessments
    total_with_buffer = total_hours * 1.15
    raw_weeks = max(1, int(round(total_with_buffer / hours)))
    target_weeks = max(settings.min_weeks, min(settings.max_weeks, raw_weeks))

    deferred_extra: list[str] = []
    working = list(modules)

    # If still over capacity at max weeks, defer lowest-priority (last) modules
    capacity = target_weeks * hours
    while working and sum(float(m["estimatedHours"]) for m in working) * 1.15 > capacity and target_weeks >= settings.max_weeks:
        dropped = working.pop()
        deferred_extra.append(dropped["title"])
        rationale.append(
            f"Deferred {dropped['title']} because capacity exceeds the {settings.max_weeks}-week maximum."
        )

    # Recalculate if under-filled toward min weeks — stretch with revision
    weeks: list[PlanWeek] = []
    current_modules: list[dict[str, Any]] = []
    current_hours = 0.0
    week_num = 1
    task_counter = 0

    def flush(force_title: str | None = None) -> None:
        nonlocal week_num, current_modules, current_hours, task_counter
        if not current_modules:
            return
        tasks: list[PlanTask] = []
        for mod in current_modules:
            task_counter += 1
            minutes = int(float(mod["estimatedHours"]) * 60)
            tasks.append(
                PlanTask(
                    id=f"task-{task_counter}",
                    title=mod["title"],
                    description=mod.get("objective") or mod.get("title", ""),
                    track=mod.get("track", "theory"),
                    type=mod.get("taskType", "learn"),
                    estimatedMinutes=minutes,
                    difficulty=mod.get("difficulty", "medium"),
                    moduleId=mod["id"],
                    order=task_counter,
                )
            )
        title = force_title or current_modules[0]["title"]
        weeks.append(
            PlanWeek(
                number=week_num,
                title=f"Week {week_num}: {title}",
                objective="; ".join(m.get("objective") or m["title"] for m in current_modules[:2]),
                plannedHours=round(current_hours, 1),
                moduleIds=[m["id"] for m in current_modules],
                tasks=tasks,
            )
        )
        week_num += 1
        current_modules = []
        current_hours = 0.0

    for mod in working:
        est = float(mod["estimatedHours"])
        if current_modules and current_hours + est > hours and week_num < target_weeks:
            flush()
        if week_num > target_weeks:
            deferred_extra.append(mod["title"])
            rationale.append(f"Deferred {mod['title']} after reaching {target_weeks} weeks.")
            continue
        current_modules.append(mod)
        current_hours += est
        if current_hours >= hours * 0.9 and week_num < target_weeks:
            flush()

    flush()

    # Pad to min weeks with revision if needed
    revision_weeks: list[int] = []
    while len(weeks) < settings.min_weeks:
        n = len(weeks) + 1
        weeks.append(
            PlanWeek(
                number=n,
                title=f"Week {n}: Revision & practice",
                objective="Consolidate weak areas and complete practice assessments.",
                plannedHours=hours,
                moduleIds=[],
                tasks=[
                    PlanTask(
                        id=f"task-rev-{n}",
                        title="Revision and practice",
                        description="Review notes, redo labs, and close skill gaps.",
                        track="practice",
                        type="practice",
                        estimatedMinutes=int(hours * 60),
                        difficulty="medium",
                        order=n,
                    )
                ],
            )
        )
        revision_weeks.append(n)
        rationale.append(f"Added revision week {n} to meet the {settings.min_weeks}-week minimum.")

    # Inject a mid-plan revision if confidence-driven expansions happened
    if any("Expanded" in r for r in rationale) and len(weeks) < settings.max_weeks:
        mid = max(2, len(weeks) // 2)
        if mid not in revision_weeks:
            revision_weeks.append(mid)
            rationale.append(
                f"Scheduled checkpoint revision around week {mid} due to expanded weak areas."
            )

    estimated_hours = round(sum(w.plannedHours for w in weeks), 1)
    return weeks, deferred_extra, revision_weeks, estimated_hours


def recommend_projects(
    specialization: str,
    skills: list[CalibratedSkill],
    total_weeks: int,
) -> list[ProjectRec]:
    projects = load_projects()
    avg = sum(s.proficiency for s in skills) / max(1, len(skills))
    selected: list[ProjectRec] = []
    for p in projects:
        min_level = float(p.get("minProficiency", 0))
        max_level = float(p.get("maxProficiency", 5))
        if not (min_level <= avg <= max_level + 1):
            continue
        if not _matches_specialization(p, specialization) and "hybrid" not in (p.get("specializationTags") or []):
            continue
        selected.append(
            ProjectRec(
                id=p["id"],
                title=p["title"],
                complexity=p.get("complexity", "medium"),
                specialization=p.get("specialization", specialization),
            )
        )
        if len(selected) >= (3 if total_weeks >= 12 else 2):
            break
    if not selected and projects:
        p = projects[0]
        selected.append(
            ProjectRec(
                id=p["id"],
                title=p["title"],
                complexity=p.get("complexity", "medium"),
                specialization=p.get("specialization", specialization),
            )
        )
    return selected


def recommend(request: RecommendRequest) -> RecommendResponse:
    role = _resolve_role(request.profile.targetRoles)
    gaps = analyze_gaps(request.skills, role)
    completed = set(request.completedModuleIds)

    modules, deferred, rationale = select_modules(
        request.skills,
        gaps,
        request.profile.preferredSpecialization,
        completed,
    )
    rationale.insert(0, f"Target role mapped to competency matrix: {role}.")
    rationale.append(f"Weekly capacity set to {request.preferences.weeklyHours} hours.")

    weeks, deferred_extra, revision_weeks, estimated_hours = pack_weeks(
        modules,
        request.preferences.weeklyHours,
        rationale,
    )
    deferred_topics = deferred + deferred_extra
    projects = recommend_projects(
        request.profile.preferredSpecialization,
        request.skills,
        len(weeks),
    )

    completion = date.today() + timedelta(weeks=len(weeks))
    checkpoints = [
        f"Week {w.number} exit: complete tasks for {w.title}"
        for w in weeks
        if w.number in {1, len(weeks) // 2, len(weeks)} or w.number in revision_weeks
    ]

    plan = RecommendedPlan(
        weeks=weeks,
        totalWeeks=len(weeks),
        estimatedHours=estimated_hours,
        projects=projects,
        deferredTopics=deferred_topics,
        revisionWeeks=sorted(set(revision_weeks)),
        rationale=rationale,
        checkpoints=checkpoints,
        adaptationMetadata={
            "role": role,
            "minWeeks": settings.min_weeks,
            "maxWeeks": settings.max_weeks,
            "moduleCount": len(modules),
        },
        estimatedCompletionDate=completion.isoformat(),
    )

    return RecommendResponse(skills=request.skills, gaps=gaps, plan=plan)
