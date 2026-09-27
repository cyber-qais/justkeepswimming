---
name: justkeepswimming
description: "Multi-phase plan execution and context preservation. Use whenever the user wants to break a large project into phases, execute a multi-step implementation plan start-to-finish, run work across parallel agents without conflicts, manage work across multiple sessions, preserve context with a live board or handoffs, run an end-of-day autonomous build/deploy pipeline, or maintain and debug previously completed work. Trigger on phrases like: 'break this into phases', 'implementation plan', 'this will take multiple sessions', 'execute this plan', 'scrum master', 'orchestrate agents', 'parallel agents', 'continue where we left off', 'resume the plan', 'handoff', 'the board', 'night build', 'end of day build', 'context is getting long', 'context rot', or any large-scope coding task that clearly cannot be done in a single response."
---

# Just Keep Swimming v2

Scrum-master execution for multi-phase plans: one orchestrator with a lean context coordinates parallel dev agents, gates every phase behind adversarial review, integrates through open-door merge windows, and keeps a live BOARD.md so any session can resume from a single read.

## Two Commands

### `go` — Plan & Execute (the scrum master)
Creates or imports a plan, then executes it: small plans inline (solo lane), larger plans via parallel dev agents with file-ownership lanes, review gates, and merge windows that ship while later phases are still being built. State lives on a single live board — sessions resume with two file reads.

**Flags:** `--solo` (force inline), `--interactive` (pause at sprint boundaries), `--from-context` (build plan from conversation), `--now` (from-context + skip confirmations)

For full instructions, read: `commands/justkeepswimming/go.md`

### `night-build` — Autonomous Pipeline
Unattended end-of-day sweep: parallel review agents over the day's commits, gap analysis, confident fixes, tests, build, deploy, summary. Fully autonomous — no prompts.

For full instructions, read: `commands/justkeepswimming/night-build.md`

## Core Concepts

- **Plans** live in `docs/justkeepswimming/{plan-name}/` — `PLAN.md` (phases with acceptance criteria + dependencies), `BOARD.md` (live state), `SUMMARY.md` on completion
- **The board replaces handoff piles** — one rolling document updated at every sync point; resume = read PLAN.md + BOARD.md, nothing else
- **The scrum master model** — the orchestrator's context holds decisions and coordination; parallel dev agents own disjoint files and return ≤25-line reports; only the scrum master touches git
- **Open-door integration** — one worktree/branch per plan kept open across sprints and sessions; merge windows integrate and deploy finished phases while agents keep working; teardown happens once, at completion
- **Review gates** — every phase is adversarially reviewed before merge, with a risk rating and a named check of every caller the change did not touch; fixes go back to the same warm agent; one standing reviewer carries the project's invariants across phases
- **Concurrency caps win** — when the project or owner limits concurrent subagents, sprints run as a serial queue (commit each GREEN phase before the next dispatch); phases, gates and the board stay the same
- **Shipped ≠ done** — after the ship, a verifier drives the live surface (real CRUD, desktop + phone, no outward actions, cleans up its data); findings go through the gate, re-ship, re-verify; post-deploy steps (permission rollouts, migrations) live on the board with their exact commands
- **Tier doctrine** — the strongest model orchestrates (never downgraded, never compacted); one tier down develops; two tiers down take rote lanes; high effort is reserved for review gates, and the riskiest surfaces get the orchestrator's model as reviewer
- **Fresh sessions over compaction** — work in shifts that end at clean board boundaries; a new session resumes from two reads instead of a compacted orchestrator continuing with silently degraded judgment
- **The board is audited, not trusted** — `scripts/board-check.js` verifies every merged/shipped claim, the progress count, the ship SHA, and the door state against git truth; it runs at resume, after every merge window, and before completion
- **Lite lane** for half-day work — one LITE.md file, inline execution, a single end-of-work review gate; graduates to a full board the moment scope outgrows a sitting
- **Bare `go` picks up where you left off** — no arguments prints a one-line status of every plan and auto-resumes the most recently updated active one; `go status` prints the table and stops
- **Token economy** — delegate the noise, one-read resume, cache-aligned context, right-sized models, review-before-merge to kill rework
- **Thinking Protocol** (six principles for systematic problem-solving): diagnose before prescribing, trace the full chain, check what's actually there, know silent failures, minimum effective intervention, resist "the usual fix" — see `THINKING.md`
- **Maintenance mode** for post-delivery debugging with structured investigation logs

## When to Read the Full Command Files

- Before executing any plan management task → read `commands/justkeepswimming/go.md`
- Before running a night build → read `commands/justkeepswimming/night-build.md`
- For the full thinking protocol → read `THINKING.md`
