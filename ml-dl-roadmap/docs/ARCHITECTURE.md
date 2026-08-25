# Architecture overview

## Goals

ML Engineer Launchpad is a local-first learning OS. The signed-in workspace (after onboarding) is the product. Persistence defaults to the browser so the project can be zipped and shared without cloud setup.

## Layers

1. **UI** — React pages + layout shell + shadcn-style primitives
2. **State** — `AppProvider` owns domain state and mutation helpers
3. **Rules** — pure functions for progress, exit gates, readiness, schedule adaptation, insights
4. **Persistence** — `DataRepository` interface with `LocalStorageRepository` (default) and `SupabaseRepository` scaffold
5. **Seed** — deterministic curriculum, projects, practice, reading plan

## Routing

Public: `/`, `/onboarding`  
Authenticated shell: all other routes behind `RequireOnboarding` + `AppShell`

## Personalization

Onboarding captures profile, weekly hours, baseline skills, and preferences. If weekly hours ≤ 6, `adaptScheduleForHours` defers Project 1 stretch work and capstone hardening while preserving Month capability gates in the UI.

## Evidence and honesty

Skill scores ≥ 4 require linked evidence. Metrics use explicit placeholders (“Enter measured value”). Portfolio language stays production-style, never claiming real production traffic or prior ML employment.

## Extending to Supabase

1. Apply `supabase/schema.sql`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Expand `SupabaseRepository` to sync `app_state` JSON (or normalize tables later)
