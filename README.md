# Pit Lane Manager

**Pit Lane Manager** is a mobile-first **fictional open-wheel racing team management** game (think championship calendars, two-car teams, pit strategy, car development, and finances).

This repository is a **greenfield** implementation on **React 18 + Vite + TypeScript + Tailwind v4 + Capacitor 7 + Zustand**, aligned with the product and engineering rules in `CLAUDE.md`. It is **not** a copy-paste fork of another app’s source tree; the [prompt library](docs/agents/pit-lane-manager-prompt-library.md) describes an optional “fork Dynasty Manager” workflow for teams who start from that codebase.

## Legal (read before shipping UI or store copy)

All player-facing text must follow `CLAUDE.md` and `docs/legal/naming-disclaimer.md`: no real drivers, no real circuit names, no real team identity stacking, and **no “F1” / “Formula 1” / “FIA” / “Grand Prix”** style branding in strings or marketing.

## Commands

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |
| `npm run legal:scan` | Coarse scan for disallowed tokens in `src/` + `index.html` |
| `npm run verify` | test + lint + legal scan + build (when present in `package.json`) |
| `npm run cap:sync` | Capacitor sync after native config changes |

## Where to start

- **Agents:** `AGENTS.md`
- **Engineering law:** `CLAUDE.md`
- **Session task list:** `TASK.md`
- **Feature spec prompts:** `docs/agents/pit-lane-manager-prompt-library.md`
- **Copy this repo into a new GitHub project:** `docs/agents/fork-into-new-repo.md` (and `scripts/new-project-from-this-repo.sh` for a file-only export)
