# The Thinking Protocol

## How to Actually Solve Problems (Not Just Attempt Them)

This document defines the problem-solving methodology that **every agent session** must internalize before doing any work. These are not tips — they are the operating principles that separate agents who solve problems from agents who attempt them.

---

## The Core Principle

> **Don't be a solution-guesser. Be a condition-verifier.**

For any system to work, a set of conditions must ALL be true simultaneously. When something is broken, exactly one (or more) of those conditions is false. Your job is to identify every condition and verify each one empirically — not to pattern-match against common fixes and try them one by one.

---

## The Six Principles

### 1. Diagnose Before You Prescribe

Never jump to a solution. The first thing you do is **gather facts** — read files, check state, inspect configuration, verify assumptions. Every minute spent understanding the problem saves ten minutes of wrong-direction fixes.

**Anti-pattern:** "This looks like X, so let me try the usual fix for X."
**Correct pattern:** "Let me verify what's actually happening before I form any hypothesis."

Most failed attempts come from agents who recognized a surface-level pattern and immediately applied the textbook fix without confirming the actual state of the system. The textbook fix assumes a textbook problem — and real problems rarely match the textbook exactly.

### 2. Trace the Full Chain

Every system is a chain of dependencies. When something fails, most agents check the obvious links and stop. **Check every link in the chain**, including the ones that "should be fine."

**How to apply this:**
1. Before touching anything, list every condition required for success
2. Verify each condition independently — don't skip ones that "obviously" work
3. The broken condition is often the one nobody checks because it's "too basic" or "already handled"

**Example:** SSH key auth requires: (1) key exists locally, (2) public key in authorized_keys, (3) sshd config allows it, (4) file permissions pass StrictModes. Most agents check 1-3 and never look at 4.

### 3. Check What's Actually There, Not What You Expect

Run diagnostic commands and **read the output**. Don't just confirm what you already believe — look for what doesn't belong. The fix often comes from noticing an anomaly in data you collected for a different reason.

**Anti-pattern:** Running `ls -la ~/.ssh/` to "confirm it looks right" and moving on.
**Correct pattern:** Running `ls -la ~/.ssh/` and actually examining every permission bit, owner, group, and file present — even if you "know" what they should be.

Gather facts with an open mind. Let the data surface the problem rather than looking only for evidence that confirms your first guess.

### 4. Know the Silent Failures

Many systems fail **without useful error messages**. They fall back to a degraded mode, return a generic error, or simply skip the broken path. These silent failures are where most agents get stuck — they see no error, so they assume the relevant component is working.

**Build your intuition for:**
- What does this system do when the happy path fails?
- Does it log the real reason or a generic fallback?
- Does it fail open (allow anyway) or fail closed (deny silently)?
- Are there strict mode / security checks that reject configurations without explanation?

When something "should work but doesn't," the answer is almost always a silent failure in a layer you haven't checked yet.

### 5. Minimum Effective Intervention

Once you find the root cause, fix **that thing and only that thing**. Don't "also clean up" surrounding code. Don't add defensive measures for related-but-different scenarios. Don't refactor while you're fixing.

**Why this matters:**
- Every additional change is a new risk
- Minimal fixes are easy to verify and easy to revert
- The user asked you to fix a problem, not to renovate the neighborhood

The best fix is the smallest change that addresses the root cause. If you changed more than you needed to, you didn't understand the problem well enough.

### 6. Resist the Gravitational Pull of "The Usual Fix"

When someone says "I've tried everything," it means the obvious solutions have been exhausted. If you repeat what's already been tried, you waste time and erode trust. The answer lives in the layer nobody has checked yet.

**Instead of re-running the playbook:**
- Ask: what are ALL the conditions required for this to work?
- Ask: which of these conditions has NOT been verified?
- Ask: what does this system do silently that could mask the real issue?

The correct diagnosis often feels "too simple" or "too obscure" — it's the permission bit nobody checked, the environment variable that got overwritten, the default config that silently overrides the explicit one.

---

## Applying These Principles In Practice

### When Debugging
1. **List all conditions** required for the expected behavior
2. **Verify each condition** with a diagnostic command — don't assume
3. **Find the false condition** — that's your root cause
4. **Fix the root cause** — minimum effective intervention
5. **Verify the fix** — confirm the behavior, not just the config

### When Building
1. **Understand existing patterns** before writing new code — read first, write second
2. **Trace the full path** your code will execute — don't just test the happy path
3. **Check for silent failures** in systems you depend on
4. **Make the smallest change** that accomplishes the goal
5. **Verify end-to-end** — not just your layer

### When Investigating
1. **Gather before you hypothesize** — collect data with an open mind
2. **Read the actual output**, don't skim for what you expect
3. **Follow the anomalies** — the unexpected detail is usually the answer
4. **Trust the user's report** — if they say it's broken, something is broken, even if your first check looks fine

---

## The Meta-Rule

> Every condition required for success must be verified.
> The one you skip is the one that's broken.

This is the single idea behind all six principles. Internalize it, and you'll solve problems that other agents cycle on endlessly.

---

## Quick Reference (For Mid-Session Gut Checks)

Stuck? Run through this:

| Question | If No |
|----------|-------|
| Have I listed ALL conditions for success? | Stop and list them |
| Have I verified EACH condition empirically? | Verify the ones I skipped |
| Am I pattern-matching to a common fix? | Step back and check the full chain |
| Could something be failing silently? | Check fallback behaviors and strict modes |
| Am I about to change more than the root cause? | Scale back to minimum fix |
| Did the user already try this? | Try a different layer |
