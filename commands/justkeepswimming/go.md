---
name: justkeepswimming:go
description: Scrum-master plan execution — run a multi-phase plan with parallel dev agents, a live board, review gates, and open-door merge windows that ship while agents keep working
argument-hint: "[plan-name|status] [--lite] [--solo] [--interactive] [--from-context] [--now]"
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

Lite plans (≤ half a day) use a single `LITE.md` instead of the trio — see §4b.

**Lanes:** lite (half-day work, one file, one gate) vs solo (small plans, execute inline) vs **scrum** (3+ phases: orchestrate parallel dev agents).
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

Parse `$ARGUMENTS`: flags `--lite` (half-day lane, §4b), `--solo` (force inline execution), `--interactive`, `--from-context` (synthesize the plan from this conversation), `--now` (implies `--from-context`, skip all confirmations). `status` alone → status report (below). Everything else is the plan name.

- **No plan name — orient, then keep swimming; don't interrogate:**
  1. Scan `docs/justkeepswimming/*/` and classify each plan from which files exist: **COMPLETE** (SUMMARY.md) · **ACTIVE** (BOARD.md or LITE.md, no SUMMARY.md) · **LEGACY-ACTIVE** (handoffs, no BOARD.md/SUMMARY.md) · **PLANNED** (PLAN.md only). Recency = the board's **Updated** line (file mtime as fallback).
  2. Print the one-line status table — from BOARD.md/LITE.md **header lines only** (Updated/Progress/Door/Next), never full-reading boards you aren't resuming:
     `{plan} · {state} · {X}/{Y} merged · door {open|closed} · updated {when} · next: {one-line focus}`
  3. Route:
     - **≥1 ACTIVE (or LEGACY-ACTIVE)** → auto-resume the most recently updated one via §3: "Continuing {plan} — most recent active. Name another plan to switch." Do not ask permission to continue work that's already in flight.
     - **None active, some PLANNED** → offer to start the most recent planned one.
     - **Only complete plans, or none at all** → show the table (or "no plans yet") and ask: new plan, follow-up from a summary, or maintenance?
- **`status` given as the argument** → print the same table and stop. No resume, no dispatch.
- **SUMMARY.md exists**: plan is COMPLETE. Offer: review summary / follow-up plan from its recommendations / **maintenance** (§8) / fresh plan. If the user's message already describes a bug or change ("X is broken"), skip the menu → §8 Maintenance.
- **LITE.md exists (no PLAN.md)** → resume the lite job (§4b): read LITE.md, continue — or graduate if it's outgrown the lane.
- **`--lite`, or the ask is obviously ≤ half a day** → §4b Lite lane (no PLAN.md ceremony).
- **No PLAN.md** → §2 New Plan.
- **PLAN.md exists** → §3 Resume (BOARD.md or legacy handoffs tell you where things stand; neither existing means fresh execution → §4).

## 2. New Plan

1. Need a name? Ask for kebab-case (`microservice-separation`).
2. Create the plan (via a plan-writing skill such as `superpowers:writing-plans` if available, or write it yourself; or import the user's existing plan; or `--from-context`: distill goals/phases/decisions already discussed in this conversation). Save to `docs/justkeepswimming/{plan-name}/PLAN.md`.
3. **PLAN.md must carry, per phase:** goal, tasks, **acceptance criteria** (observable, verifiable), a **Depends-on:** line (phase numbers or "none"), and a rough **files/areas touched** hint. These four power sprint planning — add them if the imported plan lacks them.
4. Unless `--now`: show the phase list, ask "Start execution now?" With `--now`: go.

## 3. Resume

1. Read `PLAN.md` + `BOARD.md`. **That is the entire restore — two reads.**
2. **Audit the board against git truth:** `node scripts/board-check.js {plan}` (ships in this plugin's `scripts/` — copy it into your project's `scripts/` on first use; if node or the script is unavailable, spot-check the merged SHAs by hand). The board is self-reported; the checker isn't. Any FAIL → fix the board from git evidence BEFORE dispatching anything — a board that lies poisons every decision downstream.
3. Legacy plan (has `*-handoff-*.md`, no BOARD.md)? Synthesize BOARD.md from the handoffs ONCE (status from the latest; decisions/learnings merged from all), move the handoffs to `archive/`, then proceed. Never read the handoff pile again.
4. Announce: "Resuming {plan}. {X}/{Y} phases merged. Door: {open at <worktree/branch> / closed}. Picking up: {next}."
5. Unresolved blockers on the board → surface them first.
6. Door open but the checker says the worktree/branch is gone → reopen (§5a) and note it on the board.

## 4. Pick the lane

| Choose | When |
|---|---|
| **Lite lane** (§4b) | ≤ half a day of work, single sitting expected, or `--lite` |
| **Solo lane** (§4a) | Bigger than lite but ≤2 phases, or strictly serial phases touching the same files, or `--solo` |
| **Scrum lane** (§5) | 3+ phases, or any two phases can run in parallel, or the plan will clearly outlast one sitting |

### 4a. Solo lane

Execute phases inline, in order. After EVERY phase: verify against acceptance criteria, commit, **update BOARD.md**, then continue. Context events (§7) still apply. This is classic v1 behavior with a board instead of handoffs — no agent ceremony for small jobs.

### 4b. Lite lane — ceremony that fits in a sitting

For work you'll finish today. The full trio (PLAN/BOARD/SUMMARY) must earn itself; here it doesn't.

- **One file**: `docs/justkeepswimming/{plan}/LITE.md` — goal (one line), checklist with acceptance criteria inline, a Decisions/Learnings section you append as you go, and an Outcome section at the end. No PLAN.md, no BOARD.md, no SUMMARY.md.
- **Execute inline**, following the project's normal git conventions (branch/worktree for multi-file work).
- **One review gate, at the end**: a single reviewer agent (dev tier, high effort) over the full diff before shipping. Skip only for docs/prototype-only changes — production code always gets the gate.
- **Finish the sitting**: verify the exact surface named in the ask, ship per the project's release convention, append the Outcome (what shipped, commit SHA, verification run, follow-ups worth remembering). The folder stays one file.
- **Graduate, don't stretch.** Scope grows past half a day, or a second session becomes likely → write PLAN.md + BOARD.md from LITE.md's content, move LITE.md to `archive/`, and continue in solo/scrum. A lite job that spans sessions without a board is handoff roulette with fewer notes.

## 5. Scrum lane

### 5a. Open the door — ONCE per plan

- One isolated workspace per plan — a git worktree (your harness's worktree tool, or `git worktree add ../wt-{plan} -b jks/{plan}`) or a feature branch if worktrees don't fit the project. Created at first execution and **kept open across sprints AND across sessions** until SUMMARY.md is written. If the board says it already exists, re-enter it — never create a second one.
- **Respect the project's own contribution rules** (CLAUDE.md, CONTRIBUTING.md): branch naming, merge style, protected branches. The first time you determine the project's merge + deploy conventions, record them on the board as a Decision — never re-derive them.
- **The scrum master owns git.** Dev agents edit and verify; they never commit, never run git write commands. This single rule eliminates agent-vs-agent git races.
- **Commit the plan the moment the door opens.** PLAN.md + BOARD.md are the first commit on the plan branch, before anything is dispatched. Workspaces can vanish (a crash, a session restart, a cleanup job); an uncommitted plan dies with them.
- **Verify the door before you write into it.** On resume or after any restart, confirm the workspace is still registered (`git worktree list`, or the branch exists) before creating files there. A path whose worktree is gone is just a directory: files written into it land outside git and get stranded. Door gone → open a new one (a new name if the old one is burned) and record the switch on the board.
- Tearing the door down mid-plan (teardown → recreate next sprint) is a violation, not tidiness: it burns tokens re-establishing state and loses the open lanes. The door closes once, in §9.

### 5b. Sprint planning (a few minutes of thinking, zero file reads)

1. From PLAN.md's Depends-on lines, compute the **ready set** — phases whose dependencies are all merged.
2. **Assign file ownership.** Each dispatched phase owns a disjoint set of files/dirs (use PLAN.md's files-touched hints; when two ready phases claim the same file, serialize them or move the shared file to one owner). Shared registries/manifests (route tables, config indexes, nav files, lockfiles) are **scrum-master-edited at the merge window**, not agent-edited — they're the classic collision point.
3. **Assign models & effort — the tier doctrine** (example mapping as of the Claude 5 family in parentheses):

   | Role | Model / effort | Why |
   |---|---|---|
   | Orchestrator (you) | The strongest model available (Fable) — run the session on it; never downgraded, never compacted | Sprint planning, ownership, verdicts, and merges are judgment work |
   | Dev agents | One tier down (Opus), default effort | Depth comes from focus (one phase, owned files), not from tier |
   | Rote/mechanical lanes | Two tiers down (Sonnet; Haiku for pure mechanics), low effort | Renames, boilerplate, config plumbing |
   | Review gates | Dev tier (Opus) at high effort; the riskiest surfaces (security, data-loss, auth) inherit the orchestrator's model | Adversarial reading is the cheapest insurance there is |

   The cheapest agent that passes the review gate is the right agent — but the gate itself is never where you economize. Deviations are board Decisions.
4. Sprint size: dispatch everything ready and disjoint — that's the point. But keep it supervisable: if the ready set exceeds ~4 phases, batch it.
5. **A concurrency cap beats the fan-out.** If the project or its owner limits concurrent subagents ("one subagent at a time"), that limit overrides this skill's parallel dispatch. Run the sprint as a serial queue — one dev OR one reviewer running at any moment — and **commit each GREEN phase before dispatching the next** (the next phase usually edits files the last one created, so an uncommitted tree would mix two phases in one commit). Phases, acceptance criteria, gates and the board are unchanged; only the fan-out goes. Record the cap as a board Decision.
6. **Warm until heavy.** A dev that just finished a phase is the cheapest agent for its fixes and for the adjacent phase on the same surface. Switch to a fresh dev when the warm one's context is past roughly half its window, or when the next phase is a different surface (messaging or webhooks after UI work): a crisp contract beats a heavy, blurry context.

### 5c. Dispatch — parallel, one message (serial under a cap, §5b.5)

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

If the harness has a task list (e.g. TaskCreate/TaskUpdate), mirror phase states into it — dependencies from the Depends-on lines, updates at sync points. That gives the user live progress; the board stays canonical.

### 5d. Review gate — every phase, before its merge

For each returned phase, dispatch a **reviewer agent** (fresh eyes; dev tier at high effort — tier doctrine, §5b.3):

```
Adversarially review phase {N} ({goal}) in {workspace}. Scope: the owned files {list}.
Check: acceptance criteria actually met · real bugs (logic, edge cases, races, security) ·
project-convention violations (CLAUDE.md/CONTRIBUTING) · missing wiring (registrations,
exports, config entries, migrations) ·
CALLERS OUTSIDE THE DIFF: for every changed export, signature or record shape, find
its callers/importers that the change did NOT touch (the project's dependency-graph
tool if it has one, else grep the name) and check each still works; include names
that live in strings (config, manifests, route tables, templates) — no code graph sees them.
Report ≤20 lines: VERDICT GREEN|RED · RISK LOW|MEDIUM|HIGH|CRITICAL (why) · confirmed
issues with file:line + a concrete failure scenario each · callers outside the diff
(compatible | BROKEN) · missing coverage · nitpicks separately (non-blocking).
```

**Risk rubric** (sets review depth; CRITICAL gates get the orchestrator's model): LOW = a
handful of direct dependents in one runtime; MEDIUM = 6–15 dependents or several runtimes;
HIGH = more than 15 dependents or a hot boot path; CRITICAL = anything touching auth,
permissions, money, tenant/data isolation, outbound sending, deletion, or schema.

- RED → send the findings BACK TO THE SAME DEV AGENT (message the existing agent — its context is warm and cached; a fresh fixer would re-read everything). Re-review the fix. Two RED rounds on the same phase → stop, mark it blocked on the board, move on or ask the user.
- **Keep one standing reviewer.** Reuse the same reviewer for every phase by messaging it the new scope ("the uncommitted diff is Phase N only"). It builds up the project's invariants, notices when a later phase breaks an earlier fix, and gives a warm second opinion on open design calls (a check-baseline expansion, polling vs. push) for almost nothing. Ask for that recommendation explicitly.
- **Follow-up rounds after GREEN.** Non-blocking findings worth fixing go back to the dev as one short round. You may commit that round without its own re-review only if you put it, by name, in the NEXT gate's scope. A round that fixes a RED finding always gets its own re-review before commit.
- Batch small same-risk phases into one review dispatch; never skip the gate because a change "is obviously fine." Rework escaping to a later sprint is the single biggest token burn this skill exists to prevent.
- **Wide fan-outs (≥3 same-shape dispatches — a review panel across many phases, the §5g gap sweep) MAY run through your harness's deterministic multi-agent workflow tool when one is available** — this skill directing you to use it is your opt-in. Give each agent a JSON schema so reports come back validated instead of prose. Dev lanes stay on the interactive agent tool — they need follow-up messages.

### 5e. Merge window — integrate while agents still work

When one or more phases are GREEN, run a merge window. **Dispatch the next sprint FIRST (5b→5c), then integrate** — development and integration overlap; nobody waits on a merge.

1. **Verify the batch:** run the project's checks the change warrants — syntax checks, targeted tests, lint, build (record the exact commands on the board the first time).
2. **Commit owned paths only:** stage the exact files from the GREEN phases → commit with a plain message. In-flight WIP from later phases stays uncommitted and unharmed.
3. **Integrate per the project's convention** (the board Decision from 5a): fast-forward/merge to the integration branch directly, or push and open/update the PR — either way the plan branch lives on; the door stays open. If the target branch has diverged: **defer** — note "merge deferred, target moved" on the board and integrate at the next window. Never rebase a workspace that has other agents' WIP in it.
4. **Ship when the window is green:** if the project has a deploy command or CI release path and the integrated change is deployable, trigger it now — don't hoard ten phases for one big-bang deploy. Respect the project's release cadence; a queued/batched deploy counts as done. (Exception: a feature that is unusable until a post-deploy step runs — a permission rollout, a migration — may land once at the end; record that as a Decision.)
5. **Update BOARD.md** — states, commit SHAs, decisions, learnings — then audit it: `node scripts/board-check.js {plan}`. A FAIL here means the board you just wrote doesn't match git; fix it now, while the window's evidence is fresh. This is the sync point; it is never deferred to "after the next phase."
   - **State words are git facts:** `green` = reviewed and committed on the plan branch (record the SHA); `merged` = reachable from the integration branch; `shipped` = deployed. A phase committed on the branch but not yet integrated is `green`, never `merged` — the checker fails a `merged` SHA that isn't on the integration branch.
   - **A rebase landing rewrites SHAs.** After integrating, replace the board's branch SHAs with the integration-branch SHAs before the next audit.
6. **Post-deploy steps are board items.** When a dev reports a step that must run after deploy (a permission/capability rollout, a data migration, a backfill, a cache warm), put the exact command on the board under Open Items the moment you hear of it. Run it dry-run first, then for real, right after the ship — never leave it in a dev report.

### 5f. Loop

Sprints repeat (ready set → dispatch → review gate → merge window) until all phases are merged. Standing agents from earlier phases take small follow-ups via a message to the existing agent instead of new spawns — warm context is cheap context.

### 5g. Gap sweep — before declaring victory

All phases merged ≠ done. Dispatch a **completeness critic**: "Read PLAN.md acceptance criteria + BOARD.md + the branch's `git log`/`git diff --stat`. Hunt what's missing: unmet criteria, unwired ends (registrations, exports, config, migrations), missing tests/docs, and user-visible copy that still promises earlier phases' 'later' work. Report gaps ≤20 lines." Findings become a final micro-sprint through the same gate. Only a clean critic report moves you to §9.

### 5h. Live verification — shipped ≠ done

Green tests and a clean ship prove the code builds and the mocks agree; they do not prove the feature works. Mocked stores and simulated DOMs miss real storage behavior (a store that drops empty lists, so a view calls `.slice` on `undefined` and crashes). After the ship:

1. Dispatch a **verifier agent** to drive the LIVE surface as a real user, at desktop and phone widths: real create/read/update/delete, reload for persistence, console errors, layout overflow. It names its test data clearly ("CC smoke …"), never triggers an outward action (send, pay, publish — preview only), and cleans up everything it created.
2. Findings → a fix micro-sprint through the same gate → integrate → ship → **re-verify the exact scenario that failed.**
3. The completion claim comes after the live re-check, not after the ship. If the live surface can't be reached, say so and name what the user must check.

## 6. Token economy (how this stays cheap)

| Rule | Practice |
|---|---|
| Delegate the noise | Orchestrator never reads implementation files or raw diffs; agents return ≤25-line structured reports |
| One-read resume | BOARD.md is the only state file; the handoff pile is dead |
| Cache alignment | Front-load your reads (PLAN, BOARD) at session start and don't re-read; batch independent tool calls in one message; keep orchestrator turns short and stable |
| Reuse warm agents | Follow-ups and fixes go to the SAME agent — its context is already cached; fresh spawns re-read the world. Keep one standing reviewer across phases. Retire a dev once its context is heavy (§5b.6) |
| Tier doctrine | The strongest model orchestrates; one tier down develops; two tiers down take the rote lanes; high effort is reserved for review gates (§5b.3) |
| Fresh sessions | End a shift at a board boundary instead of riding into compaction — resume costs two reads (§7) |
| Kill rework | Acceptance criteria travel IN the dispatch prompt; review gates run BEFORE merges; BLOCKED beats a wrong guess |
| Cap ceremony | Board updates are a few edits — status lines, not essays |

## 7. Session lifecycle — fresh sessions beat compaction

The orchestrator's judgment is the one thing that must never degrade. Harness compaction keeps a session alive, but it silently blurs exactly what the scrum master exists to hold — decisions, ownership boundaries, verdicts. The board makes sessions disposable, so dispose of them: **work in shifts, and hand a FRESH session a current board instead of letting a compacted one keep judging.**

- **End the shift at a boundary, on purpose.** A shift = sprints until a natural boundary (current batch integrated + board current) reached while the session is still sharp. When the transcript is getting heavy — several sprints supervised, many reports absorbed — end the shift AT that boundary: final board update, then "Board is current — resume with `/justkeepswimming:go {plan}` in a fresh session." Do not wait for a compression signal; by the time you notice one, judgment has already degraded.
- **Late signal** (you notice summarization, or early-session details feel fuzzy — "I think" instead of "I know"): finalize immediately — finish in-flight reviews cheaply, one final board update, STOP dispatching. Never start anything new, including "one small phase."
- **Never push a compacted orchestrator through more sprints.** "The summary kept everything important" is unverifiable from the inside; a fresh session with a current board is strictly better and costs two reads.
- In-flight dev agents at shift end are fine — their work sits in the workspace; the board notes which phases were mid-flight so the next shift re-reviews or re-dispatches them.
- **All lanes blocked on user input**: board update, list the blockers, end the turn.
- **User says stop/handoff** at any time: board update, report state.

There is no phase-count ceiling in v2 — shifts end on boundaries, not budgets. And an always-current board means even a crash loses one sprint, not a session.

## 8. Maintenance (post-delivery)

Entered from §1 when a completed plan's work needs a bug fix, change, or investigation.

1. Restore from `SUMMARY.md` (architecture map) + BOARD.md Learnings. Announce maintenance mode.
2. **Thinking Protocol applies in full** — diagnose before prescribing; the one condition you skip is the broken one.
3. Investigate → fix root cause only → verify the exact surface the user named (not a proxy) → follow the project's restart/release conventions.
4. **Always write the log** — `YYYY-MM-DD-maintenance-NNN.md`: investigation steps with findings, changes table (file/lines/why), verification, deployment, notes. Investigation-only sessions log too ("no issue found" is context). Trivial fix ⇒ abbreviate investigation to 1-2 lines, never skip the log. Do NOT edit SUMMARY.md — maintenance logs are the post-delivery source of truth.
5. Scope larger than a targeted fix (3+ files coordinated, "needs a refactor")? Stop: "This needs its own plan — want a follow-up plan?"

## 9. Completion — clean folder, closed door

1. **Final board audit:** `node scripts/board-check.js {plan}` must pass clean — SUMMARY.md is written from the board, so the board must match git truth first.
2. **SUMMARY.md** (the standalone record): architecture overview + diagram, What Changed table (every file, all sessions), amendments from the original plan, operational commands (if infra was built), **Recommended Next Steps** in prioritized groups — specific to what was built, never generic advice, detailed enough to plan from. **Write it before the final landing** when your landing step removes the workspace.
3. **Clean the folder:** keep PLAN.md, final BOARD.md, SUMMARY.md; sweep legacy handoffs/review scratch into `archive/`. A stranger opening the folder should read SUMMARY.md and understand everything.
4. **Close the door in this order:** final merge → ship (§5e) → post-deploy steps (§5e.6) → live verification (§5h) → a small close-out commit that appends an **Outcome** section to SUMMARY.md (what shipped and where, deploy steps run, live-check result, known leftovers) and marks the board's door `closed`. Then remove YOUR worktree/branch per the project's cleanup convention. Merge ⇒ self-cleanup, immediately; never leave a dead workspace.
5. Offer a follow-up plan built from the Recommended Next Steps.

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
| "No compression signal yet — one more sprint fits" | Shifts end at boundaries, not at the cliff. Heavy transcript + clean boundary = end the shift. |
| "A top-tier review gate seems wasteful" | The gate is the cheapest insurance you buy. Economize in the dev lanes, never at the gate. |
| "I'll spawn a fresh agent to fix the reviewer's findings" | The original dev's context is warm and cached. Message it. |
| "The board looks right, skip the checker" | Self-reported state drifts. The checker is one subprocess; a lying board poisons every later decision. |
| "This lite job just needs one more sitting" | Lite without a board across sessions is handoff roulette. Graduate it. |
| "The owner caps subagents, but parallel is the whole point" | The cap wins. Run the sprint as a serial queue (§5b.5). |
| "The worktree path exists, so the door is open" | Check `git worktree list`. A path without a registered worktree strands every file you write. |
| "It's committed on the branch — mark it merged" | `merged` means on the integration branch. Branch-only is `green` + SHA. |
| "Tests are green and it shipped — done" | Mocks never touched the real store. Verify the live surface (§5h), then say done. |
| "The dev mentioned a rollout step, I'll remember it" | You won't, after a compaction or a new shift. Board Open Items, with the exact command. |
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
<!-- states: todo · in-progress · review · fixing · green (reviewed + committed on the plan branch) · merged (on the integration branch) · shipped (deployed) · blocked -->

## Decisions (settled — agents follow, don't re-litigate)
- YYYY-MM-DD: {decision} — {rationale}
- YYYY-MM-DD: merge convention: {FF to main | PR}; deploy: {command | CI | none}; checks: {commands}
- YYYY-MM-DD: concurrency: {parallel | serial — owner cap of N subagents}; landing: {per window | once at the end — why}

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
