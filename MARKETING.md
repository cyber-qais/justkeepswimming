# Just Keep Swimming

### Your AI agent doesn't need a better memory. It needs a scrum master.

---

You hand Claude Code a nine-phase plan at 6pm. You check in the next morning and it's on phase 2, politely asking a question it already answered itself around midnight. Somewhere in between, the context window filled up, the early decisions got compressed into fog, and the agent kept going anyway, slower and dumber with every phase.

The first version of Just Keep Swimming attacked that problem with handoff documents: write everything down before you forget it. It worked, and thousands of installs later the pattern held up. But it treated the symptom. The agent still executed one phase at a time, still burned its own context reading source files, and still stopped after two phases because a hard budget said so. The handoff pile grew with every session, and each resume read all of it.

v2 treats the cause.

---

## One agent coordinates. Many agents build.

```
/justkeepswimming:go my-feature
```

In v2, the session you're talking to stops being a developer and becomes a scrum master. It reads the plan, works out which phases are independent, and dispatches parallel dev agents, each one owning its own set of files. The orchestrator never opens a source file itself. It reads two things: the plan and the board. Its context holds decisions, not file dumps.

That single change is why one session can now supervise ten phases instead of executing two.

The agents don't step on each other because they can't. File ownership is assigned per sprint and is disjoint by construction. Shared files like route tables and manifests are touched only by the orchestrator, at merge time. And only the orchestrator runs git, which removes the whole category of two-agents-commit-at-once disasters.

## The door stays open

Most agent workflows treat integration as a ceremony: finish everything, then merge, then tear down, then start over for the next batch. v2 keeps one workspace open for the life of the plan. When a phase passes review, the orchestrator dispatches the next sprint first and merges second, so development and integration overlap. Finished work ships while unfinished work is still being written. Nobody waits, and nothing gets hoarded for a big-bang merge at the end.

## Reviewed before merged, every time

Every phase goes through an adversarial review gate before its merge window. Real findings go back to the same agent that wrote the code, because that agent's context is warm and a fresh one would start from zero. Two failed review rounds and the phase gets parked on the board for a human instead of looping forever.

Rework that escapes into a later sprint is the most expensive thing in agent-driven development. The gate exists to catch it while it's still cheap.

## The board replaces the handoff pile

Each plan keeps one live document, BOARD.md: phase states, commit SHAs, settled decisions, accumulated learnings, open blockers. It's updated at every sync point, not at session end, so a crash loses one sprint at most. Resuming a plan means reading two files, whether it's session 2 or session 20.

And because self-reported state drifts, the board gets audited. A zero-dependency script that ships with the plugin checks it against git itself: a phase marked merged must point at a commit that exists and is actually on the integration branch, the progress count must match the table, and a door marked open must appear in `git worktree list`. If the board lies, the agent has to fix it from git evidence before it's allowed to dispatch anything else.

```
$ node scripts/board-check.js api-migration
  ❌ FAIL: "Phase 3": commit 9f3ab12 is NOT on main — state says merged
```

## Fresh sessions beat compaction

When a long session's context gets compacted, the loss is silent. The agent doesn't know what it forgot, and neither do you, until it makes a call that contradicts a decision from four hours ago. So v2 works in shifts: run sprints until a clean boundary, update the board, end the session on purpose, resume fresh. A new session with a current board has full acuity. A compacted one just has confidence.

## The right model for each seat

v2 assigns models the way you'd staff a team. The strongest model available runs the orchestrator seat and never gets downgraded. Dev agents run one tier down; their depth comes from owning one phase and a handful of files, not from model size. Renames and boilerplate go two tiers down at low effort. Review gates run at high effort, and anything touching security or data loss gets reviewed by the orchestrator's own model. With the Claude 5 family, that means Fable coordinates while Opus builds and Sonnet handles the grunt work, each one earning its cost.

## Sized to the job

Not everything deserves a board. A half-day fix runs in the lite lane: one LITE.md file with a goal, a checklist, and an outcome, executed inline with a single review gate at the end. If the "small fix" turns out to be systemic, the skill graduates it to a full plan rather than stretching a one-file workflow across sessions.

And when you come back after a few days and can't remember what was in flight, just run the command bare. It prints a one-line status for every plan and resumes the most recent active one. `go status` gives you the table and stops there.

## There's also a night shift

`/justkeepswimming:night-build` is the end-of-day sweep: it baselines against the last run, fans out parallel reviewers over the day's commits, fixes what it's confident about, defers what it isn't (with file and line references), runs your tests, ships through your project's own release path, and writes a summary for the morning. A day with no commits produces a one-line report. That's a feature.

## Still light

Two command files, one methodology doc, one audit script. State is markdown in your repo, plus git, which you already have. No daemons, no databases, no configuration wizard. The Thinking Protocol that made v1 agents debug like senior engineers is still injected into every session, and you can still extend it with your own team's hard-won lessons in THINKING.md.

---

**Works with any Claude Code project.** Subagent support unlocks the scrum lane; without it, the solo and lite lanes run everywhere. Pairs well with the superpowers plugin for plan generation, or bring your own plan.

Apache 2.0 License. [GitHub](https://github.com/cyber-qais/justkeepswimming) · [npm](https://www.npmjs.com/package/justkeepswimming)
