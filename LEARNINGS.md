# Learnings

Append-only notes on non-obvious decisions, gotchas, and reversals discovered during implementation.

## 2026-04-17 — Repo initialization state
- Initial state was research PDFs + git metadata; the runnable app now lives under `src/` (Vite + React + Capacitor + Zustand). Prompt library in `docs/agents/pit-lane-manager-prompt-library.md` remains the deeper feature spec.
- `CLAUDE.md` is treated as the default “law” for constraints when documents conflict.

## 2026-04-17 — Key non-negotiables (baseline)
- Legal: no real F1 trademarks or real circuit/driver/team identity stacking.
- Save stability: hydration gate before rendering persisted state.
- Simulation: pure functions + seeded RNG for determinism and replayability.

## 2026-04-17 — Windows npm install flakiness
- `npm install` can fail mid-extract with `ENOTEMPTY` if `node_modules` is partially written.
- Fix: delete `node_modules` and run `npm ci` (lockfile-driven) for a clean deterministic install.

## 2026-04-17 — ESLint guardrail: ban Math.random
- Added `no-restricted-properties` for `Math.random` to prevent accidental nondeterminism in gameplay/sim/store code.
- ID generation should use `crypto.randomUUID()` when available (still not gameplay RNG; saves/tests need stable strategies separately).

## 2026-04-17 — Fork vs greenfield (program decision)
- **Greenfield** was chosen for this repo: there is no Dynasty Manager application tree in the workspace, only research and agent prompts, so a fork would be fictional overhead.
- The implementation **matches the intended stack** from `CLAUDE.md` / the prompt library (Vite, React 18, TS, Tailwind v4, shadcn-style primitives, Zustand + immer + persist + devtools, Capacitor 7) so Prompts 2 onward apply without football cleanup steps.
- If a private Dynasty codebase becomes available later, selective porting (e.g. native plugins or proven Capacitor patterns) can be done as a migration, not a restart.

## 2026-04-17 — Persisted shape
- Zustand `persist` uses a custom async `PersistStorage` backed by `@capacitor/preferences`; `partialize` persists only `{ save: SaveGame }`. `nextInterrupt` is recomputed on `onFinishHydration`.
- Save schema version is `SaveGame.version` (seed bumped to **2**) with optional `onboardingCompleted`; persist middleware `version` is **2** with a small `migrate` guard for older blobs.

