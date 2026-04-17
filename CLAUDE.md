# Pit Lane Manager — Claude Code Context

This repository currently contains **research PDFs only** plus git metadata. Until the actual codebase is created (via the prompt library), do **not** invent files/paths that don’t exist yet. If you need code, follow the prompt library in `docs/agents/pit-lane-manager-prompt-library.md` to generate it step-by-step.

## Project
Mobile unlicensed F1-style management sim built on React 18 + Vite + TypeScript + Tailwind v4 + shadcn/ui + Zustand + Framer Motion + Capacitor 7.

Product goals (MVP framing):
- Short, tactical race sessions (target ~3–5 minutes for “short” races).
- Depth without predatory monetization (no loot boxes, no pay-to-win).
- Stronger race AI and clearer race telemetry than incumbent mobile sims.

## Legal boundary
Non-negotiable constraints for all UI copy, data, and marketing assets:
- Never introduce **“F1”**, **“Formula 1”**, **“Formula One”**, **“FIA”**, or **“Grand Prix”** as brand elements.
- Real **countries/cities** are OK. Real **circuit names are not** (many are trademarked). Use fictional circuit names.
- Real **driver names are never OK**.
- Never match real teams by identity stacking (name + colors + codes + logos + implied nationality + stats).
- Never use real team three-letter codes (avoid: FER, MER, MCL, RBR, ALP, AST, WIL, ALF, HAA, SAU).
- Include a disclaimer in splash/store/credits: “Not affiliated with Formula 1, the FIA, or any real team or driver.”

See `docs/legal/naming-disclaimer.md` for checklist + disclaimer text.

## Architecture invariants
These rules are intended to prevent subtle save corruption, iOS review crashes, and performance regressions.

- **Single bound Zustand store**: one `useGameStore` combining slices.
  - Middleware applied at the combined-store level only.
  - Middleware order (outermost first): **devtools → persist → immer**.
  - Never create additional independent Zustand stores.

- **Hydration gate is mandatory**:
  - Do not render game content until `useGameStore.persist.hasHydrated()` is true (or a `useHydration()` hook returns true).
  - This prevents first-launch blank-screen crashes on iOS.

- **Typed domain boundaries**:
  - All entity IDs are **branded strings** (no raw string IDs).
  - All money is **integer cents** (branded `Money`). Convert to display only via a formatter.
  - All stats are **branded 0–100** (`Stat`). Use constructors like `makeStat()` at boundaries.

- **Normalized entity storage**:
  - Entities stored normalized as `Record<Id, Entity>` (or equivalent), no nested entity objects.
  - References between entities must be by ID only.

- **Deterministic simulation**:
  - `src/sim/` is pure-functional: no React, no Zustand, no side effects.
  - RNG must be seeded and passed in; never use `Math.random` in simulation or gameplay logic intended to be replayable.

- **Motion / performance constraints**:
  - Animate only `transform` + `opacity`. Never animate layout (`width/height/top/left`) in hot paths.
  - Wrap race UI in `LazyMotion` and respect `useReducedMotion`.
  - Never bind the sim tick loop directly to motion animation props; only push UI updates at lap boundaries.

## Folder structure
Once the codebase exists, it should broadly follow:
- `src/sim/` — deterministic simulation engine
- `src/stores/` — `useGameStore` + slices + selectors
- `src/components/game/` — game UI modules (race, finance, calendar, car dev, market, etc.)
- `src/data/` — fictional canon JSON and seed data

For the exact step-by-step generation flow, use `docs/agents/pit-lane-manager-prompt-library.md`.

## Commands
These commands are expected once the app scaffold exists (adjust to match `package.json`):
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run test` — unit tests
- `npm run lint` — lint
- `npx cap sync` — after any native config change
- `npx cap run ios` / `npx cap run android` — run on device/emulator

## Save migration rules
Every schema change to the persisted save requires:
1. Bump the save version in the canonical save type/schema.
2. Add a migration case in the persist/load pipeline. Migrations must be idempotent.
3. Update migration fixtures/tests (once they exist).

## IAP rules (RevenueCat)
Ethical monetization constraints:
- No loot boxes. No pay-to-win. No energy system.
- Never gate progression behind currency.
- IAP categories only:
  - Remove Ads (non-consumable)
  - Credit bundles (consumables)
  - Season pass (non-renewing)
  - Cosmetic packs (non-consumables)
  - Manager Pro (auto-renewing subscription)

## Commit conventions
Conventional Commits. Prefixes: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.

## Performance budgets
- Cold launch to hydrated home screen: <3s on iPhone SE 2 / mid-range Android.
- Race tick at 1x: 60fps sustained on iPhone SE 2.
- Save write: <200ms for a ~1MB save.

## Operating workflow
- Use `TASK.md` to keep a single session focused and resumable.
- Append non-obvious decisions to `LEARNINGS.md` (do not rewrite history).
- Use `docs/agents/stack-decisions.md` when a prompt/library conflicts with another document.

