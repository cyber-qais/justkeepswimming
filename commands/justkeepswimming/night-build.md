---
name: justkeepswimming:night-build
description: End-of-day autonomous review, fix, verify, and ship pipeline — parallel code review of the day's commits, gap analysis, fixes, deploy, summary
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - SendMessage
  - TodoWrite
  - WebFetch
---

<thinking-protocol>
## HOW YOU THINK MATTERS MORE THAN WHAT YOU DO

Apply the Thinking Protocol at every phase of the night build:

1. **Diagnose before you prescribe.** Understand the root cause before applying fixes — verify what's actually wrong, don't pattern-match to "common bugs."
2. **Trace the full chain.** When checking for gaps, trace every change through the full stack. The missing link is always the one you assumed was fine.
3. **Check what's actually there.** Read build outputs, deploy logs, and check results. Don't assume success — verify it.
4. **Know the silent failures.** Build tools and process managers fail silently or partially. A "deployed" file might not be the version you expect.
5. **Minimum effective intervention.** Fix the root cause only. No drive-by refactors at 3 AM.
6. **Resist "the usual fix."** If a build fails, diagnose why before retrying.

**Gut check before each phase:** did I verify the last phase's output, or assume it? Did I trace every layer? Is something failing silently?
</thinking-protocol>

<prime-directive>
## FULLY AUTONOMOUS — NO USER PROMPTS

This command runs unattended. You have **ALL permissions** to read/edit/create files, run builds and deployments, restart services, and commit and push to git.

**NEVER ask the user anything. NEVER stop to confirm.** Execute every phase and document what you did. If a step fails, log it, attempt an obvious fix, and continue — one failure never blocks the pipeline.

**But autonomous ≠ exempt:** the project's own rules (CLAUDE.md, CONTRIBUTING) hold at 3 AM exactly as at 3 PM. Plain commit messages — no attribution trailers. Prefer staging the specific files you touched; sweep-stage (`git add -A`) only when you're certain the checkout is exclusively yours.
</prime-directive>

<objective>
End-of-day sweep: review everything that landed today with fresh adversarial eyes, close the gaps, fix what's confidently fixable, verify, deploy, and leave a summary a human can read over coffee. You are the scrum master — reviews run as parallel subagents; your context holds findings and decisions, not file dumps.

**Adapt to the project.** This pipeline is a framework — not every project has mobile apps, process managers, or multi-target builds. Discover what applies, execute only the relevant phases.
</objective>

<process>

## Phase 0: Discover Project Context

1. **Read CLAUDE.md** (if it exists) — architecture, deploy procedures, restart commands, notification mechanisms, hard rules.
2. **Read package.json / pubspec.yaml / Cargo.toml / go.mod** — stack, scripts, test runner.
3. **Check CI/CD configs** — `.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, `Dockerfile`.
4. **Identify deployment targets and the process manager** (PM2, systemd, Docker, k8s, none).
5. **Baseline**: read the newest `docs/justkeepswimming/night-build/*.md` summary and use its **end SHA** as the review baseline. No prior summary → `--since="24 hours ago"`.
6. **Respect open doors**: note active plans in `docs/justkeepswimming/*/BOARD.md` — do NOT touch files a live plan's board claims; that's another session's open workspace.

`git log --oneline {baseline}..HEAD` + `git diff --stat {baseline}..HEAD`. **Empty? Write a one-line summary ("no commits since {baseline}") and stop — a no-op night build is a success.**

## Phase 1: Parallel review fan-out

Dispatch reviewer subagents over the changed files **in one message** — each returns ≤20 lines (verdict, confirmed issues with file:line + a concrete failure scenario each, nitpicks separate):

- **Correctness**: logic errors, edge cases, races in async code, missing error handling at boundaries.
- **Conventions**: violations of the project's CLAUDE.md rules, missing cache invalidation after mutations, pattern drift.
- **Security**: XSS, injection, auth bypass, secrets in diffs, unauthenticated exposure.
- **Wiring/gaps**: for each commit, trace end-to-end — routes ↔ frontend ↔ registrations ↔ imports ↔ every consumer (mobile/CLI/SDK targets). New files registered where the project requires? Report gaps, not narration.

No Agent tool available? Do the same reviews yourself, sequentially, same report discipline.

## Phase 2: Fix round

- **High-confidence issues**: fix directly. Verify each fix with the language's syntax check (`node --check`, `python -m py_compile`, `dart analyze`, `cargo check`, `go vet`) plus targeted tests.
- **Ambiguous/risky findings**: do NOT fix — log under "Deferred (needs user)" with file:line and the failure scenario.
- **Cross-target gaps** (web changed, mobile didn't): fix now if confident, else defer with specifics.

## Phase 3: Test suite

Run the project's tests (`npm test`, `pytest`, `cargo test`, `go test ./...`, `flutter test`). Fix failures only when the fix is obvious and related to recent changes; pre-existing/flaky failures get logged, not chased. No test suite → note it and continue.

## Phase 4: Build & deploy

Entirely project-dependent — use Phase 0's discovery:

1. Version/cache-bust increments where the project uses them.
2. Build each relevant target (`npm run build`, `flutter build web`, `cargo build --release`, …).
3. Deploy per the project's procedure: restart services, copy artifacts, run migrations. **A queued/batched deploy (projects with a deploy cadence) counts as SUCCESS — don't force immediate deploys overnight.**
4. Notify users only through the project's sanctioned mechanism, and only if something user-facing actually shipped. Prefer gentle notices over force-refresh.

## Phase 5: Summary

Write `docs/justkeepswimming/night-build/YYYY-MM-DD-night-build.md`:

```markdown
# Night Build — YYYY-MM-DD
**Window**: HH:MM–HH:MM · **Status**: SUCCESS | PARTIAL · **Baseline**: {sha} → **End**: {sha}

## Commits reviewed
- {sha} {one-liner} — {clean | issues found}

## Review findings
### Fixed
- {issue} → {fix} (`file.js:42`)
### Deferred (needs user)
- {issue + failure scenario + file:line} — why deferred

## Gap analysis
- Wiring checked: {results} · Cross-target: {in sync | fixed | deferred}

## Verification
- Syntax / tests / lint — {results}

## Deploy
- {what shipped, how, versions | queued | skipped (nothing user-facing)}
- Notification: {mechanism | none}

## For the user
- {anything needing human eyes, deferred decisions, concerns}
```

## Phase 6: Self-review

Re-read the summary: did you verify each claim or assume it? Any commit not traced end-to-end? Any deployment target skipped? Fix the gaps, update the summary.

## Phase 7: Commit & push

1. Update CLAUDE.md/docs only if you discovered genuinely new patterns or gotchas.
2. Stage your files (`git add {paths}` — see prime-directive), review `git status`, never commit secrets. Commit: `night build YYYY-MM-DD: reviewed N commits, fixed M issues` — plain message, no trailers.
3. `git push origin main`. Rejected? `git pull --rebase origin main && git push origin main` (never force).

## Completion

One line: `Night build complete. Summary: docs/justkeepswimming/night-build/YYYY-MM-DD-night-build.md` (add "with issues" if PARTIAL).

</process>

<error-handling>
## Failure Recovery

| Phase | On failure |
|-------|-----------|
| Discovery | Sensible defaults, continue |
| Review agents | Log partial findings, continue |
| A fix breaks verification | Restore that fix's files to HEAD state, log as deferred, continue |
| Tests | Log failures, continue to build |
| Build & deploy | Log error, continue to summary |
| Push | Leave committed locally, flag loudly in summary |

**Never let one failure stop the pipeline. Never "fix" a failure by escalating restarts.**
</error-handling>
