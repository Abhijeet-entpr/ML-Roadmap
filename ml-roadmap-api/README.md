# ML Roadmap Product API

Fastify + TypeScript product backend for the ML Engineer Launchpad.

## Responsibilities

- Onboarding orchestration
- User / profile storage (in-memory MVP)
- Learning plan CRUD
- Progress tracking
- Proxies diagnostic banks from the intelligence service

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Requires the intelligence service at `INTELLIGENCE_URL` (default `http://localhost:8000`).

## Docker (API + Intelligence)

From this directory:

```bash
docker compose up --build
```

- API: http://localhost:3001
- Docs: http://localhost:3001/docs
- Intelligence: http://localhost:8000

## Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API + intelligence health |
| GET | `/diagnostics/banks` | Diagnostic question banks |
| POST | `/onboarding/complete` | Diagnose → recommend → persist plan |
| GET | `/users/:userId` | Stored user |
| GET | `/users/:userId/plan` | Stored plan |
| PATCH | `/users/:userId/progress` | Progress update |

## Extensibility

Storage implements `UserRepository`, `PlanRepository`, and `CachePort` in `src/storage/ports.ts`. Swap `memory.ts` for Postgres/Redis adapters later without changing routes.
