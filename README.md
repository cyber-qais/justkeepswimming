<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Plugin-06b6d4?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge" alt="Apache 2.0" />
  <img src="https://img.shields.io/badge/v2-Scrum_Master-8b5cf6?style=for-the-badge" alt="v2 Scrum Master" />
</p>

<h1 align="center">Just Keep Swimming</h1>

<p align="center">
  <strong>Scrum-master execution for multi-phase plans: parallel agents, review gates, open-door merge windows, and a live board that makes context loss survivable.</strong>
  <br />
  <a href="https://cyber-qais.github.io/justkeepswimming/">Landing Page</a> &middot; <a href="THINKING.md">Thinking Protocol</a> &middot; <a href="MARKETING.md">Why JKS?</a>
</p>

---

## The Problem

AI coding agents execute big plans serially, burn their context on file reads, stall at arbitrary phase budgets, and lose knowledge when context compresses. Every session restart re-reads a growing pile of handoff documents. Every phase waits for the previous one even when they're independent.

> **Context is the scarcest resource. v2 stops spending it on implementation.**

## Quick Start

```bash
# Plugin install (recommended)
/plugin marketplace add cyber-qais/justkeepswimming
/plugin install justkeepswimming

# Or manual install
mkdir -p ~/.claude/commands/justkeepswimming
cp commands/justkeepswimming/*.md ~/.claude/commands/justkeepswimming/
```

Then:
```
/justkeepswimming:go my-feature
```

---

## How v2 Works — the Scrum Master Model

```
PLAN.md ─► sprint plan ─► dispatch devs (parallel) ─► review gate ─► merge window ─► ship
              ▲                                            │       (dispatch NEXT sprint
              └────────────── BOARD.md update ◄────────────┘        BEFORE integrating —
                                                                    the door stays open)
```

- **The orchestrator never reads implementation files.** Parallel dev agents own disjoint files and return ≤25-line reports. One session supervises ten phases instead of executing two.
- **One live BOARD.md replaces the handoff pile.** Updated at every sync point. Resume = two file reads (PLAN + BOARD), no matter how many sessions came before.
- **The door stays open.** One worktree/branch per plan, kept open across sprints AND sessions. Merge windows integrate and deploy finished phases *while later phases are still being built* — no per-phase worktree churn, no big-bang merge at the end.
- **Every phase passes an adversarial review gate before merging.** Fixes go back to the same warm agent (cached context), not a fresh spawn.
- **The tier doctrine puts every model where it earns its cost.** The strongest model orchestrates (e.g. Fable); one tier down develops (Opus); two tiers down take the rote lanes (Sonnet/Haiku, low effort); review gates run at high effort, and the riskiest surfaces get the orchestrator's model as their reviewer.
- **Fresh sessions beat compaction.** Sessions run as shifts that end at clean board boundaries — a new session resumes from two reads instead of a compacted orchestrator continuing with silently blurred judgment.
- **A completeness critic sweeps for gaps** before the plan is declared done — then SUMMARY.md, a clean folder, and prioritized next-step recommendations.

## Two Commands

### `/justkeepswimming:go` — Plan & Execute

| What it does | How |
|---|---|
| **Creates plans** | From scratch, from conversation (`--from-context`), or imported — with acceptance criteria + dependencies per phase |
| **Executes in lanes** | Solo lane for small plans; scrum lane orchestrates parallel dev agents for 3+ phases |
| **Reviews everything** | Adversarial review gate per phase, before its merge |
| **Ships continuously** | Merge windows integrate + deploy green phases while agents keep working |
| **Survives any session end** | The board is always current; resume from two reads |
| **Maintains completed work** | Structured debugging with maintenance logs |

### `/justkeepswimming:night-build` — Autonomous Pipeline

| Phase | What happens |
|---|---|
| **Discover** | Reads CLAUDE.md, detects stack, deploy targets, baseline since last night build |
| **Review** | Parallel reviewer agents: correctness, conventions, security, wiring gaps |
| **Fix** | High-confidence fixes applied + verified; risky findings deferred with specifics |
| **Test / Build / Deploy** | Project's own commands; queued/batched deploys count as success |
| **Summary** | Detailed report, self-reviewed for gaps, committed and pushed |

Fully autonomous. No prompts. Adapts to any project.

---

## Flags

```
/justkeepswimming:go [plan-name] [flags]
```

| Flag | Effect |
|:-----|:-------|
| *(no arguments at all)* | Status table of every plan, then auto-resume the most recent active one. |
| `status` | Status table only — no resume, no dispatch. |
| `<plan-name>` (no flags) | Autonomous mode on that plan. Execute continuously; the board stays current. |
| `--lite` | Half-day lane: one LITE.md, inline execution, one end review gate. |
| `--solo` | Force inline execution (no agent orchestration). |
| `--interactive` | Pause at sprint boundaries for review. |
| `--from-context` | Build plan from current conversation. |
| `--now` | `--from-context` + skip confirmations. Just go. |

---

## What's On the Board?

```markdown
# Board — API Migration

**Updated**: 2026-03-13 22:41 · **Door**: wt-api-migration (open)
**Progress**: 4/6 phases merged · **Shipped**: abc1234

## Status
| Phase | State | Agent | Files | Commit |
|---|---|---|---|---|
| 3. Auth middleware | merged | Dev-3 | middleware/auth.js | e19af02 |
| 5. Rate limiting | review | Dev-5 | services/rateLimiter.js | — |

## Decisions (settled — agents follow, don't re-litigate)
- 2026-03-12: merge convention: FF to main; deploy: npm run deploy; checks: npm test

## Learnings (cumulative — survives every session)
- Redis cache uses `user:{id}:session` key scheme (TTL 30min)
- Rate limiter must exempt /health — `services/rateLimiter.js:88`
```

Every learning, every decision, every file reference — one document, always current.

**And it's audited, not trusted:** `scripts/board-check.js` (ships with the plugin, zero dependencies) verifies every merged/shipped claim, the progress count, the ship SHA, and the door state against git truth — at resume, after every merge window, and before completion:

```
$ node scripts/board-check.js api-migration
  ❌ FAIL: "Phase 3": commit 9f3ab12 is NOT on main — state says merged
  ✖ 1 failure(s) — the board does not match git truth.
```

For half-day jobs there's a **lite lane** (`--lite`): one `LITE.md`, inline execution, a single end-of-work review gate — and a hard rule to graduate to a full board the moment scope outgrows the sitting.

---

## The Thinking Protocol

Most agents pattern-match to common fixes and guess. JKS agents **verify conditions for success**.

<table>
<tr>
<td width="50%">

**Without Thinking Protocol**
```
Build fails →
  Try common fix #1 →
    Doesn't work →
  Try common fix #2 →
    Doesn't work →
  Try common fix #3 →
    Works! (or doesn't)
```
3 attempts, hoping one sticks.

</td>
<td width="50%">

**With Thinking Protocol**
```
Build fails →
  List all conditions for success →
  Verify each condition →
  Find the false one →
  Fix it. Done.
```
1 targeted fix at the root cause.

</td>
</tr>
</table>

Six principles injected into every session:

| # | Principle | One-liner |
|:-:|:----------|:----------|
| 1 | **Diagnose before you prescribe** | Gather facts before forming hypotheses |
| 2 | **Trace the full chain** | List every condition, verify each one |
| 3 | **Check what's actually there** | Read output with an open mind |
| 4 | **Know the silent failures** | Systems fail without useful errors |
| 5 | **Minimum effective intervention** | Fix root cause only |
| 6 | **Resist "the usual fix"** | If it's been tried, check a different layer |

Plus the **Orchestrator's Corollary** for v2: delegate the noise, keep the signal — see [`THINKING.md`](THINKING.md).

---

## The Token Economy

| Rule | Practice |
|:---|:---|
| Delegate the noise | The orchestrator never reads implementation files; agents return ≤25-line reports |
| One-read resume | BOARD.md is the only state file — the handoff pile is dead |
| Cache alignment | Front-load reads, batch tool calls, keep orchestrator turns short and stable |
| Reuse warm agents | Fixes go to the same agent (cached context), not fresh spawns |
| Tier doctrine | Strongest model orchestrates; one tier down develops; rote lanes go two tiers down |
| Fresh sessions | Shifts end at board boundaries — resume is two reads, compaction never gets to judge |
| Kill rework | Acceptance criteria in every dispatch; review gates before every merge |

---

## Post-Delivery Maintenance

Plan complete? JKS stays useful. When bugs surface or changes are needed:

```
/justkeepswimming:go my-feature
> "That plan is complete. Maintenance mode?"
```

- Restores context from SUMMARY.md
- Applies Thinking Protocol to every investigation
- Creates maintenance logs with investigation steps, changes, and verification
- Escalates to a new plan if scope exceeds a targeted fix

---

## Comparison

| | Just Keep Swimming | Heavy workflow systems |
|:---|:---|:---|
| **Files** | 2 commands + 1 methodology doc | 30+ files, state tracking |
| **State** | One live board per plan | STATE.md, ROADMAP.md, CONTEXT.md, ... |
| **Concepts** | Plan, Board, Sprint, Merge window | Projects, Milestones, Phases, Waves, Audits |
| **Parallelism** | File-ownership lanes, review gates, one git owner | Usually none, or unmanaged |
| **Setup** | Copy 2 files or install plugin | Plugin + configuration + learning curve |

---

## Directory Structure

```
your-project/
└── docs/justkeepswimming/
    ├── api-migration/
    │   ├── PLAN.md                        # Phases + acceptance criteria + dependencies
    │   ├── BOARD.md                       # Live state — always current
    │   ├── SUMMARY.md                     # Architecture overview + next steps
    │   ├── 2026-03-15-maintenance-001.md  # Post-delivery fix log
    │   └── archive/                       # Legacy handoffs, review scratch
    └── night-build/
        └── 2026-03-14-night-build.md      # Build report
```

Plain markdown files. Commit them, branch them, `git blame` them.

---

## Dependencies

- **Claude Code** (any recent version). Subagent support (the Agent tool) unlocks the scrum lane; without it, the solo lane still works everywhere.
- **superpowers plugin** *(optional)* — for auto-generated plans via `superpowers:writing-plans`

---

## FAQ

<details>
<summary><strong>What happened to handoff documents?</strong></summary>
Replaced by the live board. v1 plans with handoff piles migrate automatically: the first v2 session synthesizes BOARD.md from them once and archives the pile. Resume is two reads forever after.
</details>

<details>
<summary><strong>Do parallel agents conflict with each other?</strong></summary>
No — each phase owns a disjoint set of files, shared registries are edited only by the orchestrator at merge windows, and only the orchestrator runs git. Conflicts are prevented structurally, not resolved after the fact.
</details>

<details>
<summary><strong>Can I use this without subagent support?</strong></summary>
Yes — the solo lane executes inline with the same board, review discipline, and completion flow. <code>--solo</code> forces it.
</details>

<details>
<summary><strong>What happens when the plan is complete?</strong></summary>
A completeness critic hunts for gaps first. Then SUMMARY.md (architecture, every file changed, prioritized next steps), a cleaned folder, the worktree/branch is closed out, and the agent offers to turn the recommendations into a follow-up plan.
</details>

<details>
<summary><strong>Can I have multiple active plans?</strong></summary>
Yes. Each plan lives in its own directory with its own board and its own open door.
</details>

<details>
<summary><strong>Does this work with git?</strong></summary>
Plans and boards are plain markdown files, and the execution model is git-native: one branch/worktree per plan, merge windows, your project's own merge convention (direct merge or PR).
</details>

---

<p align="center">
  <a href="LICENSE">Apache 2.0</a> &middot; Made by <a href="https://github.com/cyber-qais">Qais Alkurdi</a>
</p>
