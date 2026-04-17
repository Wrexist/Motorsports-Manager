# iOS App Store roadmap (phased) — Pit Lane Manager

This roadmap turns “ship to iOS” into a sequence of **review-safe milestones**. It is aligned to:
- `CLAUDE.md` (engineering + legal invariants)
- `docs/agents/pit-lane-manager-prompt-library.md` (default implementation sequence)
- `docs/agents/stack-decisions.md` (optional Apex GP ideas)

## What “100% iOS App Store complete” means here

### v1.0 (first App Store approval)
A **reviewable** build with a **complete MVP loop** (not the entire multi-year feature bible):
- Cold start is stable (hydration gate respected).
- Core loop is completable without cheats/debug tools.
- Save/load works on device.
- Legal constraints satisfied in-game + in metadata.
- Privacy manifest + Info.plist usage strings match reality.
- If monetization is enabled: IAP works in sandbox + Restore Purchases + correct subscription disclosures.

### v1.1+ (post-approval expansion)
Everything else is **versioned** (1.1, 1.2, …) so you don’t block shipping v1.0.

## Phase A — Foundation (engineering spine)
**Deliverables**
- Vite + React + TS + Tailwind build pipeline green on CI/local.
- Capacitor config matches product IDs/names (`capacitor.config.ts`).
- Baseline lint/test harness.

**Exit**
- `npm run test` green; `npm run build` green.

## Phase B — Deterministic simulation spine
**Deliverables**
- `src/sim/*` pure functions + seeded RNG.
- Unit tests proving determinism for the same seed + inputs.

**Exit**
- Sim tests stable; no `Math.random` in sim/gameplay code paths (ESLint enforced).

## Phase C — Vertical slice: season loop (MVP “game”)
**Deliverables**
- Zustand `useGameStore` with `CLAUDE.md` middleware order + persist + hydration gate.
- Minimal UI: Continue → Race → Results → next event.
- Championship + finance updates minimally correct (enough to feel “real”).

**Exit**
- Internal playthrough: complete all races in the MVP calendar on device.

## Phase D — Content canon + validation pipeline
**Deliverables**
- Fictional teams/drivers/circuits/sponsors as data files.
- Runtime validation (Zod) for content loads (add when content pipeline exists).

**Exit**
- Automated scan: no prohibited trademark strings in packaged strings (scripted check, add when repo grows).

**Status (repo)**
- Circuits + title sponsors load from `src/data/canon/*.json` via `loadCanon()` (Zod). Seed save composes drivers/teams/races in TS; extend JSON gradually for drivers/teams when migrations are ready.

## Phase E — Monetization (optional for v1.0)
**Default recommendation**: ship v1.0 without IAP to reduce review risk, then add RevenueCat.

**If shipping IAP**
- RevenueCat SDK + offerings + entitlement checks.
- Restore purchases + reviewer notes + sandbox walkthrough.

**Exit**
- Sandbox purchase + restore verified on device.

## Phase F — iOS compliance hardening (rejection avoidance)
**Deliverables**
- `PrivacyInfo.xcprivacy` accurate for required-reason APIs you use.
- Privacy policy URL live.
- Only real Info.plist permission strings.

**Exit**
- `docs/release/ios-compliance-checklist.md` completed with evidence links/screenshots.

## Phase G — QA + performance + crash reporting
**Deliverables**
- Device matrix notes (small phone / large phone / tablet if supported).
- Performance traces for race UI budgets.
- Crash reporting (optional but strongly recommended for launch).

**Exit**
- Crash-free target met for “happy path” sessions.

## Phase H — App Store Connect packaging
**Deliverables**
- Screenshots + description + keywords compliant with `docs/legal/naming-disclaimer.md`.
- Review notes + reproducible steps.

**Exit**
- App Store Connect shows **Ready to Submit** without blocking warnings.

## Phase I — Post-launch expansion (not a v1.0 blocker)
Use `docs/release/postlaunch-milestones.md` to sequence v1.1+ features (more series tiers, deeper race weekend, narrative systems, multiplayer, cloud saves, etc.).
