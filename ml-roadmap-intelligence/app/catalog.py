from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.config import settings

ROOT = Path(__file__).resolve().parents[1]


def _load_json(relative: str) -> Any:
    path = ROOT / relative
    with path.open(encoding="utf-8") as f:
        return json.load(f)


@lru_cache
def load_modules() -> list[dict[str, Any]]:
    return _load_json(settings.catalog_path)


@lru_cache
def load_role_targets() -> dict[str, dict[str, float]]:
    return _load_json(settings.role_targets_path)


@lru_cache
def load_diagnostic_banks() -> dict[str, Any]:
    return _load_json(settings.diagnostics_path)


@lru_cache
def load_projects() -> list[dict[str, Any]]:
    return _load_json("data/catalog/projects.json")
