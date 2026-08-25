from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.engines.recommend import recommend
from app.engines.scoring import diagnose
from app.catalog import load_diagnostic_banks
from app.models import (
    DiagnoseRequest,
    DiagnoseResponse,
    RecommendRequest,
    RecommendResponse,
)

app = FastAPI(
    title="ML Roadmap Intelligence",
    description="Diagnostic scoring, skill gap analysis, and adaptive plan recommendation",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "minWeeks": settings.min_weeks,
        "maxWeeks": settings.max_weeks,
    }


@app.get("/v1/diagnostics/banks")
def diagnostic_banks():
    return load_diagnostic_banks()


@app.post("/v1/diagnose", response_model=DiagnoseResponse)
def diagnose_endpoint(body: DiagnoseRequest):
    return diagnose(body)


@app.post("/v1/plans/recommend", response_model=RecommendResponse)
def recommend_endpoint(body: RecommendRequest):
    return recommend(body)


@app.post("/v1/plans/adapt", response_model=RecommendResponse)
def adapt_endpoint(body: RecommendRequest):
    # MVP: same pipeline with completedModuleIds honored for skips
    return recommend(body)
