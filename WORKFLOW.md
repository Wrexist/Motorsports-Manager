# Working in this repo (agents)

This repository is a **runnable Pit Lane Manager app** (`src/`) **plus** research PDFs and agent documentation for an unlicensed **championship-style open-wheel** management sim. The authoritative agent rules live in `CLAUDE.md`.

## Start here
- Read `CLAUDE.md` first (legal + architecture invariants).
- Use `TASK.md` to keep session continuity.
- Use `docs/agents/pit-lane-manager-prompt-library.md` to generate the actual codebase in a safe, staged way.

## Two tracks exist on purpose
There are two source documents in the PDFs and they disagree on some engineering choices.

- **Default track**: “Pit Lane Manager” prompt library (safer, minimal, fork-oriented).
- **Advanced track**: “Apex GP” research bible (broader scope, more systems, more opinions).

When they conflict, default to `CLAUDE.md` and consult `docs/agents/stack-decisions.md`.

