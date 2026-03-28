# Just Keep Swimming

### Your AI agent forgot what it was doing. Again.

---

You're three hours into a complex refactor with Claude Code. The agent has been brilliant — it found the right architecture, made smart trade-offs, built out two phases of your plan. Then the context window fills up.

The system compresses. And suddenly your agent is making decisions that contradict everything it figured out an hour ago. It re-asks questions you already answered. It breaks the caching layer it just built because it forgot *why* it was built that way.

**This is context rot.** And every developer using AI agents hits it eventually.

---

## One command. Zero context loss.

**Just Keep Swimming** is a single skill for Claude Code that solves context rot with a dead-simple approach:

> Before the agent forgets, make it write down everything it knows.

```
/justkeepswimming:go my-feature
```

That's it. The agent creates a plan, executes it phase by phase, and — here's the magic — **automatically creates detailed handoff documents before context degrades.** Every architecture decision. Every edge case discovered. Every file and line number touched. All preserved for the next session.

---

## How it works

**Session 1**: Agent works through phases 1-2 of your plan. Context getting heavy. It automatically writes a handoff capturing everything it learned — the Redis key scheme, the auth edge case, the cache TTL it chose and why.

**Session 2**: You run `/justkeepswimming:go my-feature`. Agent reads the handoff. Picks up exactly where session 1 left off. Knows everything session 1 knew. Completes phases 3-4. Writes another handoff.

**Session 3**: Same thing. Cumulative context from sessions 1 AND 2 is condensed into one section. The agent reads ONE document and has everything.

**No knowledge is ever lost.**

---

## Two modes for two workflows

### Autonomous *(default)*
The agent just keeps swimming. Executes continuously, creates handoffs on its own when context gets heavy. You come back to a completed plan or a clean handoff ready for the next session.

```
/justkeepswimming:go api-migration
```

### Interactive
Pauses after each phase. You review, adjust, redirect. The agent waits for your call.

```
/justkeepswimming:go api-migration --interactive
```

---

## What's in a handoff?

Each handoff document captures:

- **Progress** — "4 of 6 phases complete (67%)"
- **Completed work** — exact `file.js:42` references, not vague summaries
- **Remaining work** — what's left from the plan
- **Blockers** — issues that need human input (surfaced on resume)
- **Plan amendments** — where reality diverged and why
- **Key learnings** — architecture insights, data shapes, gotchas
- **Cumulative context** — condensed knowledge from ALL prior sessions
- **Next steps** — exactly which files to read first and what to focus on

---

## Agents that think, not just execute

Most AI agents fail the same way: they pattern-match to common fixes and try them one by one until something sticks. When a build fails, they retry. When a config doesn't work, they regenerate it. They're **solution-guessers** — and guessing doesn't scale.

Just Keep Swimming includes a **Thinking Protocol** — six principles injected into every agent session that fundamentally change how the agent approaches problems:

> **Don't be a solution-guesser. Be a condition-verifier.**

Instead of trying the top-5 StackOverflow answers, the agent lists every condition required for success and verifies each one. The broken condition reveals itself — no guessing needed.

This is how the best human engineers debug. Now your agent does it too.

The protocol is customizable. Add your team's hard-won debugging lessons to `THINKING.md` and every future session inherits them. Your agents get smarter over time — not because the model improved, but because your accumulated knowledge is injected into every session.

---

## Lightweight by design

No state files. No milestones. No roadmaps. No verification agents. No parallel planners.

**Just a plan, execution, and handoff documents.**

One command file. 200 lines. Install in 10 seconds:

```bash
mkdir -p ~/.claude/commands/justkeepswimming
cp go.md ~/.claude/commands/justkeepswimming/
```

Compare that to workflow systems with 30+ files and a learning curve.

---

## The key insight

> Context compression is inevitable. Knowledge loss is not.

The best time to document what you know is *before you forget it.* Just Keep Swimming forces that discipline — not through ceremony or process overhead, but through a single, automatic protocol that fires at the right moment.

Your agent doesn't fight the context window. It works *with* it.

---

**Works with any Claude Code project. No dependencies required.**

Pairs beautifully with the [superpowers plugin](https://github.com/anthropics/claude-code) for auto-generated plans, but you can bring your own plan too.

Apache 2.0 License.
