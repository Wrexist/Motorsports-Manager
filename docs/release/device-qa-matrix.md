# Device QA matrix (Pit Lane Manager)

Use this for Phase G smoke checks before App Store submission. Record pass/fail and build hash in your release notes.

## Builds under test

| Build | Git SHA | Date | Tester |
| ----- | ------- | ---- | ------ |
|       |         |      |        |

## Cold start and save

| Device / OS | Hydration gate (no flash of game UI) | Save survives kill + relaunch | Notes |
| ----------- | ------------------------------------- | ------------------------------- | ----- |
| iPhone SE (small) | | | |
| Mid-range Android | | | |

## Core loop (10-race season)

| Device | Complete onboarding | Simulate all races | Calendar results + standings | Finance ledger looks sane |
| ------ | -------------------- | ------------------- | ----------------------------- | --------------------------- |
|        | | | | |

## Race replay tab

| Device | Pause / 1x / 2x / 5x | Reduced motion: no jank | Notes |
| ------ | -------------------- | ------------------------ | ----- |
|        | | | |

## Performance sanity

| Device | Race replay feels responsive | No sustained frame drops at 1x | Notes |
| ------ | ----------------------------- | -------------------------------- | ----- |
|        | | | |

## Legal copy

Run `npm run legal:scan` in CI or before tagging a release; spot-check onboarding disclaimer matches `docs/legal/naming-disclaimer.md`.
