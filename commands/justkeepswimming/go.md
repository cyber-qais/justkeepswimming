---
name: justkeepswimming:go
description: Lightweight plan management with context-aware handoffs to prevent context rot during multi-phase implementations, including structured post-delivery debugging and maintenance
argument-hint: "[plan-name] [--interactive] [--from-context] [--now]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - AskUserQuestion
  - Skill
---

<thinking-protocol>
## HOW YOU THINK MATTERS MORE THAN WHAT YOU DO

Before executing ANY work — debugging, building, investigating, or planning — internalize and apply the Thinking Protocol from `THINKING.md` in the skill root. These six principles are non-negotiable:

1. **Diagnose before you prescribe.** Never jump to a solution. Gather facts first. Every minute understanding the problem saves ten minutes of wrong-direction fixes.
2. **Trace the full chain.** List every condition required for success. Verify each one independently. The broken condition is always the one nobody checks because it's "too basic."
3. **Check what's actually there, not what you expect.** Run diagnostics with an open mind. Read the output — don't skim for confirmation. The fix often surfaces from an anomaly you noticed while checking something else.
4. **Know the silent failures.** Systems fail without useful errors all the time — they fall back, return generic messages, or silently skip the broken path. When something "should work but doesn't," look for the silent failure nobody checked.
5. **Minimum effective intervention.** Fix the root cause and only the root cause. The best fix is the smallest change. If you changed more than needed, you didn't understand the problem well enough.
6. **Resist the gravitational pull of "the usual fix."** If the user says they've tried everything, the answer lives in the layer nobody checked. Don't re-run the playbook — find the unverified condition.

**The meta-rule:** Every condition required for success must be verified. The one you skip is the one that's broken. Don't be a solution-guesser. Be a condition-verifier.

**Apply this at every phase:** When a build fails, list what must be true and verify each. When code doesn't behave as expected, trace the full execution chain. When something worked yesterday and doesn't today, find what changed — don't guess. When blocked, check one layer deeper than where you stopped.

**Quick gut check when stuck:**
- Have I listed ALL conditions for success? → If no, stop and list them.
- Have I verified EACH condition empirically? → Verify the ones I skipped.
- Am I pattern-matching to a common fix? → Step back and check the full chain.
- Could something be failing silently? → Check fallback behaviors and strict modes.
- Am I about to change more than the root cause? → Scale back to minimum fix.
</thinking-protocol>

<prime-directive>
## THE HANDOFF IS THE DELIVERABLE

Code changes without a handoff are a **FAILURE** unless the entire execution can happen within one session before context is exhausted. The entire purpose of this skill is to preserve context across sessions. An exhausted context with no handoff means all nuance, learnings, and decisions from this session are **permanently lost**.

**Rules that override everything else:**
1. **Never start a phase you can't finish AND hand off.** If you've already completed 1-2 phases, the handoff IS your next task — not the next phase.
2. **A handoff created "too early" wastes nothing.** A handoff created too late (or never) wastes the entire session.
3. **You cannot detect your own context usage percentage.** You MUST use the concrete triggers below — do not try to "feel" whether you have room left.
4. **After completing ANY phase, your FIRST action is to evaluate handoff triggers** — not to start the next phase.
</prime-directive>

<objective>
Manage implementation plans with smart handoffs. No state files, no milestones, no ceremony — just a plan, execution, and handoff documents that preserve context when sessions get long.

Plans live in `docs/justkeepswimming/{plan-name}/`:
```
docs/justkeepswimming/{plan-name}/
├── PLAN.md                       # Implementation plan
├── YYYY-MM-DD-handoff-NNN.md     # Session handoff(s)
└── SUMMARY.md                    # Final summary & next steps (generated on completion)
```

**Two execution modes:**
- **Autonomous** (default): Just keep swimming. Execute phases continuously, create handoffs automatically when context gets heavy. No stopping to ask.
- **Interactive** (`--interactive`): Pause after each phase for user review. User decides when to continue or handoff.
</objective>

<process>

## 1. Determine Mode

Parse `$ARGUMENTS` for plan name and flags:
- `--interactive` flag → interactive execution mode (otherwise autonomous)
- `--from-context` flag → synthesize PLAN.md from the current conversation context (see New Plan step 3c)
- `--now` flag → implies `--from-context` AND skips the "Start execution now?" confirmation — synthesize and immediately execute
- Everything else → plan name

Check filesystem:
- **No plan name given**: Look for existing plan directories in `docs/justkeepswimming/`. If any exist, list them (marking completed plans) and ask: "Resume an existing plan or start a new one?" If none, go to New Plan.
- **Plan name given, SUMMARY.md exists**: → Plan is **COMPLETE**. Tell the user: "That plan is complete (SUMMARY.md exists). What would you like to do?"
  - **Review**: Show the summary
  - **Follow-up plan**: Create a new plan from the summary's recommendations
  - **Maintenance**: Debug an issue or make changes related to this plan's work → go to **Section 7**
  - **Fresh start**: Start a new plan with a different name
  **Shortcut:** If the user's message clearly describes a bug or change request (e.g., "X is broken" or "change Y"), skip the menu and go directly to Maintenance (Section 7).
  Do NOT resume or re-execute a completed plan.
- **Plan name given, no `docs/justkeepswimming/{plan-name}/PLAN.md`**: → **New Plan**
- **Plan name given, PLAN.md exists, no handoff files**: → **Execute**
- **Plan name given, PLAN.md exists, handoff files exist**: → **Resume**

## 2. New Plan

1. If no plan name provided, ask: "Give your plan a short name (kebab-case, e.g. `microservice-separation`)"
2. Create `docs/justkeepswimming/{plan-name}/` directory
3. Determine how to create the plan:

   **a) Default (no flags)** — Ask: **"Want me to create a plan using superpowers, or do you have an existing plan to import?"**
   - **Create**: Invoke `superpowers:writing-plans` skill. Save result to `docs/justkeepswimming/{plan-name}/PLAN.md` (override the skill's default save location)
   - **Import**: Ask user to provide the plan (file path or paste). Save to `docs/justkeepswimming/{plan-name}/PLAN.md`

   **b) `--from-context`** — Synthesize a plan from the current conversation. The user has already been discussing requirements, architecture, or approach in this session. Distill everything discussed so far into a structured PLAN.md:
   - Extract goals, phases, tasks, dependencies, and constraints from the conversation
   - Organize into the same format that `superpowers:writing-plans` would produce
   - Include any decisions, constraints, or preferences the user expressed
   - Save to `docs/justkeepswimming/{plan-name}/PLAN.md`
   - Show the user a brief outline: "Here's what I captured from our conversation: [phase list]. Anything to add or change?"

   **c) `--now`** — Same as `--from-context` but skip ALL confirmations. Synthesize the plan, save it, and immediately start executing. No "anything to add?", no "start execution now?" — just go.

4. Unless `--now` was used, ask: "Plan saved. Start execution now?"
5. If yes → go to Execute

## 3. Resume

1. Read **ALL** `*-handoff-*.md` files in `docs/justkeepswimming/{plan-name}/` — not just the latest. Each contains key learnings and decisions that may not be repeated in later handoffs.
2. Pay special attention to the **most recent** handoff's "Remaining Work", "Blockers", and "Cumulative Context" sections — this is your primary context restoration.
3. Read `docs/justkeepswimming/{plan-name}/PLAN.md` for the full plan.
4. Announce: "Resuming {plan-name} from handoff {NNN}. Previously completed: [summary]. Picking up at: [next item]."
5. If the latest handoff has unresolved **Blockers**, surface them: "Previous session left these blockers — want to address them before continuing?"
6. Continue to Execute from where the handoff left off.

## 4. Execute

Work through the plan phase by phase, task by task.

### Session Budget (MANDATORY)

Before starting execution, **detect your context window size** and set a budget:

**How to detect:** Check your system prompt for model info. If it says "1M context" or the model ID contains `[1m]`, you're in extended context mode. Otherwise, assume standard (~200k).

| Context Window | Max phases/session | Resume budget | Announce |
|---|---|---|---|
| **Standard (~200k)** | 2 | 1-2 (handoffs consume context) | "Context budget: up to {N} phases (max 2), then hand off." |
| **Extended (1M)** | 5 | 3-4 (handoffs are a small fraction) | "Extended context detected. Budget: up to {N} phases (max 5), then hand off." |

1. **Count remaining phases** in the plan
2. **Set budget** per the table above — these are HARD CEILINGS, not suggestions
3. **Announce** the budget and context tier so the user knows what to expect

**The budget is non-negotiable.** When you hit your budget, you hand off. You do not "just finish this one more thing." You do not evaluate whether you have room. You hand off.

### Autonomous Mode (default — just keep swimming)

Execute continuously without stopping to ask. After each phase:
1. Briefly report what was done (one-line status)
2. **Run the Handoff Trigger Check** (see below) — this is NOT optional
3. If ANY trigger fires → execute **Handoff Protocol** immediately. Do not start the next phase.
4. If all triggers are clear AND budget remains → continue to next phase

### Interactive Mode (`--interactive`)

After each phase:
1. Report what was done with details
2. **Run the Handoff Trigger Check** (see below)
3. If triggers fire, recommend handoff: "Context is getting heavy — I recommend we hand off now."
4. If clear, ask: "Phase {N} complete. Continue to next phase, create a handoff, or adjust the plan?"
5. Wait for user direction

### Handoff Trigger Check (MANDATORY — run after EVERY phase)

**STOP and hand off if ANY of these are true:**

| # | Trigger | Standard (~200k) | Extended (1M) | Why |
|---|---------|---|---|-----|
| 1 | **Phases completed** | >= 2 | >= 5 | Context consumed by file reads, code writes, decisions |
| 2 | **Context compression detected** | Same for both: you notice earlier messages are summarized, or can't recall specific details from early in the session | | Hand off NOW before more is lost |
| 3 | **Large phase just completed** | 10+ file reads/writes | 20+ file reads/writes | Large phases consume disproportionate context |
| 4 | **Subagent-heavy work** | 3+ subagents | 8+ subagents | Subagent results inflate context significantly |
| 5 | **Budget exhausted** | Same for both: you've hit your session budget | | Non-negotiable. Hand off. |

**How to self-check for compression:** Try to recall specific details from the START of this session — the first file you read, the first change you made, exact line numbers. If these feel fuzzy or you're relying on "I think I..." rather than "I know I...", compression has started. **This is the most reliable trigger regardless of context size — trust it over the phase count.**

**When in doubt, hand off.** A session that completed 1 phase with a clean handoff is MORE valuable than a session that completed 3 phases with no handoff, because the next session starts from zero without one.

**Both modes**: User can say "handoff" at any point to force one.

### Mid-Phase Checkpoints

For phases with many subtasks (4+), do a mini-check at the halfway point:
- **Standard context**: If you've already completed 1 full phase, consider handing off at the mid-point of phase 2 rather than at the end
- **Extended context**: Mid-phase checks become relevant after phase 3-4, not phase 1-2
- A handoff mid-phase is perfectly fine — document what's done and what's left within the phase

### Execution Rules
- Follow the plan in order unless dependencies allow reordering
- If blocked, ask the user — don't guess or force through
- Don't skip verification steps from the plan
- **When reality diverges from the plan**, note the deviation but keep moving — capture it in the handoff's Amendments section

## 5. Handoff Protocol

**CRITICAL: Do this WHILE you still have full context. The whole point is to capture nuance BEFORE it's lost to compression.**

**Handoff is triggered by:**
- (Autonomous) Any trigger from the Handoff Trigger Check
- (Interactive) User chooses to handoff
- (Both) User says "handoff" at any point
- (Both) Session budget exhausted

**When a trigger fires, IMMEDIATELY stop execution and write the handoff.** Do not finish "one more thing." Do not clean up code. Do not run one more test. Write. The. Handoff.

### Create the handoff document

Find next handoff number: check existing `*-handoff-*.md` files in the plan directory. If none, use 001. Otherwise increment the highest.

Count completed vs total phases from PLAN.md to calculate progress.

Write to `docs/justkeepswimming/{plan-name}/YYYY-MM-DD-handoff-NNN.md`:

```markdown
# Handoff — {Plan Name} — Session {NNN}

**Date**: YYYY-MM-DD HH:MM
**Progress**: {X} of {Y} phases complete (~{percent}%)
**Session summary**: One-line description of what this session accomplished
**Handoff trigger**: Which trigger(s) fired (e.g., "2 phases completed", "context compression detected", "budget exhausted")

## Completed This Session

- [x] Phase/task description — `file.js:42` exact references
- [x] Phase/task description — `file.js:100-150` exact references

## In Progress (if handing off mid-phase)

- [ ] Phase N, Task X — describe what's done and what's left within this task
- Current state: what was the last thing you did, what's the next step

## Remaining Work

- [ ] Phase/task from PLAN.md still pending
- [ ] Phase/task from PLAN.md still pending

## Blockers & Open Questions

- Blocker: description — what needs to happen to unblock (e.g., "need user to clarify X", "dependency Y not available")
- Question: something that needs a decision before proceeding

## Skipped & Why

- Task description: reason it was skipped

## Plan Amendments

Where reality diverged from the original plan:
- Plan said X → Actually did Y because Z
- Phase N approach changed: rationale

## Key Learnings (This Session)

Discoveries from THIS session — be specific, include file:line references:
- Architecture insight with file paths
- Data structure shapes found
- Edge cases encountered
- Patterns or conventions discovered
- Things you tried that didn't work and why

## Cumulative Context (All Sessions)

**Carry forward from all prior handoffs.** Condense and merge — don't just copy-paste. This section should give a future agent everything they need WITHOUT reading prior handoffs:
- Critical architecture facts
- Data structures and their actual shapes
- Cache behaviors, key schemes, TTLs
- Known gotchas and edge cases
- Naming conventions
- Key decisions and their rationale (from all sessions)

## Next Session

1. **Read first**: `specific/file.js` (lines X-Y) — why this file matters
2. **Focus**: next phase/task description
3. **Watch out for**: gotchas, tricky areas, things that almost broke
4. **Context budget recommendation**: suggest phases based on remaining complexity (standard: 1-2, extended 1M: 3-5)

## Protocol

Resume this plan: `/justkeepswimming:go {plan-name}`
Your #1 job is the handoff. Detect your context tier, set budget accordingly, execute, then hand off BEFORE context gets heavy.
When all phases are done, ask the user about cleanup.
```

### After writing the handoff:

1. Tell the user the handoff is saved with its path
2. Show progress: "X of Y phases complete (~N%)"
3. If blockers exist, highlight them
4. Say: **"Start a new session and run `/justkeepswimming:go {plan-name}` to continue."**

## 6. Completion

When ALL plan phases are done:

1. Create a final handoff with title: `# COMPLETE — {Plan Name} — Final Summary`
2. Include: all completed work across ALL sessions, total key learnings, plan amendments made, final cumulative context
3. Ask the user:
   - "Want to commit the remaining changes?"
   - "Keep the plan directory for reference or clean it up?"
   - "Anything need a server restart or deployment?"

### Generate SUMMARY.md

After the final handoff, **always** generate `docs/justkeepswimming/{plan-name}/SUMMARY.md`. This is a polished, standalone document — not a handoff. It should be useful to anyone (human or AI) who wants to understand what was built without reading handoff files.

Write to `docs/justkeepswimming/{plan-name}/SUMMARY.md`:

```markdown
# {Plan Name} — Final Summary & Next Steps

**Date**: YYYY-MM-DD
**Status**: COMPLETE — All {Y} phases deployed and verified

## Architecture Overview

High-level description of the final architecture. Include a diagram (ASCII art or code block) showing how components relate to each other. Be specific: ports, processes, data flows, routing layers.

## What Changed

| File | Change |
|------|--------|
| `path/to/file.js` | **New** or **Modified** — brief description |

Include ALL files created and modified across ALL sessions.

## Amendments from Original Plan

Where reality diverged from the plan and why. Only include if there were actual deviations.

## Operational Commands

Quick reference for common operations: health checks, restarts, log viewing, config reloads — whatever is relevant to the system that was built. Skip this section if the plan didn't produce operational infrastructure.

---

## Recommended Next Steps

Organize into prioritized groups (Priority 1, 2, 3, etc.). Each group should have:
- A clear theme (e.g., "Monitoring & Observability", "Performance Tuning")
- 2-4 concrete, actionable recommendations
- Enough detail that someone could plan implementation from the description alone

Focus on what naturally follows from the work just completed. Don't pad with generic advice — every recommendation should be specific to what was built.
```

**Adapt the template to the project.** The sections above are guidelines, not a rigid format. If the plan was a refactor with no operational commands, skip that section. If it was infrastructure work, the operational commands section is critical. Use judgment.

### Offer Follow-Up Plan

After writing SUMMARY.md, ask the user:

> "The summary includes recommended next steps. Want me to create a **new plan** from these recommendations using `superpowers:writing-plans`? I can turn the next steps into a structured implementation plan that you can execute with `/justkeepswimming:go {new-plan-name}`."

If the user says yes:
1. Use the Recommended Next Steps from SUMMARY.md as the input/context for plan creation
2. Ask for a plan name (suggest one based on the recommendations, e.g., `microservice-monitoring` or `performance-tuning`)
3. Invoke `superpowers:writing-plans` to create the plan
4. Save to `docs/justkeepswimming/{new-plan-name}/PLAN.md`
5. Ask: "Plan saved. Start execution now or pick it up later with `/justkeepswimming:go {new-plan-name}`?"

## 7. Post-Delivery Maintenance

**When:** The user has a completed plan (SUMMARY.md exists) and reports a bug, requests a change, or needs debugging related to the work that plan delivered. Entered via the "Maintenance" option in Determine Mode, or when the user explicitly mentions an issue with completed work.

**The full Thinking Protocol applies.** Every investigation follows diagnose-before-prescribe. Every fix uses minimum effective intervention. No exceptions — especially not for "simple" fixes.

### Entering Maintenance Mode

1. Read `SUMMARY.md` to restore context — architecture, files changed, decisions made
2. Read the latest handoff's **Cumulative Context** for detailed knowledge
3. If maintenance logs already exist (`*-maintenance-*.md`), read the most recent one for prior post-delivery context
4. Announce: "Entering maintenance mode for {plan-name}. Context restored from completion summary."
5. Ask the user to describe the issue or change (unless they already have)

### Investigation & Fix Protocol

For EVERY issue or change request, follow this sequence:

**1. Understand** — What is the user seeing? What do they expect? What's the gap? Don't touch code until you understand.

**2. Diagnose / Survey** (Thinking Protocol — diagnose before you prescribe):
- **For bugs**: List all conditions required for the expected behavior. Verify each empirically. Look for silent failures.
- **For change requests**: Survey the current implementation to understand what exists, what needs to change, and what might be affected. Read the relevant files before writing anything.
- **Both**: Log every step — what you checked, what you found, expected vs actual
- Use SUMMARY.md's file list as your investigation map — start with the files the plan touched

**3. Fix** (Thinking Protocol principle #5):
- Minimum effective intervention — fix the root cause only
- Note exact changes with `file:line` references
- Do NOT refactor, "improve", or "clean up" surrounding code

**4. Verify & Deploy**:
- Confirm the fix addresses the root cause
- Check for side effects in related files from SUMMARY.md
- If the plan touched multiple layers (route → service → frontend), verify all affected layers
- **If applicable**: Follow the server restart and user notification protocols from CLAUDE.md (selective PM2 restart, gentle banner for frontend-only, force refresh for backend changes)

### Maintenance Log (MANDATORY)

**ALWAYS create a maintenance log after every maintenance session — even for "simple" fixes.** The log is how future agents know what changed post-delivery and why. Without it, knowledge is lost the same way it's lost without handoffs.

Find next log number: check existing `*-maintenance-*.md` files. If none, use 001. Otherwise increment the highest.

Write to `docs/justkeepswimming/{plan-name}/YYYY-MM-DD-maintenance-NNN.md`:

```markdown
# Maintenance — {Plan Name} — #{NNN}

**Date**: YYYY-MM-DD HH:MM
**Type**: Bug fix / Change request / Investigation
**Reported**: One-line description of what the user reported or requested

## Investigation

Steps taken to diagnose, with findings at each step:
1. Checked `file.js:42` — found X, expected Y
2. Verified condition Z — confirmed working
3. Root cause: [specific finding with file:line reference]

## Changes Made

| File | Lines | Change |
|------|-------|--------|
| `path/to/file.js` | 42-48 | Description of what changed and why |

## Verification

How the fix was verified:
- Confirmed behavior X by [method]
- Checked related file Y for side effects — [result]

## Deployment

- PM2 restart: [which process, or "none needed"]
- User notification: [gentle banner / force refresh / none]

## Notes

- Anything the user should know
- Concerns about the fix or related fragility
- Related issues to watch for
```

### Maintenance Rules

- **ALWAYS create the log** — no exceptions, no "it was too small to log". Write the log BEFORE reporting the fix to the user.
- **ALWAYS read SUMMARY.md first** — it's your architecture map
- **NEVER skip investigation steps** — even if the fix seems obvious, log what you checked. The "obvious" fix is wrong often enough to justify 30 seconds of verification.
- **Log investigation-only sessions too** — if you investigate and find "no issue", create a log with Type: "Investigation" and document what was checked. The investigation itself is valuable context.
- **For trivial fixes** (single-line change, obvious root cause): you may abbreviate the Investigation section to 1-2 lines, but NEVER skip the log entirely. The Changes and Verification sections are still mandatory.
- **Multiple issues in one session**: Create separate log entries (increment NNN) for each distinct issue
- **Thinking Protocol applies fully** — if you catch yourself jumping to a fix without diagnosing, stop and list conditions first
- **Cross-reference the plan**: When logging changes, note which original plan phase the affected code came from (e.g., "Phase 2 — API routes")
- **No session budget or handoff triggers in maintenance mode** — maintenance work should be short and targeted. If it's not, escalate to a new plan (see "When Maintenance Becomes a Plan" below).
- **If a maintenance investigation runs out of context before resolving**: Write a maintenance log with Type: "Investigation (incomplete)", document everything found so far, and state the next diagnostic step. The next session reads this log and continues.
- **Do NOT update SUMMARY.md after maintenance fixes** — SUMMARY.md documents the original plan's delivered state. Maintenance logs are the source of truth for post-delivery changes. Future agents should read both.

### When Maintenance Becomes a Plan

If a maintenance request reveals scope larger than a targeted fix (e.g., "this needs a refactor" or "3+ files need coordinated changes"), stop and tell the user:

> "This is bigger than a maintenance fix — it needs its own plan. Want me to create a follow-up plan with `/justkeepswimming:go {new-plan-name}`?"

Don't force a multi-phase change through the maintenance protocol. Plans exist for a reason.

</process>