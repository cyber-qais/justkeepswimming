<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Plugin-06b6d4?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge" alt="Apache 2.0" />
  <img src="https://img.shields.io/badge/v2.3-Scrum_Master-8b5cf6?style=for-the-badge" alt="v2.3 Scrum Master" />
</p>

<h1 align="center">Just Keep Swimming</h1>

<p align="center">
  <strong>A scrum master for Claude Code. It runs your multi-phase plan with parallel dev agents, reviews every phase before merging, ships as it goes, and keeps one live board so any session can pick the work back up from two file reads.</strong>
  <br />
  <a href="https://cyber-qais.github.io/justkeepswimming/">Landing Page</a> &middot; <a href="THINKING.md">Thinking Protocol</a> &middot; <a href="MARKETING.md">Why JKS?</a>
</p>

---

## The problem

Big plans go badly for AI agents in a predictable way. The agent executes phases one at a time even when they're independent. It spends its own context reading source files until the important early decisions get compressed into mush. When the session dies, the next one starts by re-reading a pile of handoff notes that grows every day. You come back in the morning to find it stalled on phase 2 of 9, asking a question it already answered.

Version 1 of this plugin treated the symptom: write everything down before you forget. Version 2 treats the cause. The orchestrator stops doing the work that burns its context in the first place.

## Quick start

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

Coming back later? Run it with no arguments. It prints a status line for every plan and resumes the most recent active one.

---

## How v2 works: the scrum master model

```
PLAN.md -> sprint plan -> dispatch devs (parallel) -> review gate -> merge window -> ship
              ^                                            |      (dispatch NEXT sprint
              +-------------- BOARD.md update <------------+       BEFORE integrating.
                                                                   The door stays open.)
```

The orchestrator never reads implementation files. Parallel dev agents own disjoint sets of files and report back in 25 lines or less. One session can supervise ten phases this way instead of executing two.

State lives on a single live BOARD.md, updated at every sync point. Resume means two file reads: the plan and the board. It doesn't matter how many sessions came before.

The door stays open. Each plan gets one worktree or branch, kept alive across sprints and across sessions. Merge windows integrate and deploy finished phases while later phases are still being built. There's no per-phase workspace churn and no big-bang merge at the end.

Every phase passes an adversarial review gate before it merges. When a reviewer finds real bugs, the findings go back to the same dev agent that wrote the code, because its context is warm and cached. A fresh agent would start by re-reading the world.

And the board is audited, not trusted. A zero-dependency script checks its claims against git itself.

## Two commands

### `/justkeepswimming:go`

| What it does | How |
|---|---|
| Picks up where you left off | Bare invocation: status table of every plan, then auto-resume the most recent active one |
| Creates plans | From scratch, from the current conversation (`--from-context`), or imported. Every phase carries acceptance criteria and dependencies |
| Executes in lanes | Lite lane for half-day jobs, solo lane for small serial plans, scrum lane with parallel agents for everything bigger |
| Reviews before merging | An adversarial review gate per phase. Two failed rounds and the phase is parked on the board instead of looped forever |
| Ships continuously | Merge windows integrate and deploy green phases while agents keep working |
| Survives any session end | The board is always current; a crash loses one sprint at most |
| Maintains delivered work | Structured post-delivery debugging with maintenance logs |

### `/justkeepswimming:night-build`

An unattended end-of-day sweep. It reads your CLAUDE.md, baselines against the last night build, fans out parallel reviewers (correctness, conventions, security, wiring gaps) over the day's commits, applies the fixes it's confident about, defers the rest with file and line references, runs your tests, deploys through your project's own release path, and leaves a summary you can read over coffee. A day with no commits produces a one-line report and exits. That counts as success.

---

## Flags

```
/justkeepswimming:go [plan-name|status] [flags]
```

| Argument | Effect |
|:-----|:-------|
| *(nothing)* | Status table of every plan, then auto-resume the most recent active one |
| `status` | Status table only. No resume, no dispatch |
| `<plan-name>` | Autonomous mode on that plan: execute continuously, board stays current |
| `--lite` | Half-day lane: one LITE.md, inline execution, one review gate at the end |
| `--solo` | Force inline execution, no agent orchestration |
| `--interactive` | Pause at sprint boundaries for review |
| `--from-context` | Build the plan from the current conversation |
| `--now` | `--from-context` plus skip every confirmation |

---

## The board

```markdown
# Board — API Migration

**Updated**: 2026-03-13 22:41 · **Door**: wt-api-migration (open)
**Progress**: 4/6 phases merged · **Shipped**: abc1234

## Status
| Phase | State | Agent | Files | Commit |
|---|---|---|---|---|
| 3. Auth middleware | merged | Dev-3 | middleware/auth.js | e19af02 |
| 5. Rate limiting | review | Dev-5 | services/rateLimiter.js | — |

## Decisions (settled)
- 2026-03-12: merge convention: FF to main; deploy: npm run deploy; checks: npm test

## Learnings (cumulative)
- Redis cache uses `user:{id}:session` key scheme (TTL 30min)
- Rate limiter must exempt /health — `services/rateLimiter.js:88`
```

Every learning, decision, and file reference lives in one document that is always current.

Self-reported state drifts, so the board gets audited. `scripts/board-check.js` ships with the plugin and verifies every claim against git: merged phases must point at commits that exist and are actually on the integration branch, the progress count must match the table, the ship SHA must be on origin, and an "open" door must appear in `git worktree list`. It runs at resume, after every merge window, and before completion.

```
$ node scripts/board-check.js api-migration
  ❌ FAIL: "Phase 3": commit 9f3ab12 is NOT on main — state says merged
  ✖ 1 failure(s) — the board does not match git truth.
```

When that happens, the agent fixes the board from git evidence before it dispatches anything else.

## The tier doctrine

Every model goes where it earns its cost. The strongest available model orchestrates and is never downgraded and never allowed to keep judging after compaction. Dev agents run one tier down; their depth comes from focus (one phase, owned files), not from raw model size. Rote lanes like renames and boilerplate go two tiers down at low effort. Review gates run at high effort, and the riskiest surfaces (security, data loss, auth) get reviewed by the orchestrator's own model.

As of the Claude 5 family that maps to: Fable orchestrates, Opus develops, Sonnet and Haiku take the rote lanes.

## Fresh sessions beat compaction

Harness compaction keeps a session alive, but it silently blurs the things a scrum master exists to hold: decisions, ownership boundaries, verdicts. So v2 works in shifts. A session runs sprints until it reaches a clean boundary (batch integrated, board current) while it's still sharp, then ends on purpose. The next session resumes from two reads with full acuity. Waiting for a compression signal is already too late, and the skill says so explicitly.

## The token economy

| Rule | Practice |
|:---|:---|
| Delegate the noise | The orchestrator never reads implementation files; agents return short structured reports |
| One-read resume | BOARD.md is the only state file. The handoff pile is gone |
| Cache alignment | Front-load reads, batch tool calls, keep orchestrator turns short and stable |
| Reuse warm agents | Fixes go to the agent that wrote the code, not a fresh spawn |
| Tier doctrine | Strongest model orchestrates, one tier down develops, rote lanes go two tiers down |
| Kill rework | Acceptance criteria travel in every dispatch; review gates run before every merge |
| Fresh sessions | Shifts end at board boundaries; resume costs two reads |

---

## Post-delivery maintenance

Plan complete? The skill stays useful. When bugs surface later:

```
/justkeepswimming:go my-feature
> "That plan is complete. Maintenance mode?"
```

It restores context from SUMMARY.md, applies the Thinking Protocol to the investigation, fixes the root cause only, and writes a maintenance log with the steps, changes, and verification. If the request turns out to be bigger than a targeted fix, it says so and offers a follow-up plan instead of forcing a refactor through a bug-fix workflow.

## The Thinking Protocol

Most agents pattern-match to common fixes and try them one at a time until something sticks. The Thinking Protocol replaces guessing with verification:

| # | Principle |
|:-:|:----------|
| 1 | Diagnose before you prescribe |
| 2 | Trace the full chain |
| 3 | Check what's actually there, not what you expect |
| 4 | Know the silent failures |
| 5 | Minimum effective intervention |
| 6 | Resist "the usual fix" |

The meta-rule: every condition required for success must be verified, and the one you skip is the one that's broken. v2 adds the Orchestrator's Corollary for scrum-lane work: delegate the noise, keep the signal. Details in [`THINKING.md`](THINKING.md), which you can extend with your own team's debugging lessons.

---

## Directory structure

```
your-project/
└── docs/justkeepswimming/
    ├── api-migration/
    │   ├── PLAN.md                        # Phases + acceptance criteria + dependencies
    │   ├── BOARD.md                       # Live state, always current, git-audited
    │   ├── SUMMARY.md                     # Architecture overview + next steps
    │   ├── 2026-03-15-maintenance-001.md  # Post-delivery fix log
    │   └── archive/                       # Legacy handoffs, review scratch
    ├── fix-invoice-rounding/
    │   └── LITE.md                        # Half-day job: goal, checklist, outcome
    └── night-build/
        └── 2026-03-14-night-build.md      # Build report
```

Plain markdown plus one small script. Commit them, branch them, `git blame` them.

## Comparison

| | Just Keep Swimming | Heavy workflow systems |
|:---|:---|:---|
| Files | 2 commands, 1 methodology doc, 1 audit script | 30+ files with state tracking |
| State | One live board per plan, verified against git | STATE.md, ROADMAP.md, CONTEXT.md, ... |
| Concepts | Plan, Board, Sprint, Merge window | Projects, Milestones, Phases, Waves, Audits |
| Parallelism | File-ownership lanes, review gates, one git owner | Usually none, or unmanaged |
| Setup | Install the plugin or copy two files | Plugin plus configuration plus a learning curve |

## Dependencies

Claude Code, any recent version. Subagent support (the Agent tool) unlocks the scrum lane; without it the solo and lite lanes still work everywhere. The optional superpowers plugin adds auto-generated plans via `superpowers:writing-plans`, but you can bring your own plan or use `--from-context`.

---

## FAQ

<details>
<summary><strong>What happened to handoff documents?</strong></summary>
The live board replaced them. v1 plans with handoff piles migrate automatically: the first v2 session synthesizes BOARD.md from them once, archives the pile, and never reads it again. Resume is two file reads from then on.
</details>

<details>
<summary><strong>Do parallel agents conflict with each other?</strong></summary>
No. Each phase owns a disjoint set of files, shared registries are edited only by the orchestrator at merge windows, and only the orchestrator runs git. Conflicts are prevented structurally rather than resolved after the fact.
</details>

<details>
<summary><strong>What stops the board from lying?</strong></summary>
<code>scripts/board-check.js</code>. It verifies commit existence and branch ancestry for every merged phase, the progress count, the ship SHA, and the door state against <code>git worktree list</code>. A failing check blocks dispatch until the board matches git.
</details>

<details>
<summary><strong>Can I use this without subagent support?</strong></summary>
Yes. The solo lane executes inline with the same board, review discipline, and completion flow. <code>--solo</code> forces it, and <code>--lite</code> covers half-day jobs with even less ceremony.
</details>

<details>
<summary><strong>My project allows only one subagent at a time. Does v2 still work?</strong></summary>
Yes. A concurrency cap beats the fan-out: the sprint runs as a serial queue, one dev or one reviewer at a time, and each reviewed phase is committed before the next one starts. You keep the phases, the review gates and the board. You lose only the parallel speed.
</details>

<details>
<summary><strong>What happens when the plan is complete?</strong></summary>
A completeness critic hunts for gaps first: unmet acceptance criteria, unwired registrations, missing tests or docs. After the ship, a verifier drives the live feature the way a user would (real create, edit and delete, desktop and phone widths) and cleans up its test data, because green tests with mocked storage can still hide a crash. Fixes go through the same gate and get re-verified. Then SUMMARY.md gets an Outcome section, the folder is cleaned, the worktree is closed out, and you get an offer to turn the recommendations into a follow-up plan.
</details>

<details>
<summary><strong>Can I have multiple active plans?</strong></summary>
Yes. Each plan has its own directory, board, and open door. Bare <code>go</code> shows all of them and resumes the most recently active; name a plan to switch.
</details>

---

<p align="center">
  <a href="LICENSE">Apache 2.0</a> &middot; Made by <a href="https://github.com/cyber-qais">Qais Alkurdi</a>
</p>
