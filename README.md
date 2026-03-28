# Just Keep Swimming

A lightweight plan management plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that prevents context rot during multi-phase implementations.

## The Problem

AI coding agents lose context during long sessions. When a conversation hits ~80% of the context window, the system compresses earlier messages — and nuanced details get lost: architecture decisions, data structure shapes, cache key schemes, edge cases discovered during execution. The agent continues working but makes subtly wrong decisions because it's forgotten critical context from earlier in the session.

You notice this when:
- The agent re-asks questions it already resolved
- Implementations drift from earlier architectural decisions
- Fixes break things that were working because the agent forgot why they were built that way
- You have to re-explain project context every new session

## The Solution

**Just Keep Swimming** adds two commands to Claude Code:

### `/justkeepswimming:go` — Plan Management & Execution

Manages four things:
1. **Plan creation** — structured implementation plans stored in your repo (from scratch, from conversation context, or imported)
2. **Continuous execution** — works through the plan phase by phase
3. **Smart handoffs** — before context gets stale, captures everything a future agent needs to continue seamlessly
4. **Completion summaries** — when done, generates a polished summary with architecture overview and prioritized next steps

### `/justkeepswimming:night-build` — Autonomous Build Pipeline

End-of-day pipeline that autonomously:
1. Reviews recent commits and ensures nothing was missed
2. Verifies end-to-end wiring across all layers of the stack
3. Performs code review for obvious issues and fixes them
4. Checks syntax across changed files
5. Runs the test suite
6. Builds and deploys the application
7. Writes a comprehensive summary
8. Self-reviews the summary
9. Commits and pushes to git

**Adapts to your project.** Reads your CLAUDE.md and project structure to understand your architecture, deployment procedure, process manager, and notification mechanisms. Executes only what applies.

## The Thinking Protocol

Most AI agents fail not because they lack capability, but because they **think wrong**. They pattern-match to common fixes and try them one by one. When the first attempt fails, they try the next most common fix. When that fails, they cycle.

Just Keep Swimming ships with a **Thinking Protocol** — six problem-solving principles injected into every agent session:

1. **Diagnose before you prescribe** — gather facts before forming hypotheses
2. **Trace the full chain** — list every condition for success and verify each one
3. **Check what's actually there** — read output with an open mind, don't confirm assumptions
4. **Know the silent failures** — systems fail without useful errors; find the silent one
5. **Minimum effective intervention** — fix the root cause and only the root cause
6. **Resist "the usual fix"** — if it's been tried, the answer is in a layer nobody checked

The core insight: **Don't be a solution-guesser. Be a condition-verifier.**

The full methodology lives in [`THINKING.md`](THINKING.md).

## Installation

### As a Plugin (recommended)

```bash
# In Claude Code:
/plugin marketplace add cyber-qais/justkeepswimming
/plugin install justkeepswimming
```

### Manual Installation

#### User-level (available in all your projects)

```bash
mkdir -p ~/.claude/commands/justkeepswimming
cp commands/justkeepswimming/go.md ~/.claude/commands/justkeepswimming/
cp commands/justkeepswimming/night-build.md ~/.claude/commands/justkeepswimming/
```

#### Project-level (available to all contributors)

```bash
mkdir -p .claude/commands/justkeepswimming
cp commands/justkeepswimming/go.md .claude/commands/justkeepswimming/
cp commands/justkeepswimming/night-build.md .claude/commands/justkeepswimming/
```

The commands are available immediately in any Claude Code session within scope.

## Usage

### Start a new plan

```
/justkeepswimming:go
```

You'll be asked for a plan name, then whether to create a plan or import your own. Plans are saved to `docs/justkeepswimming/{plan-name}/PLAN.md`.

### Resume an existing plan

```
/justkeepswimming:go microservice-separation
```

Reads all previous handoff documents, restores context, and continues from where the last session left off.

### Interactive mode

```
/justkeepswimming:go microservice-separation --interactive
```

Pauses after each phase for your review. You decide when to continue, handoff, or adjust the plan.

### Build a plan from conversation context

```
/justkeepswimming:go my-feature --from-context
```

Already been discussing requirements or architecture? This distills the current conversation into a structured plan, shows you the outline, and asks to confirm before executing.

### Skip all confirmations

```
/justkeepswimming:go my-feature --now
```

Synthesizes a plan from conversation context AND starts executing immediately. No pauses, no confirmations — just go.

### Force a handoff

Say "handoff" at any point during execution to trigger the handoff protocol immediately.

### Night build

```
/justkeepswimming:night-build
```

Fully autonomous end-of-day pipeline. Adapts to your project by reading CLAUDE.md and project structure. Reviews commits, code reviews, builds, deploys, writes a summary, and pushes to git. No prompts, no confirmations.

## Flags Reference

| Flag | Effect |
|------|--------|
| *(none)* | Autonomous execution. Asks how to create the plan. |
| `--interactive` | Pause after each phase for user review. |
| `--from-context` | Synthesize PLAN.md from the current conversation. Shows outline for confirmation. |
| `--now` | Implies `--from-context`. Synthesize + execute immediately, zero pauses. |

Flags combine: `--now --interactive` synthesizes immediately but pauses between phases.

## How It Works

### Directory Structure

```
docs/justkeepswimming/{plan-name}/
├── PLAN.md                       # Implementation plan (created once)
├── 2026-03-12-handoff-001.md     # Session 1 handoff
├── 2026-03-13-handoff-002.md     # Session 2 handoff
├── 2026-03-14-handoff-003.md     # Final handoff (marked COMPLETE)
└── SUMMARY.md                    # Architecture overview & next steps (completion marker)
```

**SUMMARY.md doubles as a completion marker.** If it exists, the plan is considered complete.

### The Handoff Protocol

When context health deteriorates (or when you say "handoff"), the agent creates a handoff document **while it still has full context**. Each handoff includes:

| Section | Purpose |
|---------|---------|
| **Progress** | X of Y phases complete (~N%) |
| **Completed This Session** | What was done with exact `file:line` references |
| **Remaining Work** | What's left from the plan |
| **Blockers & Open Questions** | Issues that need human input |
| **Plan Amendments** | Where reality diverged from the plan |
| **Key Learnings** | Architecture insights, data shapes, edge cases from this session |
| **Cumulative Context** | Condensed knowledge from ALL prior sessions |
| **Next Session** | Exactly what to read first and what to focus on |

### Cumulative Context

This is the key innovation. Each handoff carries a "Cumulative Context" section that condenses ALL prior sessions' learnings into one place. A future agent reads ONE handoff and gets everything it needs.

Session 1 discovers the cache key scheme. Session 2 discovers an edge case in the auth flow. Session 3's handoff has BOTH in its Cumulative Context section, condensed and merged. No knowledge is lost across sessions.

### Context-Aware Session Budgets

The skill detects your context window size and sets hard limits:

| Context Window | Max Phases/Session |
|---|---|
| Standard (~200k) | 2 |
| Extended (1M) | 5 |

When you hit your budget, the agent hands off. No negotiation, no "just one more thing."

### Post-Delivery Maintenance

Completed plans can be maintained with structured debugging:
- Bug reports and change requests are handled through a diagnose-before-prescribe protocol
- Every maintenance session produces a maintenance log
- Changes are cross-referenced against the original plan
- If the scope exceeds a targeted fix, the skill recommends creating a new plan

## Comparison to GSD

| | Just Keep Swimming | GSD |
|---|---|---|
| **Files** | 2 command files + 1 methodology doc | 30+ files, workflows, state tracking |
| **State tracking** | Handoff documents only | STATE.md, ROADMAP.md, CONTEXT.md, PLAN.md, SUMMARY.md |
| **Concepts** | Plan, Execute, Handoff | Projects, Milestones, Phases, Waves, Plans, Verification, Audits |
| **Agent spawning** | None | Planners, Executors, Verifiers, Researchers, Auditors |
| **Setup** | Install plugin or copy 2 files | Plugin installation + configuration |
| **Best for** | Single-track implementation work | Large projects with many parallel workstreams |

## Dependencies

- **Claude Code** (any recent version)
- **superpowers plugin** (optional — only needed if you want auto-generated plans via `superpowers:writing-plans`)

If you don't have superpowers installed, you can still use Just Keep Swimming by importing your own plans or using `--from-context`.

## Customizing the Thinking Protocol

The methodology lives in [`THINKING.md`](THINKING.md). You can edit it to add domain-specific principles, team conventions, or lessons learned from your own debugging sessions. The commands reference it inline via `<thinking-protocol>` directives.

## FAQ

**Q: What if I forget to say "handoff"?**
In autonomous mode, the agent monitors its own context health and creates handoffs automatically.

**Q: Can I use this without the superpowers plugin?**
Yes. When creating a new plan, choose "import" instead of "create", or use `--from-context` to synthesize from your conversation.

**Q: What happens when the plan is complete?**
The agent creates a final summary handoff marked COMPLETE, generates `SUMMARY.md` with architecture overview and prioritized next steps, then asks if you want to turn those recommendations into a new plan.

**Q: Can I have multiple active plans?**
Yes. Each plan lives in its own directory under `docs/justkeepswimming/`.

**Q: Does the night-build work with any project?**
Yes. Phase 0 discovers your project's structure, tech stack, deployment procedure, and process manager. It only executes phases that apply to your project.

**Q: Does this work with git?**
Plans and handoffs are plain markdown files in your repo. Commit them, branch them, share them — they're just files.

## License

See [LICENSE](LICENSE).
