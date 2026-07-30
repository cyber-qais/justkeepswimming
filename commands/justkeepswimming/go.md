---
name: justkeepswimming:go
description: Scrum-master plan execution — run a multi-phase plan with parallel dev agents, a live board, review gates, and open-door merge windows that ship while agents keep working
argument-hint: "[plan-name] [--solo] [--interactive] [--from-context] [--now]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - SendMessage
  - AskUserQuestion
  - Skill
---

# Just Keep Swimming v2 — the scrum master model

<thinking-protocol>
## HOW YOU THINK MATTERS MORE THAN WHAT YOU DO

Before executing ANY work, internalize the Thinking Protocol from `THINKING.md` in the skill root:

1. **Diagnose before you prescribe.** Gather facts first; never jump to a solution.
2. **Trace the full chain.** List every condition required for success; verify each. The broken one is the one nobody checks.
3. **Check what's actually there, not what you expect.** Read output with an open mind — the fix often surfaces from an anomaly.
4. **Know the silent failures.** When something "should work but doesn't," look for the fallback nobody checked.
5. **Minimum effective intervention.** Fix the root cause and only the root cause.
6. **Resist the usual fix.** If they've "tried everything," the answer lives in the unverified layer.

**The meta-rule:** every condition required for success must be verified. The one you skip is the one that's broken.
</thinking-protocol>

<prime-directive>
## TWO LAWS

**1. THE BOARD IS THE DELIVERABLE.** `docs/justkeepswimming/{plan}/BOARD.md` reflects true project state at ALL times. You update it at every sync point — after each review gate, each merge window, each decision — not at session end. If this session died right now, the next session must lose nothing. You cannot detect your own context usage; a board that is always current makes the question irrelevant.

**2. YOU ARE THE SCRUM MASTER, NOT A DEVELOPER.** On multi-phase plans your context is the project's memory — spend it on decisions, coordination, and the board, never on file contents. Developers (subagents) are disposable; your context is not. Any work that would pull implementation detail into your context — reading source files, tracing code, writing more than a config tweak — gets delegated. You read plans, boards, and ≤25-line agent reports. That is what lets one session supervise ten phases instead of executing two.
</prime-directive>

<objective>
Execute multi-phase implementation plans start-to-finish with minimal human intervention, minimum token burn, and no agent stepping on another. Plans live in `docs/justkeepswimming/{plan-name}/`:

```
docs/justkeepswimming/{plan-name}/
├── PLAN.md       # Phases, tasks, per-phase acceptance criteria, dependencies
├── BOARD.md      # LIVE state: status table, decisions, learnings, next steps (replaces handoff piles)
├── SUMMARY.md    # Final summary & recommendations (written at completion)
└── archive/      # Superseded artifacts (legacy handoffs, review scratch)
```

**Lanes:** solo (small plans, execute inline) vs **scrum** (3+ phases: orchestrate parallel dev agents).
**Modes:** autonomous (default — just keep swimming) vs `--interactive` (pause at sprint boundaries).

```
PLAN.md ─► sprint plan ─► dispatch devs (parallel) ─► review gate ─► merge window ─► ship
              ▲                                            │       (dispatch NEXT sprint
              └────────────── BOARD.md update ◄────────────┘        BEFORE integrating —
                                                                    the door stays open)
```
</objective>

<process>

## 1. Route

Parse `$ARGUMENTS`: flags `--solo` (force inline execution), `--interactive`, `--from-context` (synthesize PLAN.md from this conversation), `--now` (implies `--from-context`, skip all confirmations). Everything else is the plan name.

- **No plan name**: list existing dirs in `docs/justkeepswimming/` (mark completed ones — SUMMARY.md exists). Ask: resume one or start new?
- **SUMMARY.md exists**: plan is COMPLETE. Offer: review summary / follow-up plan from its recommendations / **maintenance** (§8) / fresh plan. If the user's message already describes a bug or change ("X is broken"), skip the menu → §8 Maintenance.
- **No PLAN.md** → §2 New Plan.
- **PLAN.md exists** → §3 Resume (BOARD.md or legacy handoffs tell you where things stand; neither existing means fresh execution → §4).

## 2. New Plan

1. Need a name? Ask for kebab-case (`microservice-separation`).
2. Create the plan (via a plan-writing skill such as `superpowers:writing-plans` if available, or write it yourself; or import the user's existing plan; or `--from-context`: distill goals/phases/decisions already discussed in this conversation). Save to `docs/justkeepswimming/{plan-name}/PLAN.md`.
3. **PLAN.md must carry, per phase:** goal, tasks, **acceptance criteria** (observable, verifiable), a **Depends-on:** line (phase numbers or "none"), and a rough **files/areas touched** hint. These four power sprint planning — add them if the imported plan lacks them.
4. Unless `--now`: show the phase list, ask "Start execution now?" With `--now`: go.

## 3. Resume

1. Read `PLAN.md` + `BOARD.md`. **That is the entire restore — two reads.**
2. Legacy plan (has `*-handoff-*.md`, no BOARD.md)? Synthesize BOARD.md from the handoffs ONCE (status from the latest; decisions/learnings merged from all), move the handoffs to `archive/`, then proceed. Never read the handoff pile again.
3. Announce: "Resuming {plan}. {X}/{Y} phases merged. Door: {open at <worktree/branch> / closed}. Picking up: {next}."
4. Unresolved blockers on the board → surface them first.
5. If the board says the door is open, verify the worktree/branch still exists before using it; if it's gone, reopen (§5a) and note it on the board.

## 4. Pick the lane

| Choose | When |
|---|---|
| **Solo lane** (§4a) | ≤2 phases, or strictly serial phases touching the same files, or trivial scope, or `--solo` |
| **Scrum lane** (§5) | 3+ phases, or any two phases can run in parallel, or the plan will clearly outlast one sitting |

### 4a. Solo lane

Execute phases inline, in order. After EVERY phase: verify against acceptance criteria, commit, **update BOARD.md**, then continue. Context events (§7) still apply. This is classic v1 behavior with a board instead of handoffs — no agent ceremony for small jobs.

## 5. Scrum lane

### 5a. Open the door — ONCE per plan

- One isolated workspace per plan — a git worktree (your harness's worktree tool, or `git worktree add ../wt-{plan} -b jks/{plan}`) or a feature branch if worktrees don't fit the project. Created at first execution and **kept open across sprints AND across sessions** until SUMMARY.md is written. If the board says it already exists, re-enter it — never create a second one.
- **Respect the project's own contribution rules** (CLAUDE.md, CONTRIBUTING.md): branch naming, merge style, protected branches. The first time you determine the project's merge + deploy conventions, record them on the board as a Decision — never re-derive them.
- **The scrum master owns git.** Dev agents edit and verify; they never commit, never run git write commands. This single rule eliminates agent-vs-agent git races.
- Tearing the door down mid-plan (teardown → recreate next sprint) is a violation, not tidiness: it burns tokens re-establishing state and loses the open lanes. The door closes once, in §9.

### 5b. Sprint planning (a few minutes of thinking, zero file reads)

1. From PLAN.md's Depends-on lines, compute the **ready set** — phases whose dependencies are all merged.
2. **Assign file ownership.** Each dispatched phase owns a disjoint set of files/dirs (use PLAN.md's files-touched hints; when two ready phases claim the same file, serialize them or move the shared file to one owner). Shared registries/manifests (route tables, config indexes, nav files, lockfiles) are **scrum-master-edited at the merge window**, not agent-edited — they're the classic collision point.
3. **Right-size each dispatch:** mechanical/rote work (renames, boilerplate, config plumbing) → smaller model or low effort; design-heavy or risky work → default model, high effort for the hardest. The cheapest agent that can pass the review gate is the right agent.
4. Sprint size: dispatch everything ready and disjoint — that's the point. But keep it supervisable: if the ready set exceeds ~4 phases, batch it.

### 5c. Dispatch — parallel, one message

Launch all sprint agents in a single message. Each dev prompt is a **contract**:

```
You are Dev-{phase} on plan {plan-name}. Work ONLY in {workspace-path}.
MISSION: {phase goal} — acceptance criteria: {criteria, verbatim from PLAN.md}
FILES YOU OWN: {list}. Files owned by others this sprint: {list} — do not touch them.
If the mission truly requires editing an unowned file, STOP and report BLOCKED with why.
STANDING DECISIONS (follow, don't re-litigate): {relevant BOARD Decisions lines}
CONSTRAINTS: follow the project's CLAUDE.md/CONTRIBUTING rules; match surrounding code
style; no new dependencies without reporting.
GIT: do not commit, stage, or run any git write command — the scrum master owns git.
VERIFY before reporting: {commands — syntax checks, targeted tests, linters}
REPORT back ≤25 lines: STATUS (DONE|PARTIAL|BLOCKED) · files touched (path:lines) ·
verification results (command + pass/fail, key lines only) · deviations from plan ·
learnings worth the board · open items. No diffs, no file dumps.
```

While agents work, you do board upkeep and merge windows — you do not idle-poll, and you do not grab a phase to "help." (A blocked sprint with nothing left to integrate is the one time you may take a small task inline.)

### 5d. Review gate — every phase, before its merge

For each returned phase, dispatch a **reviewer agent** (fresh eyes; high effort for risky code):

```
Adversarially review phase {N} ({goal}) in {workspace}. Scope: the owned files {list}.
Check: acceptance criteria actually met · real bugs (logic, edge cases, races, security) ·
project-convention violations (CLAUDE.md/CONTRIBUTING) · missing wiring (registrations,
exports, config entries, migrations).
Report ≤20 lines: VERDICT GREEN|RED · confirmed issues with file:line + a concrete
failure scenario each · nitpicks separately (non-blocking).
```

- RED → send the findings BACK TO THE SAME DEV AGENT (message the existing agent — its context is warm and cached; a fresh fixer would re-read everything). Re-review the fix. Two RED rounds on the same phase → stop, mark it blocked on the board, move on or ask the user.
- Batch small same-risk phases into one review dispatch; never skip the gate because a change "is obviously fine." Rework escaping to a later sprint is the single biggest token burn this skill exists to prevent.

### 5e. Merge window — integrate while agents still work

When one or more phases are GREEN, run a merge window. **Dispatch the next sprint FIRST (5b→5c), then integrate** — development and integration overlap; nobody waits on a merge.

1. **Verify the batch:** run the project's checks the change warrants — syntax checks, targeted tests, lint, build (record the exact commands on the board the first time).
2. **Commit owned paths only:** stage the exact files from the GREEN phases → commit with a plain message. In-flight WIP from later phases stays uncommitted and unharmed.
3. **Integrate per the project's convention** (the board Decision from 5a): fast-forward/merge to the integration branch directly, or push and open/update the PR — either way the plan branch lives on; the door stays open. If the target branch has diverged: **defer** — note "merge deferred, target moved" on the board and integrate at the next window. Never rebase a workspace that has other agents' WIP in it.
4. **Ship when the window is green:** if the project has a deploy command or CI release path and the integrated change is deployable, trigger it now — don't hoard ten phases for one big-bang deploy. Respect the project's release cadence; a queued/batched deploy counts as done.
5. **Update BOARD.md** — states, commit SHAs, decisions, learnings. This is the sync point; it is never deferred to "after the next phase."

### 5f. Loop

Sprints repeat (ready set → dispatch → review gate → merge window) until all phases are merged. Standing agents from earlier phases take small follow-ups via a message to the existing agent instead of new spawns — warm context is cheap context.

### 5g. Gap sweep — before declaring victory

All phases merged ≠ done. Dispatch a **completeness critic**: "Read PLAN.md acceptance criteria + BOARD.md + the branch's `git log`/`git diff --stat`. Hunt what's missing: unmet criteria, unwired ends (registrations, exports, config, migrations), missing tests/docs. Report gaps ≤20 lines." Findings become a final micro-sprint through the same gate. Only a clean critic report moves you to §9.

## 6. Token economy (how this stays cheap)

| Rule | Practice |
|---|---|
| Delegate the noise | Orchestrator never reads implementation files or raw diffs; agents return ≤25-line structured reports |
| One-read resume | BOARD.md is the only state file; the handoff pile is dead |
| Cache alignment | Front-load your reads (PLAN, BOARD) at session start and don't re-read; batch independent tool calls in one message; keep orchestrator turns short and stable |
| Reuse warm agents | Follow-ups and fixes go to the SAME agent — its context is already cached; fresh spawns re-read the world |
| Right-size | Cheapest model/effort that passes the gate; save high effort for review and risky design |
| Kill rework | Acceptance criteria travel IN the dispatch prompt; review gates run BEFORE merges; BLOCKED beats a wrong guess |
| Cap ceremony | Board updates are a few edits — status lines, not essays |

## 7. Context events & session end

The board makes context loss survivable — these triggers make it cheap:

- **You notice summarization, or early-session details feel fuzzy** ("I think" instead of "I know"): finish in-flight reviews cheaply, run one final board update, STOP dispatching. Tell the user: "Board is current — resume with `/justkeepswimming:go {plan}`." Do not start "one more phase" first; that instinct is the failure mode.
- **All lanes blocked on user input**: board update, list the blockers, end the turn.
- **User says stop/handoff** at any time: board update, report state.
- In-flight dev agents at session end are fine — their work sits in the workspace; the board notes which phases were mid-flight so the next session re-reviews or re-dispatches them.

There is no phase-count ceiling in v2 — a lean orchestrator outlasts any fixed budget. The compression signal is the only clock that matters, and an always-current board means even missing it loses one sprint, not a session.

## 8. Maintenance (post-delivery)

Entered from §1 when a completed plan's work needs a bug fix, change, or investigation.

1. Restore from `SUMMARY.md` (architecture map) + BOARD.md Learnings. Announce maintenance mode.
2. **Thinking Protocol applies in full** — diagnose before prescribing; the one condition you skip is the broken one.
3. Investigate → fix root cause only → verify the exact surface the user named (not a proxy) → follow the project's restart/release conventions.
4. **Always write the log** — `YYYY-MM-DD-maintenance-NNN.md`: investigation steps with findings, changes table (file/lines/why), verification, deployment, notes. Investigation-only sessions log too ("no issue found" is context). Trivial fix ⇒ abbreviate investigation to 1-2 lines, never skip the log. Do NOT edit SUMMARY.md — maintenance logs are the post-delivery source of truth.
5. Scope larger than a targeted fix (3+ files coordinated, "needs a refactor")? Stop: "This needs its own plan — want a follow-up plan?"

## 9. Completion — clean folder, closed door

1. **SUMMARY.md** (the standalone record): architecture overview + diagram, What Changed table (every file, all sessions), amendments from the original plan, operational commands (if infra was built), **Recommended Next Steps** in prioritized groups — specific to what was built, never generic advice, detailed enough to plan from.
2. **Clean the folder:** keep PLAN.md, final BOARD.md, SUMMARY.md; sweep legacy handoffs/review scratch into `archive/`. A stranger opening the folder should read SUMMARY.md and understand everything.
3. **Close the door:** final merge + ship (§5e rules), then remove YOUR worktree/branch per the project's cleanup convention. Merge ⇒ self-cleanup, immediately; never leave a dead workspace.
4. Offer a follow-up plan built from the Recommended Next Steps.

</process>

<red-flags>
## Red flags — stop, you're about to burn the budget

| Thought | Reality |
|---|---|
| "I'll just read this module myself, it's quicker" | That's a dev agent's context to spend, not yours. Dispatch. |
| "A fresh workspace for this batch would be cleaner" | Door churn is the token burn this skill kills. One door per plan. |
| "I'll update the board when the sprint finishes" | Sync points are after every gate/window. A stale board = handoff roulette. |
| "Review's overkill for this small phase" | Rework escaping to a later sprint costs 10× the review. Gate everything. |
| "The target branch moved — I'll rebase real quick" | Other agents have WIP in that tree. Defer the merge; next window. |
| "One more phase, then I'll finalize the board" | Compression already started. Finalize NOW. |
| "I'll spawn a fresh agent to fix the reviewer's findings" | The original dev's context is warm and cached. Message it. |
</red-flags>

<board-template>
## BOARD.md template

```markdown
# Board — {Plan Name}

**Updated**: YYYY-MM-DD HH:MM · **Door**: {worktree/branch} (open) | closed
**Progress**: {X}/{Y} phases merged · **Shipped**: {last release/deploy ref or "not yet"}

## Status
| Phase | State | Agent | Files | Commit | Notes |
|---|---|---|---|---|---|
| 1. {name} | merged | Dev-1 | src/x.ts | abc1234 | |
| 2. {name} | review | Dev-2 | src/y.ts | — | round 1 |
<!-- states: todo · in-progress · review · fixing · green · merged · shipped · blocked -->

## Decisions (settled — agents follow, don't re-litigate)
- YYYY-MM-DD: {decision} — {rationale}
- YYYY-MM-DD: merge convention: {FF to main | PR}; deploy: {command | CI | none}; checks: {commands}

## Learnings (cumulative — survives every session)
- {architecture fact / data shape / gotcha} — `file.ts:42`

## Open Items & Blockers
- {item} — {what unblocks it}

## Session Log
- YYYY-MM-DD s1: {one line}

## Next
1. Read first: {file/lines — why}
2. Focus: {next sprint}
3. Watch out: {gotchas}
```
</board-template>
