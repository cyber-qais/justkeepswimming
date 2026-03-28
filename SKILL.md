---
name: justkeepswimming
description: "Plan management with context-aware session handoffs for multi-phase implementations. Use this skill whenever the user wants to break a large project into phases, plan a multi-step implementation, manage work across multiple sessions, create handoff documents to preserve context, do an end-of-day autonomous build/deploy pipeline, or maintain and debug previously completed work. Trigger on phrases like: 'break this into phases', 'implementation plan', 'this will take multiple sessions', 'let's plan this out', 'continue where we left off', 'handoff', 'night build', 'end of day build', 'context is getting long', 'session management', 'plan this project', or any large-scope coding task that clearly cannot be done in a single response. Also trigger when the user mentions context rot, context loss, or preserving knowledge across sessions."
---

# Just Keep Swimming

Context-aware plan management with smart session handoffs. Prevents knowledge loss across long implementations by creating structured handoff documents that carry cumulative context forward.

## Two Commands

### `go` — Plan & Execute
Creates, executes, and hands off multi-phase implementation plans. Monitors context health and automatically creates handoff documents before context degrades.

**Flags:** `--interactive` (pause after each phase), `--from-context` (build plan from conversation), `--now` (from-context + skip confirmations)

**Modes:** New plan → Execute → Handoff → Resume → Completion → Maintenance

For full instructions, read: `commands/justkeepswimming/go.md`

### `night-build` — Autonomous Pipeline
Unattended end-of-day pipeline: reviews commits, code reviews, syntax checks, tests, builds, deploys, writes summary, commits and pushes. Fully autonomous — no prompts.

For full instructions, read: `commands/justkeepswimming/night-build.md`

## Core Concepts

- **Plans** live in `docs/justkeepswimming/{plan-name}/` with a `PLAN.md`, handoff files, and a `SUMMARY.md` on completion
- **Handoffs** capture cumulative context from ALL prior sessions — the next session reads one document and has full context
- **Session budgets** enforce hard limits (2 phases standard, 5 phases extended context) to prevent context exhaustion
- **Thinking Protocol** (6 principles for systematic debugging): diagnose before prescribing, trace the full chain, check what's actually there, know silent failures, minimum effective intervention, resist "the usual fix"
- **Maintenance mode** for post-delivery debugging with structured investigation logs

## When to Read the Full Command Files

- Before executing any plan management task → read `commands/justkeepswimming/go.md`
- Before running a night build → read `commands/justkeepswimming/night-build.md`
- For the full thinking protocol → read `THINKING.md`
