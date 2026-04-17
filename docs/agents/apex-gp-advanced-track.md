# Apex GP — Advanced track (research bible extracts)

Source: `Research Report.pdf`

This document is intentionally kept **separate** from the Pit Lane Manager prompt library because it makes different architectural choices (and is broader in scope). Treat it as an optional advanced track unless you explicitly promote it in `docs/agents/stack-decisions.md`.

## Key advanced-track differences (high signal)
- Motion guidance leans toward **Motion 12** and import conventions like `motion/react` (vs “Framer Motion” naming in other docs).
- Entity storage guidance uses **`Map<Id,Entity>` + parallel `Id[]`**, and recommends **bypassing Immer** in hot loops.
- Save pipeline recommends **Filesystem for save blobs** + Preferences for metadata (to avoid WKWebView purge issues).
- RNG layer is more formal: string-seeded hashing + split streams per subsystem; explicit guardrails against `Math.random`.

## “Apex GP — Agent Instructions” (excerpt)
These are the “repo root” style instructions embedded in the PDF (Part 8.1). If you adopt this track, reconcile it with `CLAUDE.md` first.

- **Mission**: Build Apex GP, an unlicensed F1 management mobile game.
- **Non-negotiables**: Deterministic simulation; TypeScript strict; no F1/FIA/FOM trademarks; accessibility; performance budgets; ethical monetization.
- **Stack invariants**: React 18.3; Motion imported from `motion/react`; Zustand 5 `useShallow`; Immer `enableMapSet()`; Filesystem saves; no `localStorage`.
- **Conventions**: file naming, exports, tests, commit messages.

## 24-prompt Claude Code sequence (Part 8.3) — copy/paste track

The following prompts are included as a copyable track aligned to the Research Report’s sequence. (They are long; keep them intact if you use them.)

### PROMPT 01 — Project scaffold and tooling
Set up a new Capacitor 7 + Vite + React 18 + TypeScript monorepo at the current directory root. Use Tailwind v4 with Lightning CSS, ESLint (including a no-restricted-properties rule banning Math.random), Prettier, Vitest with @testing-library/react and jsdom, and strict TypeScript. Install dependencies: react@^18.3, react-dom@^18.3, typescript@^5.5, vite@^6, @vitejs/plugin-react, tailwindcss@^4, zustand@^5, immer, motion, zod@^4, @tanstack/react-virtual@^3, @capacitor/core@^7, @capacitor/cli@^7, @capacitor/ios@^7, @capacitor/android@^7, @capacitor/preferences, @capacitor/filesystem, @capacitor/status-bar, @capacitor/splash-screen, @capacitor/haptics, @capacitor/app, @revenuecat/purchases-capacitor. Add capacitor.config.ts for iOS bundleId gg.apexgp.app, Android gg.apexgp.app, app name \"Apex GP\". Create the directory layout from CLAUDE.md. Commit CLAUDE.md and LEARNINGS.md from the spec. Add npm scripts dev/build/test/lint/cap:sync/cap:ios/cap:android. DoD: npm install && npm run build && npm test succeeds; empty App renders \"Apex GP\" with Tailwind; ESLint fails when Math.random is added anywhere.

### PROMPT 02 — Seeded RNG and determinism guardrails
Implement the deterministic RNG layer in src/sim/rng/. Create sfc32.ts with sfc32(a,b,c,d) returning a () => number uniform in [0,1), plus xmur3(seed: string) hash. Export createRng(seed: string): Rng and makeStreams(masterSeed: string) returning {race, ai, damage, events, narrative}. Implement serialization: serializeStream(rng) returns [a,b,c,d], deserializeStream([a,b,c,d]) returns a primed Rng. Expose helpers uniform, gaussian (Box-Muller), pickWeighted, shuffle. DoD: unit tests prove same seed identical sequence; serialize/deserialize continues stream; gaussian μ/σ within 2% over 10k samples. No Math.random.

### PROMPT 03 — Canon data definitions
Implement the fictional universe as typed const data in src/canon/. Create TypeScript types for Team, Driver, Circuit, Sponsor, Supplier. Create teams.ts (10 teams), drivers.ts (20 drivers), circuits.ts (10 circuits), sponsors.ts (40+ sponsors), suppliers.ts (engine/tyre/fuel suppliers). Export CANON aggregating all. Add Zod schemas validating canon. DoD: Zod validates; tests verify counts and unique IDs; each team references exactly 2 drivers.

### PROMPT 04 — Core domain types and constants
Create src/sim/types.ts with interfaces for RaceState, DriverRaceState, WeatherState, SafetyCarState, PitStopOutcome, TrackParams, CompoundParams. Create src/sim/constants.ts exporting F1_CONSTANTS and COMPOUND dict (C5..C1 plus I/W) with deg/cliff/temp data. DoD: strict types compile; constants frozen; tests assert key values.

### PROMPT 05 — Tyre model
Implement tyre degradation in src/sim/tyre/. Export tyreDelta per formula; gripFromTemp gaussian; stepTyreThermal with two-state carcass/tread ODE; graining/blistering accumulation. DoD: tests verify cliff behavior and temp grip.

### PROMPT 06 — Weather Markov chain and drying
Implement weather in src/sim/weather/. stepWeather Markov chain; stepWetness scalar; compoundCrossover; forecast uncertainty. DoD: tests verify wetness trends and crossovers.

### PROMPT 07 — Lap time core formula
Implement lapTime composition in src/sim/race/lap-time.ts per additive model with noise and mistakes. DoD: tests verify fuel penalty ~3.3s for 100kg and low noise for high consistency.

### PROMPT 08 — ERS, fuel, DRS models
Add src/sim/race/ers.ts, fuel.ts, drs.ts implementing step functions and deltas. DoD: tests for SoC bounds and DRS thresholds.

### PROMPT 09 — Safety car and pit stop models
Add src/sim/race/safety-car.ts and pit-stop.ts including SC/VSC factors and double-stack penalty. DoD: Monte Carlo sanity and expected trigger frequencies.

### PROMPT 10 — Overtaking, reliability, race simulation loop
Add overtake/dirty air, reliability hazard, and simulateRace engine loop. DoD: determinism; season integration sanity.

### PROMPT 11 — Season simulation and AI strategy
Add season simulation and AI strategist heuristics (pit/compound/modes) and AI dev spending. DoD: no late double-stacks, SC pit usage ≥80%, plausible standings spread.

### PROMPT 12 — Zod save schema v1 and storage pipeline
Add versioned Zod schema and Filesystem-based atomic save pipeline with backup fallback. DoD: 2MB round-trip; corrupt primary falls back to backup.

### PROMPT 13 — Zustand store with slices
Create Map-based entity stores with performance-oriented subscriptions, persist, and Immer MapSet enabled. DoD: subscriber granularity and rehydrate stability.

### PROMPT 14 — App shell, routing, and theme
Add shadcn primitives, screens, navigation, MotionConfig, safe area, Capacitor status/splash integration. DoD: builds and navigation works on iOS/Android.

### PROMPT 15 — Dashboard and inbox screens
Build Dashboard and virtualized Inbox. DoD: smooth scroll and limited rerenders.

### PROMPT 16 — Race Weekend screen and live race HUD
Build multi-phase race weekend UI; use MotionValues for car positions; avoid React rerender per tick. DoD: 50-lap race at 8x without frame drops.

### PROMPT 17 — Garage, livery editor, parts and R&D
Build Garage + livery editor + R&D system with perk visibility. DoD: editor persistence and share code.

### PROMPT 18 — Drivers, staff, HQ screens
Build roster + market, staff hiring, HQ upgrades. DoD: weekly market refresh and construction progression.

### PROMPT 19 — Finance, calendar, and cost cap enforcement
Build finance breakdown + cost cap enforcement + sponsor renewals. DoD: ledger reconciliation and deterministic audits.

### PROMPT 20 — Narrative event engine
Implement narrative/inbox generation and rivalry state. DoD: distinct items across season and state impact.

### PROMPT 21 — Battle Pass, store, and RevenueCat
Wire RevenueCat offerings, store UI, battle pass, published drop rates where applicable. DoD: purchases + restore work.

### PROMPT 22 — Analytics, live-ops calendar, push notifications
Integrate analytics and push with frequency caps; remote-config live-ops calendar. DoD: events land; opt-in shown after win.

### PROMPT 23 — Performance hardening and 60fps race view
Profile and optimize hot loops and bundle. DoD: 58–60fps sustained; critical bundle size budget.

### PROMPT 24 — Submission hardening and launch readiness
Prepare privacy manifest, Play target SDK, billing, onboarding funnel. DoD: TestFlight/Play tracks accept builds and privacy tools report clean.

