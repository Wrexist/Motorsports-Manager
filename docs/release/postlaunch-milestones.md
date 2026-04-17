# Post-launch milestones (v1.1+)

This is intentionally separate from v1.0 App Store approval. Ship v1.0 first; expand in **small, testable releases**.

## v1.1 — “More motorsport”
- Additional circuits + calendar variety
- Richer race weekend phases (practice/qualifying depth)
- More telemetry UI (intervals, charts)

## v1.2 — “Economy + contracts depth”
- Deeper sponsor goals + renewals
- More realistic contract negotiation flows
- Board pressure events expanded

## v1.3 — “Car development depth”
- Branching R&D (instead of linear MVP)
- Part inventory + factory queue polish
- Clear part-perk attribution UI (MM4 pain point)

## v1.4 — “Live ops hooks” (optional)
- Seasonal events (still legally safe naming)
- Cosmetic cadence (livery packs)

## v2.0 — “Advanced track” merge candidates (only with evidence)
Pull items from `docs/agents/apex-gp-advanced-track.md` **only** when:
- profiling proves the need (perf),
- persistence proves the need (large saves),
- design agrees on added complexity.

Each merge must update `CLAUDE.md` + save migrations + tests.

---

## Prompt library sequencing (implementation backlog)

After the v1.0 vertical slice ships, follow `docs/agents/pit-lane-manager-prompt-library.md` in order for depth work. Treat each prompt as a **separate release** with save version bumps + migration tests:

1. **Prompt 6** — Car development UI polish + weekly R&D rules aligned with `carDevSlice` / `CAR_DEV_CONSTANTS`.
2. **Prompt 7** — Driver market negotiation depth, scouting, silly season.
3. **Prompt 8** — Finance dashboard charts + sponsor slot grid + ledger UX.
4. **Prompt 9** — Full interrupt system, `advanceUntilInterrupt`, season rollover, board events.

Do not start the next prompt until the previous one meets its Definition of Done in the prompt library.
