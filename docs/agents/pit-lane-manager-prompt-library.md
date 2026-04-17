# Pit Lane Manager — Claude Code prompt library (verbatim)

Source: `Pit Lane Manager_ Unlicensed F1 Management Sim Production Blueprint.pdf`

Notes:
- These prompts are intended to be pasted **verbatim** into Claude Code, in order.
- The prompts assume each step’s output is committed before moving to the next.
- Replace `{{PROJECT_ROOT}}` with your repo path when required.
- If this repo only contains PDFs (as it does now), start at Prompt 1 when you’re ready to generate the actual codebase.

---

## Prompt 1 — Fork setup and cleanup

You are working in the Dynasty Manager codebase (React 18 / Vite / TS / Tailwind v4 / shadcn-ui / Zustand / Framer Motion / Capacitor 7). We are forking it into \"Pit Lane Manager,\" an unlicensed F1 management sim.

Tasks:
1. Update package.json name to \"pit-lane-manager\", version 0.1.0, and description.
2. Update capacitor.config.ts: appId \"com.pitlanemanager.app\", appName \"Pit Lane Manager\".
3. Update index.html title and meta description.
4. Delete every file/folder specific to football: components/game/match/, components/game/tactics/, components/game/formations/, sim/match.ts, sim/tactics.ts, stores/slices/matchSlice.ts, stores/slices/tacticsSlice.ts, data/players.json (but KEEP data/teams.json as a template — we'll replace contents next prompt).
5. Rename everywhere in code (case-preserving): \"club\" → \"team\", \"player\" (when referring to athlete, not user) → \"driver\", \"squad\"/\"roster\" → \"grid\", \"match\" → \"race\", \"fixture\" → \"race\", \"training\" → \"development\", \"manager\" is fine to keep.
6. Update components/game/team/ filenames: PlayerCard → DriverCard, SquadGrid → GridView.
7. Remove all football-specific Tailwind classes, icons (soccer ball, goal, etc.), and copy.
8. Keep ALL shadcn primitives in components/ui/ untouched.

---

## Prompt 2 — Core TypeScript domain models

9. Keep stores/slices/{teamSlice, financeSlice, careerSlice, settingsSlice}.ts — we'll modify their fields in the next prompt, not delete them.
10. Run `npm run build` and fix any resulting TS errors with minimal changes.
11. Commit with message: \"chore: fork Dynasty Manager as Pit Lane Manager, remove football-specific modules\".
Output a summary of every file deleted, renamed, and modified at the end.

Create src/types/game.ts with the complete F1 management sim domain model. Use branded IDs for every entity ID. Use Money as integer cents (branded number), Stat as branded 0-100 number. Include:

Enums/unions: TireCompound (ultraSoft|soft|medium|hard|intermediate|wet), PartSlot (engine|aero|chassis|brakes|gearbox|suspension|frontWing|rearWing), StaffRole (raceEngineer|chiefDesigner|sportingDirector|strategist|mechanic|scout), SeriesTier (tier1|tier2|tier3), Weather (dry|cloudy|lightRain|heavyRain|thunderstorm), SessionType (practice|qualifying|race|sprint), DNFReason.

Entities (all as exported interfaces with JSDoc on every field explaining gameplay meaning and value ranges): Driver (with nested DriverStats: pace, overtaking, defence, consistency, smoothness, feedback, wetSkill, potential — all Stat 0-100), Contract, Car (with CarSetup sub-interface), Part, Upgrade, Staff, Sponsor (with bonus structure and requirements), Team (with TeamFinance and FinancialTransaction), Circuit, Season (with regulations sub-object including pointsTable, allowedCompounds, costCap, engineAllocation), Race (with weatherBySession keyed map), DriverLapData, DriverRaceResult, RaceResult (with rngSeed for deterministic replay), ChampionshipStanding, Championship, ScheduledInterrupt, GameEvent, SaveGame (root — include version field for migration, slotId, playerTeamId, currentDate, rngSeed, normalized Record<Id, Entity> tables for every entity type, events array, difficulty config).

Rules:
- No nested entity references — always by ID.
- Every Money field is cents (integer).
- Every Stat field is branded 0-100.
- Add makeStat(n: number): Stat and makeMoney(cents: number): Money helper constructors at the bottom.
- Do NOT include any functions or methods — pure types only.
- Keep the file under 600 lines. Include a header comment explaining the branded-ID pattern and the normalized-store pattern.

After writing the file, run `npx tsc --noEmit` and verify zero errors.

---

## Prompt 3 — Zustand store architecture

Build the Zustand store architecture in src/stores/. Use the slice pattern with a single combined store, persist + immer + devtools middleware, and a Capacitor Preferences storage adapter.

Create:
1. src/lib/storage.ts — export capacitorStorage: StateStorage using @capacitor/preferences. Async getItem/setItem/removeItem. Handle missing keys returning null.
2. src/stores/slices/teamSlice.ts — state: teams Record, actions: addTeam, updateTeam, setPlayerTeam, adjustPrestige. Uses immer.
3. src/stores/slices/driverSlice.ts — state: drivers Record, contracts Record. Actions: addDriver, signDriver (cross-slice: updates team roster + finance + creates contract atomically via get()), releaseDriver, trainDriver (adds XP), retireDriver.
4. src/stores/slices/raceSlice.ts — state: currentRaceId, currentSession, liveRaceState (tick, lap, driverPositions, weather). Actions: startRaceWeekend, advancePractice, runQualifying, tickRace, setDrivingStyle, setEngineMode, callPitStop, finishRace.
5. src/stores/slices/careerSlice.ts — state: currentDate, currentSeasonId, nextInterrupt, seasons Record, races Record, championships Record, events[]. Actions: advanceDay, advanceUntilInterrupt, completeSeason, startNewSeason.
6. src/stores/slices/financeSlice.ts — player team balance accessor + transaction log. Actions: credit, debit, addTransaction. Cross-slice reads OK.
7. src/stores/slices/carDevSlice.ts — parts Record, upgrades Record. Actions: startUpgrade, advanceUpgradesWeekly, completeUpgrade (produces Part), fitPart.
8. src/stores/slices/settingsSlice.ts — audio, locale, difficulty, hapticsEnabled.
9. src/stores/useGameStore.ts — combines all slices. Applies middleware IN THIS ORDER (outermost first): devtools → persist → immer. Persist config: name \"pit-lane-save-v1\", version 1, storage capacitorStorage via createJSONStorage, partialize to strip ephemeral liveRaceState, onRehydrateStorage sets a hasHydrated flag, migrate stub returning state as-is for v1.
10. src/hooks/useHydration.ts — returns boolean from useGameStore.persist.hasHydrated.

Type each slice creator as StateCreator<GameState, [[\"zustand/devtools\", never], [\"zustand/persist\", unknown], [\"zustand/immer\", never]], [], SliceState>. Export a single useGameStore hook.

Rules:
- Never mutate outside immer set().
- signDriver must be atomic — if finance debit fails (insufficient funds), no contract is created, no roster changes.
- All cross-slice reads use get(), not direct imports.
- Add a useShallow selector helper in src/stores/selectors.ts for common derived data (standings, playerTeam, playerDrivers).
- Run `npx tsc --noEmit` and `npm run build`. Zero errors expected.

---

## Prompt 4 — Race simulation engine

Build the core race simulation engine in src/sim/. This is a pure-functional module — no React, no Zustand, no side effects. Input: RaceState. Output: updated RaceState + events[].

Files:
1. src/sim/rng.ts — seedable PRNG. Export mulberry32(seed: number): () => number and splitmix32(seed: number): (salt: string) => number for derived per-lap seeds. Include gaussianNoise(rng, sigma): number using Box-Muller.
2. src/sim/lapTime.ts — export computeLapTime(driver, car, setup, tire, fuelKg, weather, circuit, rng): number (seconds). Formula:
   - lapTime = circuit.baseLapTimeSec
   - + carPerformanceFactor(car.overallPerformance) // -0.05s per pt above 50
   - + driverPaceFactor(driver.stats.pace) // -0.03s per pt above 50
   - + tirePhaseTime(tire.compound, tire.lapsUsed) // see tires.ts
   - + fuelMassPenalty(fuelKg) // 0.035s per kg
   - + weatherPenalty(weather, tire.compound) // e.g. slicks in rain = +8s
   - + setupQualityFactor(setup.qualityAtCurrentCircuit) // -0.5s at 100 quality
   - + gaussianNoise(rng, driverConsistencySigma(driver.stats.consistency))
   Apply tireManagement from driver.stats.smoothness as a wear-rate multiplier (handled in tires.ts call).
3. src/sim/tires.ts — 4-phase model (warmup, peak, degradation, cliff). export tirePhaseTime(compound, lapsUsed): number and advanceTireWear(tire, drivingStyle, smoothness, trackFactor): updatedTire. Compound constants:
   - ultraSoft: peak=+0.8s, warmup=1 lap, peakEnd=6, degEnd=12, cliff=14+
   - soft: peak=+0.4s, peakEnd=10, degEnd=20, cliff=24+
   - medium: peak=0s, peakEnd=16, degEnd=28, cliff=34+
   - hard: peak=-0.2s slower baseline but most durable, peakEnd=22, degEnd=40, cliff=48+
   - intermediate: for lightRain
   - wet: for heavyRain
4. src/sim/overtake.ts — export attemptOvertake(attacker, defender, track, rng): { success: boolean, timeCost: number }. Use:
   - paceDelta = attackerCurrentPace - defenderCurrentPace
   - skillDelta = attacker.overtaking - defender.defence (in MVP defence = overtaking for simplicity)
   - p = sigmoid(paceDelta * 2 + skillDelta * 0.1 - track.overtakingDifficulty * 2)
   - if rng() < p: swap positions, attacker loses 0.3s. Otherwise both lose 0.1s.
   - Only attempt if gap < 1.0s.
5. src/sim/pitStrategy.ts — export shouldPit(driver, currentLap, state): PitDecision with reason. Rules:
   - If tireWear > 85% and not on final stint: yes (\"tireWear\")
   - If currentLap == plannedPitLap: yes (\"planned\")
   - If weather transition detected AND wrong tire type: yes (\"weatherCall\")
   - If safetyCarDeployed AND haven't used the pit stop under SC yet: yes (\"safetyCar\")
   - If undercut window open on driverAhead: yes (\"undercut\")
   - Else: no
6. src/sim/weather.ts — Markov chain. states: [dry, cloudy, lightRain, heavyRain]. Transition matrix with 0.92 stay probability, adjacent transitions 0.04 each. export advanceWeather(current, circuitVolatility, rng): Weather. export forecast(current, lapsAhead, circuit, rng): Weather[] (3-lap preview for player UI).
7. src/sim/reliability.ts — export rollFailure(car, drivingStyle, engineMode, ambientTempC, rng): { failed: boolean, reason?: DNFReason }. pFailure = basePartFailureRate * stressMultiplier(drivingStyle, engineMode) * tempMultiplier(ambientTempC). Engine failures dominate at push+hot temps.
8. src/sim/race.ts — export simulateRace(initialState, options): { result: RaceResult, lapTrace: DriverLapData[][] }. Per-lap tick loop over all drivers:
   - compute lap time
   - apply tire wear
   - check pit decision, if pit, add pit lane time loss
   - check reliability failure
   - after all drivers computed, resort grid by totalTime
   - resolve overtakes (for adjacent pairs where gap < 1.0s)
   - maybe advance weather
   - emit events (overtake, pit, dnf, fastestLap)
   Return final standings, points allocated from season.regulations.pointsTable, pole/fastestLap, headline string generated from top 3 + any DNF drama.

Rules:
- Every function is pure; RNG is passed in.
- All tunable constants live at the top of each file as exported SIM_CONSTANTS.
- Include unit-test hooks: each function exported independently.
- Write 5 Vitest smoke tests in src/sim/__tests__/race.test.ts verifying determinism (same seed = same result) and sanity (best car wins ~60%+ of simulated identical-driver races over 1000 iterations).
- Run `npm run test` and confirm green.

---

## Prompt 5 — Live race UI

Build the live race screen in src/components/game/race/. Use shadcn-ui Card/Button/Dialog/Select/Sheet primitives, Framer Motion LazyMotion with domAnimation, and Tailwind.

Components:
1. RaceScreen.tsx — top-level layout. Grid: header (lap counter, weather, time control), main (track map + standings), footer (player-driver HUD). useGameStore selector for liveRaceState.
2. TrackMap.tsx — SVG top-down loop track (use a pre-baked SVG path per circuit in data/circuits/). Render one dot per driver positioned along the path by lapProgress %. Animate ONLY at lap boundaries using Framer Motion's layoutId, never per tick. For MVP, a simplified oval or figure-8 SVG per circuit is acceptable.
3. StandingsTable.tsx — shadcn Table component. Columns: Position, Driver (team-color dot + name), Gap to leader (+X.Xs), Tire icon + laps on, Last lap time. Highlight player's drivers. Virtualize with @tanstack/react-virtual if >20 rows (won't be needed for tier1 MVP).
4. PlayerHUD.tsx — sticky bottom panel with two driver cards (for player's two drivers). Each card: driver portrait placeholder, current position, tire + wear bar, fuel bar, current driving style button, current engine mode button. Tapping opens a Sheet with strategy controls.
5. StrategyPanel.tsx — shadcn Sheet. Sections:
   - Driving Style (radio: Conserve / Standard / Push / Attack — 4 options for MVP)
   - Engine Mode (radio: Cool / Standard / Push — 3 for MVP)
   - Pit Plan (list of scheduled stops; tap to edit lap + compound; add/remove stops)
   - Pit Now button (confirms: pits at next opportunity)
   - Dispatch via useGameStore actions (setDrivingStyle, setEngineMode, updatePitPlan, callPitNow).
   Haptic feedback on every action (@capacitor/haptics Impact.Light).
6. TimeControls.tsx — header buttons: Pause / 1x / 2x / 5x. Maps to setInterval tick rate. Pause sets interval = null.
7. RaceEvents.tsx — right-side ticker of recent events (overtakes, pits, DNFs, fastest laps). Fade in/out with Framer Motion, max 5 visible. Pulled from liveRaceState.recentEvents.
8. useRaceLoop.ts hook — owns the setInterval that calls useGameStore.getState().tickRace() at the current speed. NEVER bind the tick directly to Framer Motion — drive the sim in JS, push display updates only at lap boundaries.

Rules:
- Wrap the whole race screen in <LazyMotion features={domAnimation} strict>.
- Animate only transform + opacity. Never width/height/top/left.
- Use useShallow selectors to read liveRaceState.
- Respect useReducedMotion().
- Test on iPhone SE 2 and a budget Android to validate FPS.
- Include an empty state for when liveRaceState is null (pre-race).

---

## Prompt 6 — Car development UI and logic

Build the car development module in src/components/game/cardev/ and wire it to src/stores/slices/carDevSlice.ts.

UI:
1. CarDevScreen.tsx — tabs: \"Current Car\" | \"R&D\" | \"Parts Factory\" | \"Next Year's Car\".
2. CarOverview.tsx — visual chassis diagram (static SVG open-wheeler silhouette with clickable hotspots for each PartSlot). Tapping a slot opens PartDetail.
3. PartDetail.tsx — shows fitted part stats (performance, condition/laps remaining), inventory alternatives, \"Fit this part\" button.
4. RandDTree.tsx — MVP: linear per slot (4 tiers). For each slot, show 4 tier cards. The current tier is unlocked; next tier shows cost, duration, projected gain ±20% risk, \"Start Research\" button. Previously completed tiers dimmed.
5. PartsFactory.tsx — queue view. Shows in-progress parts with progress bar, weeks remaining. \"Cancel\" button refunds 50%.
6. NextYearCar.tsx — slider allocating % of factory capacity to \"this season\" vs \"next season's chassis design\". Tooltip explains the tradeoff.

Logic:
- startUpgrade(slot, tier) action: validates balance, debits cost, creates Upgrade entity with weeksRemaining.
- advanceUpgradesWeekly: called by careerSlice.advanceDay when week boundary crossed. Each active upgrade decrements weeksRemaining by (1 + chiefDesignerSkill/100). On completion: rolls actual gain around projected ± risk, creates a Part, marks upgrade complete.
- End-of-season carryover: each slot's best-condition Part becomes the baseline for next season's starting car. Implemented in careerSlice.completeSeason.

Rules:
- All numbers and thresholds centralized in src/sim/carDevConstants.ts.
- Framer Motion for tab transitions only.
- Respect currency formatting (integer cents → $X,XXX,XXX display) via src/lib/format.ts.

Test: player starts Tier 1 Engine upgrade at $2M over 4 weeks → advances 4 weeks → Part created with performance in projected range.

---

## Prompt 7 — Driver market and contract negotiation

Build src/components/game/market/ for the driver market + contract negotiation.

UI:
1. DriverMarketScreen.tsx — filterable table of all drivers (free agents and under contract). Filters: Nationality, Age, Stat threshold (pace), Contract status. Columns: Portrait, Name, Age, Nationality, Team (or \"Free Agent\"), Overall (avg of 5 stats), Contract expiry, Salary.
2. DriverProfile.tsx — modal showing full stats with bar charts (shadcn progress), career record, current contract, potential ceiling (hidden unless scouted).
3. ContractNegotiation.tsx — modal with sliders:
   - Salary (driver's demand shown; ±20% acceptable band)
   - Length (1–4 seasons)
   - Podium bonus (0 / $100k / $500k / $1M per podium)
   - Signing bonus
   Each change updates a \"Driver Willingness\" meter (0–100%). Based on team prestige, driver morale, market demand, competing offers (RNG'd), and salary match.
   Below 50%: they'll reject. 50–80%: they'll counter-offer once. Above 80%: accept.
4. ScoutingPanel.tsx — assign scouts to regions/tiers. Weekly, scouts reveal hidden potential of drivers in their region. Scout skill affects reveal chance.

Logic:
- negotiateContract(driverId, terms): returns { status: 'accept' | 'counter' | 'reject', counterOffer?: Terms }.
- signDriver action (already in driverSlice): executes the cross-slice atomic sign.
- Driver-initiated offers: once per month, a free agent or discontent driver may send an unsolicited offer to the player's team. Shown as an interrupt.
- Silly season: at season end, all expiring contracts enter a 4-week negotiation window with simulated AI team offers driving up salaries.

Rules:
- Counter-offers store the last rejected terms to avoid spam.
- Prestige gates top drivers.
- Show clear reasons on rejection.

Test: attempt to sign a top driver with a bad team → reject → improve team prestige → retry → accept.

---

## Prompt 8 — Financial management and sponsor system

Build src/components/game/finance/ and extend src/stores/slices/financeSlice.ts.

UI:
1. FinanceDashboard.tsx — current balance, income chart, expense chart by category, 4-week forecast, ledger table.
2. SponsorsScreen.tsx — slot grid (title / premier ×2 / major×3). Slots show sponsor details, empty slots show \"Browse Sponsors\".
3. SponsorMarket.tsx — list of available sponsors filtered by marketability. Each card includes tier, base payment, bonus structure, requirements, length. Tap → SponsorNegotiation.
4. SponsorNegotiation.tsx — MVP: Accept/Reject (v1.1 adds negotiation).

Logic:
- Race weekend sponsor bonus payouts based on results (per-podium/per-win/per-pole), ledgered.
- Season end: sponsors pay seasonPayment, contracts tick down, expired return to market.
- Marketability computed daily as: (avg driver marketability + team prestige/2) / 1.5.
- Board expectations check at season end with patience decrement; at 0 trigger game over/demotion.
- Seed `src/data/sponsors.json` with 40 fictional sponsors. Include Lanham-safe disclaimer in a header comment.

Rules:
- All money arithmetic in integer cents.
- All financial writes go through addTransaction() with memo.
- Display formatting via src/lib/format.ts formatMoney(cents).

Test: sponsor bonus payouts credit correctly for podiums/wins.

---

## Prompt 9 — Season calendar and championship standings

Build src/components/game/calendar/ and wire to careerSlice.

UI:
1. CalendarScreen.tsx — list of races, upcoming chip, forecast icon, past results chip; tap past → RaceResultScreen; tap next → RaceWeekendScreen.
2. StandingsScreen.tsx — Drivers | Constructors tables, highlight player, team-color dot.
3. ContinueButton.tsx — persistent floating button triggering advanceUntilInterrupt(), showing next interrupt date.
4. InterruptDialog.tsx — dialog per interrupt type (race/news/contract/board/upgrade/transfer deadline).
5. RaceResultScreen.tsx — post-race summary + standings impact + headline.

Logic:
- advanceDay increments date and processes events; weekly jobs at week boundary.
- advanceUntilInterrupt loops until nextInterrupt non-null (cap 30 days).
- completeSeason computes final standings, awards bonuses, morale updates, sponsor expiry, AI market sim, next calendar generation, carryover parts, board patience changes, and triggers season-end interrupt.
- Dates are ISO strings. Use date-fns.
- Standings recomputed after every race and stored for O(1) UI read.
- Scheduled events RNG uses derived seeds for determinism.

Test: full 10-race season flows end-to-end with interrupts and rollover.

---

## Prompt 10 — CLAUDE.md for the project

Create CLAUDE.md at the project root with the full context a future Claude Code session needs. Include these sections verbatim:

# Pit Lane Manager — Claude Code Context
## Project
Mobile F1 management sim (unlicensed) built on React 18 + Vite + TypeScript + Tailwind v4 + shadcn-ui + Zustand + Framer Motion + Capacitor 7. Forked from Dynasty Manager (football management game). Target: iOS App Store + Google Play, free-to-play with IAP.
## Legal boundary
Never introduce \"F1\", \"Formula 1\", \"Formula One\", \"FIA\", \"Grand Prix\" as brand elements. Real country/city names are OK. Real circuit names are NOT (they're trademarked — use our fictional circuit names from data/circuits.json). Real driver names are NEVER OK. Never match real team three-letter codes (FER, MER, MCL, RBR, ALP, AST, WIL, ALF, HAA, SAU). All driver portraits/helmets/suits must be original art.
## Architecture invariants
- Single bound Zustand store (useGameStore) with slices combined under persist + immer + devtools. NEVER create additional independent Zustand stores.
- All entity IDs are branded strings. Never pass raw string literals as IDs.
- All money is integer cents (branded Money type). Convert to display at render time only via lib/format.ts formatMoney().
- All stats are branded 0-100. Use makeStat() at boundaries.
- All entities normalized as Record<Id, Entity>. No nested entity references.
- The race sim (src/sim/) is pure-functional — no React, no Zustand, no side effects. RNG is always passed in.
- Hydration gate is mandatory: App.tsx must not render game content until useHydration() === true, or iOS will reject with 2.1 crash on launch.
- Framer Motion: only animate transform/opacity. Never width/height/top/left. Wrap race screen in LazyMotion.
- During race tick loop, NEVER bind Zustand state directly to Framer Motion animate prop. Push to UI only at lap boundaries.
## Folder structure
(Paste the full folder tree from the migration plan)
## Commands
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run test` — Vitest
- `npx cap sync` — after any native config change
- `npx cap run ios` / `android` — run on device/emulator
- `npm run lint` — ESLint
## Save migration rules
Every schema change to SaveGame requires:
1. Bump SaveGame.version in src/types/game.ts
2. Add a migration case in useGameStore persist config migrate(). Must be idempotent.
3. Update any v1-saves test fixture in src/stores/__tests__/migrations.test.ts.
## IAP rules (RevenueCat)
Never gate game progression behind currency. No loot boxes. No energy system. All IAPs fall in one of: Remove Ads (non-consumable), Credit Bundles (consumables), Season Pass (non-renewing subscription), Livery/Cosmetic Packs (non-consumables), Manager Pro (auto-renewing subscription).
## Commit conventions
Conventional Commits. Prefixes: feat:, fix:, chore:, refactor:, docs:, test:.
## Performance budgets
- Cold launch to hydrated home screen: <3s on iPhone SE 2 / mid-range Android.
- Race tick at 1x: 60fps sustained, no dropped frames on iPhone SE 2.
- Save write: <200ms for a 1MB save.

---

## Prompt 11 — TASK.md session continuity template

Create TASK.md at the project root as a live working document. Structure:

# Current Task
## Goal
(One-line statement of what I'm working on this session)
## Context
(Links to relevant files, previous commits, open PRs)
## Plan
- [ ] Step 1
- [ ] Step 2
## Blocked on
(Anything external or decision-needed)
## Session log
- YYYY-MM-DD HH:MM — started
- …
## Definition of done
- [ ] Tests green
- [ ] `npm run build` green
- [ ] `npx cap sync ios && npx cap sync android` green
- [ ] Manual test on simulator passed
- [ ] Committed with Conventional Commit message
- [ ] TASK.md reset for next session
# Backlog
(Ordered list of next 10 tasks)
# Done (last 20)
(Archive)

Seed the Backlog with the week-by-week tasks from the 8-week roadmap. Seed Done with \"Forked from Dynasty Manager\" as the first entry.

