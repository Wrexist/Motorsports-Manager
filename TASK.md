# v1.0 App Store release contract (scope lock)
This section defines what “done for iOS App Store v1.0” means for this repo.

## Product scope (v1.0)
- **Core loop**: start a season → advance time → arrive at a scheduled race → simulate race → update standings/finances → proceed through all scheduled races in the MVP calendar.
- **Persistence**: save/load works on device via Capacitor Preferences-backed Zustand persist (web dev uses the Preferences web implementation).
- **Determinism**: race simulation outcomes are repeatable for the same inputs/seed (unit-tested at the sim layer).
- **Legal**: all player-facing strings + store metadata obey `CLAUDE.md` (no prohibited trademark usage; fictional names only).

## Monetization scope (v1.0)
- **Default for v1.0**: ship **without IAP** first (fastest review path). Keep RevenueCat integration behind a feature flag / later milestone unless explicitly enabled.
- **If IAP is enabled before v1.0**: must include Restore Purchases, sandbox-verified purchases, and subscription disclosures per Apple Guidelines 3.1.x (see `docs/release/ios-compliance-checklist.md`).

## Engineering scope (v1.0)
- **Vertical slice implemented in code**: minimal UI + store wiring sufficient to complete the loop above (not the full breadth of Prompts 6–9 UI polish).
- **Performance**: race tick loop does not animate layout; motion usage follows `CLAUDE.md`.

# Current Task
## Goal
Ship v1.0 iOS App Store candidate: playable season loop + persistence + sim determinism + compliance checklist artifacts.

## Context
- Engineering law: `CLAUDE.md`
- Default build prompts: `docs/agents/pit-lane-manager-prompt-library.md`
- Optional advanced ideas: `docs/agents/apex-gp-advanced-track.md`
- iOS operational checklist: `docs/release/ios-compliance-checklist.md`
- Phased roadmap narrative: `docs/roadmap/ios-app-store-roadmap.md`

## Plan
- [ ] Finish store + UI vertical slice (continue → race → results → next race)
- [ ] Add sim determinism tests + ban `Math.random` via ESLint
- [ ] Fill iOS submission checklist + privacy manifest template once iOS project exists

## Blocked on
- **iOS native project generation** requires macOS/Xcode for `npx cap add ios` (Windows can still produce the web build + compliance docs).

## Session log
- 2026-04-17 00:00 — started
- 2026-04-17 — locked v1.0 scope contract at top of `TASK.md`

## Definition of done
- [ ] Tests green
- [ ] `npm run build` green
- [ ] `npx cap sync ios && npx cap sync android` green
- [ ] Manual test on simulator passed
- [ ] Committed with Conventional Commit message
- [ ] TASK.md reset for next session

# Backlog
Seeded from the “Pit Lane Manager” 8-week roadmap (Blueprint PDF).

- Greenfield app scaffolded (Vite + React + Capacitor + Zustand persist + sim + core screens).
- Fork Dynasty Manager and remove football-specific modules (Prompts 1–3 foundation).
- Implement pure-functional race sim engine and determinism tests (Prompt 4).
- Build live race UI and loop with performance constraints (Prompt 5).
- Implement car development module and wire progression (Prompt 6).
- Implement driver market and contract negotiation + scouting (Prompt 7).
- Implement finance dashboard + sponsor system + payouts (Prompt 8).
- Implement season calendar + standings + interrupts + continue flow (Prompt 9).
- Add onboarding, polish, and IAP integration (RevenueCat) + privacy manifest (Week 6).
- Soft launch plan execution (Week 7): region-limited, analytics/retention targets, fix top complaints.
- Global launch prep (Week 8): ASO assets, store checklists, rollout plan.

# Done (last 20)
- Forked from Dynasty Manager (placeholder)

