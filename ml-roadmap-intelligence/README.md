# ML Roadmap Intelligence

FastAPI service for diagnostic scoring, skill-gap analysis, and adaptive plan recommendation (6–24 weeks).

## Quick start (Docker)

```bash
docker build -t ml-roadmap-intelligence .
docker run --rm -p 8000:8000 ml-roadmap-intelligence
```

Or via compose from `ml-roadmap-api`:

```bash
cd ../ml-roadmap-api
docker compose up --build intelligence
```

## Local (when Python 3.12+ is available)

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/v1/diagnostics/banks` | Question banks |
| POST | `/v1/diagnose` | Score answers / sliders → calibrated skills |
| POST | `/v1/plans/recommend` | Full recommendation pipeline |
| POST | `/v1/plans/adapt` | Re-recommend with completed modules |

## Catalog

- `data/catalog/modules.json` — curriculum modules
- `data/catalog/role_targets.json` — competency matrices
- `data/catalog/projects.json` — project ladder
- `data/diagnostics/banks.json` — diagnostic clusters

Docs: http://localhost:8000/docs
