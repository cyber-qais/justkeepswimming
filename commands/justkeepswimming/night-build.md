---
name: justkeepswimming:night-build
description: End-of-day autonomous review, fix, build, and deploy pipeline — reviews commits, code reviews, deploys, writes summary, commits and pushes
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - TodoWrite
  - WebFetch
---

<thinking-protocol>
## HOW YOU THINK MATTERS MORE THAN WHAT YOU DO

Apply the Thinking Protocol at every phase of the night build:

1. **Diagnose before you prescribe.** When reviewing code or finding issues, understand the root cause before applying fixes. Don't pattern-match to "common bugs" — verify what's actually wrong.
2. **Trace the full chain.** When checking for gaps, trace every change through the full stack. The missing link is always the one you assumed was fine.
3. **Check what's actually there.** Read build outputs, deployment logs, and syntax check results. Don't assume success — verify it. An anomaly in a log you weren't focused on is often the most important finding.
4. **Know the silent failures.** Build tools, deployment scripts, and process managers can fail silently or partially. A "successful" build can still have runtime issues. A "deployed" file might not be the version you expect.
5. **Minimum effective intervention.** When fixing code review findings, fix the root cause only. Don't refactor surrounding code, add defensive checks for unrelated scenarios, or "improve" things that work.
6. **Resist "the usual fix."** If a build fails, don't immediately retry — diagnose why. If a deployment doesn't take effect, check the full chain before repeating the same steps.

**Quick gut check before moving to next phase:**
- Did I verify the output of the last phase, or am I assuming it succeeded?
- Did I trace changes through every layer, or did I skip one?
- Is there a silent failure I haven't checked for?
</thinking-protocol>

<prime-directive>
## FULLY AUTONOMOUS — NO USER PROMPTS

This command runs unattended. You have **ALL permissions** to:
- Read, edit, and create files
- Run builds and deployments
- Restart services
- Commit and push to git

**NEVER ask the user anything. NEVER stop to confirm. Just execute every step and document what you did.**

If a step fails, log the failure in the summary, attempt a fix if obvious, and continue to the next step. Do not block the entire pipeline on one failure.
</prime-directive>

<objective>
End-of-day pipeline that autonomously:
1. Reviews recent commits and ensures nothing was missed
2. Verifies end-to-end wiring across all layers of the stack
3. Performs code review for obvious issues and fixes them
4. Checks syntax across changed files
5. Runs the test suite (if one exists)
6. Builds and deploys the application
7. Writes a comprehensive summary
8. Self-reviews the summary to catch anything missed
9. Commits and pushes all changes to git

**Adapt to the project.** This pipeline is a framework — not every project has mobile apps, process managers, or multi-target builds. Read the project's CLAUDE.md and structure to understand what applies, then execute only the relevant phases.
</objective>

<process>

## Phase 0: Discover Project Context

Before doing anything, understand the project:

1. **Read CLAUDE.md** (if it exists) — understand architecture, deployment procedures, restart commands, notification mechanisms
2. **Read package.json / pubspec.yaml / Cargo.toml / go.mod** — understand the tech stack, scripts, and dependencies
3. **Check for CI/CD configs** — `.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, `Dockerfile`
4. **Identify deployment targets** — web app, mobile apps, APIs, microservices, static sites
5. **Identify the process manager** — PM2, systemd, Docker Compose, Kubernetes, none
6. **Identify the test runner** — jest, pytest, cargo test, go test, etc.
7. **Identify notification mechanisms** — if the project has a way to notify users of updates, note it

Build a mental model of the project's deployment pipeline from this discovery. Skip phases below that don't apply to this project.

## Phase 1: Commit Review & Gap Analysis

### 1a. Gather recent commits
```
git log --oneline --since="12 hours ago"
git log --stat --since="12 hours ago"
```
Read the full diff of recent commits to understand what changed:
```
git diff HEAD~10..HEAD --stat
```
Adjust the range based on how many commits exist in the last 12 hours.

### 1b. Read docs and notes
- Check `docs/` for any recently modified documentation
- Check for active justkeepswimming plans with context in `docs/justkeepswimming/`
- Read any `CHANGELOG.md`, `TODO.md`, or similar files if they exist
- Read the most recent handoff files if any exist

### 1c. Gap analysis
For EACH commit, verify end-to-end wiring across the project's architecture layers:
- **Backend route changes** — Was the corresponding frontend updated?
- **API endpoint changes** — Were all consumers updated (frontend, mobile, CLI, SDKs)?
- **Database schema/field changes** — Were all readers and writers updated?
- **New files** — Were they registered/imported where needed (route maps, CSS includes, module imports)?
- **New features** — Are they wired end-to-end across all relevant layers?

### 1d. Cross-target sync check
If the project has multiple deployment targets (web + mobile, server + client, etc.):
- For every backend/frontend change, check if corresponding targets need updates
- Search the other codebases for related API calls, models, screens
- If a change was made in one target but not another, **fix it now**

**Log all findings — even if everything looks good, document what you checked.**

## Phase 2: Code Review & Bug Fixes

### 2a. Launch code review
Review all files changed in recent commits. Focus on:
- Logic errors and bugs
- Security vulnerabilities (XSS, injection, auth bypass)
- Missing error handling at system boundaries
- Race conditions in async code
- Patterns that violate project conventions (from CLAUDE.md)
- Missing cache invalidation after mutations

If the `feature-dev:code-reviewer` agent is available, use it. Otherwise, review manually by reading the changed files.

### 2b. Fix issues found
For each issue identified with HIGH confidence:
- Fix it directly
- Document the fix in the summary
- If a fix is risky or ambiguous, **skip it and log it** for the user to review

### 2c. Syntax & lint check
Run syntax validation appropriate to the project's language(s):

**JavaScript/TypeScript:**
```bash
for f in $(git diff HEAD~10..HEAD --name-only -- '*.js' '*.ts' '*.tsx'); do
  [ -f "$f" ] && node --check "$f" 2>&1 || echo "SYNTAX ERROR: $f"
done
```

**Python:**
```bash
for f in $(git diff HEAD~10..HEAD --name-only -- '*.py'); do
  [ -f "$f" ] && python -m py_compile "$f" 2>&1 || echo "SYNTAX ERROR: $f"
done
```

**Dart/Flutter:**
```bash
dart analyze lib/ 2>&1 | head -50
```

**Rust:**
```bash
cargo check 2>&1
```

**Go:**
```bash
go vet ./... 2>&1
```

Run whichever checks match the project. Fix any syntax errors found.

## Phase 3: Test Suite

If the project has tests, run them:

```bash
# Detect and run the appropriate test command
# npm test, pytest, cargo test, go test ./..., flutter test, etc.
```

- If tests pass, log it
- If tests fail, attempt to fix failing tests IF the fix is obvious and relates to recent changes
- If tests are flaky or the failure is pre-existing, log it and continue
- If no test suite exists, skip this phase and note it in the summary

## Phase 4: Build & Deploy

**This phase is entirely project-dependent.** Use what you learned in Phase 0.

### 4a. Version increment (if applicable)
Look for cache-busting version strings, semantic version numbers, or build numbers. Increment appropriately.

### 4b. Build
Run the project's build command(s):
- `npm run build`, `cargo build --release`, `go build`, `flutter build`, etc.
- For multi-target projects, build each target

### 4c. Deploy
Follow the project's deployment procedure from CLAUDE.md or standard conventions:
- Restart services (PM2, systemd, Docker)
- Copy build artifacts to serving directories
- Run database migrations if needed
- Clear caches if needed

### 4d. Notify users (if applicable)
If the project has a user notification mechanism for deployments, use it:
- Force-refresh mechanisms
- Maintenance banners
- Changelog updates
- Slack/webhook notifications

## Phase 5: Write Summary

Create `docs/justkeepswimming/night-build/YYYY-MM-DD-night-build.md` with:

```markdown
# Night Build Summary — YYYY-MM-DD

**Started**: HH:MM
**Completed**: HH:MM
**Status**: SUCCESS / PARTIAL (with details)

## Commits Reviewed
- List of commits reviewed with one-line descriptions

## Gap Analysis Results
- What was checked
- Any gaps found and how they were resolved
- Cross-target sync status

## Code Review Findings
### Fixed
- Issue description — fix applied (file:line)

### Deferred (needs user review)
- Issue description — why it was deferred

## Syntax & Lint Check
- Results of validation

## Test Results
- Pass/fail summary, any fixes applied

## Deployments
- What was built, deployed, and how
- Version numbers, build numbers
- Service restarts performed
- User notifications sent

## Files Changed
| File | Change Type | Description |
|------|-------------|-------------|
| path/to/file | Modified/New | Brief description |

## Notes for User
- Anything that needs manual attention
- Decisions that were deferred
- Warnings or concerns
```

## Phase 6: Self-Review

Re-read the summary you just wrote. For each section:
- Did you actually verify this, or are you assuming?
- Are there any commits whose changes you didn't trace through the full stack?
- Did you check all deployment targets for EVERY change?
- Are there any TODO comments you added that need to be called out?

If you find gaps, go back and address them, then update the summary.

## Phase 7: Commit & Push

### 7a. Check if project docs need updating
- If you discovered new patterns, conventions, or gotchas — update CLAUDE.md
- If build scripts changed or new deployment steps were added — update relevant docs
- **Only update these files if genuinely necessary** — don't force changes

### 7b. Stage and commit
```bash
git add -A
git status
```

Review what's staged. Do not commit files that contain secrets. Create a commit:
```
Night build YYYY-MM-DD: [brief summary of fixes and deployments]

- Reviewed X commits, fixed Y issues
- [deployment summary]
- [any other notable changes]
```

### 7c. Push to remote
```bash
git push origin main
```

If push fails (e.g., remote has new commits), pull and retry:
```bash
git pull --rebase origin main && git push origin main
```

## Completion

Output a final one-line status:
```
Night build complete. Summary: docs/justkeepswimming/night-build/YYYY-MM-DD-night-build.md
```

Or if there were failures:
```
Night build complete with issues. Review: docs/justkeepswimming/night-build/YYYY-MM-DD-night-build.md
```

</process>

<error-handling>
## Failure Recovery

Each phase is independent. If one fails, log it and continue:

| Phase | On Failure |
|-------|-----------|
| Project discovery | Use sensible defaults, continue |
| Commit review | Log "review incomplete" in summary, continue |
| Code review | Log findings so far, continue to build |
| Syntax check | Log errors, continue |
| Tests | Log failures, continue to build |
| Build & deploy | Log error, continue to summary |
| Git push | Log error, leave changes committed locally |

**Never let one failure stop the entire pipeline.**
</error-handling>
