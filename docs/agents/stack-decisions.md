# Stack decisions (Pit Lane default vs Apex GP advanced)

This repo intentionally contains **two research tracks** (two PDFs). They disagree on some implementation details.

## Default track (authoritative for day-to-day work)

**Source of truth**: `CLAUDE.md` + `docs/agents/pit-lane-manager-prompt-library.md`

### Defaults (locked unless explicitly changed)
- **Animation library**: `framer-motion` (matches Pit Lane prompt library + current dependencies).
- **Entity storage**: normalized `Record<Id, Entity>` maps on the persisted save (`SaveGame` in `src/types/game.ts`).
- **Zustand middleware order** (outermost → innermost): `devtools → persist → immer` (per `CLAUDE.md`).
- **Simulation**: pure modules under `src/sim/`, seeded RNG, **no `Math.random`** in gameplay/sim paths.
- **Persistence (MVP)**: Capacitor Preferences via Zustand `persist` adapter (`src/lib/storage.ts`).

## Advanced track (optional)

**Source**: `docs/agents/apex-gp-advanced-track.md` (from `Research Report.pdf`)

### Where it intentionally differs
- **Motion**: prefers `motion/react` + Motion 12 ecosystem conventions.
- **Store hot paths**: may recommend `Map<Id, Entity>` and bypassing Immer inside tick loops for perf.
- **Persistence**: may recommend Filesystem blob saves + Preferences metadata for large saves / WKWebView pressure scenarios.
- **RNG**: may recommend `sfc32` + stream splitting rather than `mulberry32`.

## How to adopt an advanced idea safely

1. Write the motivation + measured problem in `LEARNINGS.md` (append-only).
2. Update **one** canonical rule location:
   - If it changes global engineering law: update `CLAUDE.md`.
   - If it’s a product decision (MVP vs later): update the “release contract” section in `TASK.md`.
3. Implement with migrations + tests (save schema bumps are mandatory per `CLAUDE.md`).

## Decision log (initial)

- **2026-04-17**: Stay on **Pit Lane defaults** until there is a shipped vertical slice and profiling evidence that Map storage / filesystem saves / Motion migration is required.
