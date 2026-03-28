<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Plugin-06b6d4?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge" alt="Apache 2.0" />
  <img src="https://img.shields.io/badge/Context-Rot_Proof-10b981?style=for-the-badge" alt="Context Rot Proof" />
</p>

<h1 align="center">Just Keep Swimming</h1>

<p align="center">
  <strong>Context-aware handoffs for Claude Code that prevent knowledge loss across sessions.</strong>
  <br />
  <a href="https://cyber-qais.github.io/justkeepswimming/">Landing Page</a> &middot; <a href="THINKING.md">Thinking Protocol</a> &middot; <a href="MARKETING.md">Why JKS?</a>
</p>

---

## The Problem

AI coding agents lose context during long sessions. When context compresses, nuanced details vanish — architecture decisions, data structures, edge cases. The agent keeps working but makes subtly wrong decisions.

> **Context compression is inevitable. Knowledge loss is not.**

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

## How It Works

```
 Session 1                    Session 2                    Session 3
 ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
 │                  │         │                  │         │                  │
 │  Execute         │         │  Read handoff    │         │  Read handoff    │
 │  Phase 1 ✓       │         │  (full context)  │         │  (full context)  │
 │  Phase 2 ✓       │         │                  │         │                  │
 │                  │         │  Execute         │         │  Execute         │
 │  Context heavy   │         │  Phase 3 ✓       │         │  Phase 5 ✓       │
 │  ┌─────────────┐ │         │  Phase 4 ✓       │         │  Phase 6 ✓       │
 │  │  HANDOFF    │─┼────────>│                  │         │                  │
 │  │  ·progress  │ │         │  Context heavy   │         │  ┌─────────────┐ │
 │  │  ·learnings │ │         │  ┌─────────────┐ │         │  │  COMPLETE   │ │
 │  │  ·context   │ │         │  │  HANDOFF    │─┼────────>│  │  SUMMARY.md │ │
 │  └─────────────┘ │         │  │  ·cumulative│ │         │  └─────────────┘ │
 └─────────────────┘         │  └─────────────┘ │         └─────────────────┘
                              └─────────────────┘
```

Each handoff captures **cumulative context** — condensed knowledge from ALL prior sessions merged into one section. Session 3's agent reads ONE document and knows everything sessions 1 and 2 discovered.

---

## Two Commands

### `/justkeepswimming:go` — Plan & Execute

| What it does | How |
|---|---|
| **Creates plans** | From scratch, from conversation context (`--from-context`), or imported |
| **Executes continuously** | Phase by phase, autonomous or interactive |
| **Hands off automatically** | Detects context health, writes handoff before degradation |
| **Resumes seamlessly** | Reads all prior handoffs, restores full context |
| **Maintains completed work** | Structured debugging with maintenance logs |

### `/justkeepswimming:night-build` — Autonomous Pipeline

| Phase | What happens |
|---|---|
| **Discover** | Reads CLAUDE.md, detects tech stack, deployment targets |
| **Review** | Scans last 12h of commits, checks end-to-end wiring |
| **Code Review** | Finds bugs, fixes HIGH-confidence issues |
| **Syntax Check** | Validates JS/TS, Python, Dart, Rust, Go |
| **Test** | Runs project test suite |
| **Build & Deploy** | Builds, deploys, restarts services, notifies users |
| **Summary** | Writes detailed report, self-reviews for gaps |
| **Commit & Push** | Stages, commits, pushes to git |

Fully autonomous. No prompts. Adapts to any project.

---

## Flags

```
/justkeepswimming:go [plan-name] [flags]
```

| Flag | Effect |
|:-----|:-------|
| *(none)* | Autonomous mode. Execute continuously, handoff automatically. |
| `--interactive` | Pause after each phase for review. |
| `--from-context` | Build plan from current conversation. |
| `--now` | `--from-context` + skip confirmations. Just go. |

Combine them: `--now --interactive` builds plan instantly, pauses between phases.

---

## What's In a Handoff?

```markdown
# Handoff — API Migration — Session 002

**Progress**: 4 of 6 phases complete (~67%)
**Handoff trigger**: 2 phases completed + context compression detected

## Completed This Session
- [x] Phase 3: Auth middleware — `middleware/auth.js:42-89`
- [x] Phase 4: Rate limiting — `services/rateLimiter.js:1-156`

## Key Learnings
- Redis cache uses `user:{id}:session` key scheme (TTL 30min)
- Auth tokens checked via middleware, NOT route-level

## Cumulative Context (All Sessions)
- API uses Express 4.x with router-level middleware
- Database: PostgreSQL via Knex, migrations in `db/migrations/`
- Session 1 discovered: connection pooling maxes at 20
- Session 2 discovered: rate limiter must exempt /health endpoint
```

Every learning, every decision, every file reference — preserved across sessions.

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

Customize by editing [`THINKING.md`](THINKING.md). Your team's hard-won debugging lessons get injected into every future session.

---

## Context-Aware Session Budgets

The skill detects your context window and enforces hard limits:

| Context Window | Max Phases | Why |
|:---|:---:|:---|
| Standard (~200k) | 2 | Each phase consumes significant context |
| Extended (1M) | 5 | More room, but still finite |

When budget is hit, the agent hands off. No negotiation, no "just one more thing."

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
| **State** | Handoff documents only | STATE.md, ROADMAP.md, CONTEXT.md, ... |
| **Concepts** | Plan, Execute, Handoff | Projects, Milestones, Phases, Waves, Audits |
| **Setup** | Copy 2 files or install plugin | Plugin + configuration + learning curve |
| **Best for** | Getting things done | Managing complex parallel workstreams |

---

## Directory Structure

```
your-project/
└── docs/justkeepswimming/
    ├── api-migration/
    │   ├── PLAN.md                    # The plan
    │   ├── 2026-03-12-handoff-001.md  # Session 1
    │   ├── 2026-03-13-handoff-002.md  # Session 2
    │   ├── 2026-03-14-handoff-003.md  # Final (COMPLETE)
    │   ├── 2026-03-15-maintenance-001.md  # Post-delivery fix
    │   └── SUMMARY.md                 # Architecture overview
    └── night-build/
        └── 2026-03-14-night-build.md  # Build report
```

Plain markdown files. Commit them, branch them, `git blame` them.

---

## Dependencies

- **Claude Code** (any recent version)
- **superpowers plugin** *(optional)* — for auto-generated plans via `superpowers:writing-plans`

No superpowers? Import your own plans or use `--from-context`.

---

## FAQ

<details>
<summary><strong>What if I forget to say "handoff"?</strong></summary>
Autonomous mode monitors context health and creates handoffs automatically. You don't need to do anything.
</details>

<details>
<summary><strong>Can I use this without the superpowers plugin?</strong></summary>
Yes. Import your own plan or use <code>--from-context</code> to synthesize from conversation.
</details>

<details>
<summary><strong>What happens when the plan is complete?</strong></summary>
The agent creates a final COMPLETE handoff, generates SUMMARY.md with architecture overview and next steps, then offers to turn recommendations into a new plan.
</details>

<details>
<summary><strong>Can I have multiple active plans?</strong></summary>
Yes. Each plan lives in its own directory under <code>docs/justkeepswimming/</code>.
</details>

<details>
<summary><strong>Does the night-build work with any project?</strong></summary>
Yes. Phase 0 discovers your stack, deployment procedure, and process manager. Only relevant phases execute.
</details>

<details>
<summary><strong>Does this work with git?</strong></summary>
Plans and handoffs are plain markdown files. Commit, branch, share — they're just files.
</details>

---

<p align="center">
  <a href="LICENSE">Apache 2.0</a> &middot; Made by <a href="https://github.com/cyber-qais">Qais Alkurdi</a>
</p>
