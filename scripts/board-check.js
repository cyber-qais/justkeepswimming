#!/usr/bin/env node
'use strict';

/**
 * jks-board-check — verify a Just Keep Swimming BOARD.md against git truth.
 *
 * The board is self-reported state; this makes it auditable. Checks:
 *   1. Every phase marked merged/shipped has a commit SHA that exists AND is
 *      an ancestor of the integration branch.
 *   2. The Progress line matches the Status table's merged+shipped count.
 *   3. The Shipped SHA (if any) exists and is on the integration branch.
 *   4. Door open  -> the worktree path is in `git worktree list` and the
 *      branch exists. Door closed -> no leftover worktree mentions the plan.
 *   5. Staleness: door open + Updated older than 24h -> warning.
 *
 * Zero dependencies. Exit 0 = OK (warnings allowed), 1 = failures, 2 = usage.
 *
 * Usage:
 *   node scripts/jks-board-check.js <plan-name | path/to/BOARD.md>
 *                                   [--branch <integration-branch>] [--repo <path>]
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function usage(msg) {
    if (msg) console.error(`jks-board-check: ${msg}`);
    console.error('Usage: node jks-board-check.js <plan-name|path/to/BOARD.md> [--branch <name>] [--repo <path>]');
    process.exit(2);
}

function parseArgs(argv) {
    const out = { target: null, branch: null, repo: null };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--branch') out.branch = argv[++i];
        else if (a === '--repo') out.repo = argv[++i];
        else if (!out.target) out.target = a;
        else usage(`unexpected argument: ${a}`);
    }
    if (!out.target) usage('plan name or BOARD.md path required');
    return out;
}

function git(repo, args, opts = {}) {
    try {
        return { ok: true, out: execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim() };
    } catch (e) {
        return { ok: false, out: (e.stdout || '').toString().trim(), err: (e.stderr || e.message || '').toString().trim() };
    }
}

function main() {
    const args = parseArgs(process.argv);
    const repo = args.repo
        ? path.resolve(args.repo)
        : (() => {
            const r = git(process.cwd(), ['rev-parse', '--show-toplevel']);
            if (!r.ok) usage('not inside a git repo (or pass --repo <path>)');
            return r.out;
        })();

    const boardPath = /\.md$/i.test(args.target)
        ? path.resolve(args.target)
        : path.join(repo, 'docs', 'justkeepswimming', args.target, 'BOARD.md');
    if (!fs.existsSync(boardPath)) usage(`board not found: ${boardPath}`);
    const board = fs.readFileSync(boardPath, 'utf8');
    const planName = path.basename(path.dirname(boardPath));

    // Integration branch: --branch, else main, else master.
    let branch = args.branch;
    if (!branch) {
        for (const cand of ['main', 'master']) {
            if (git(repo, ['show-ref', '--verify', '--quiet', `refs/heads/${cand}`]).ok) { branch = cand; break; }
        }
    }
    if (!branch) usage('could not detect integration branch (pass --branch)');

    const fails = [];
    const warns = [];
    let checks = 0;
    const isHex = (s) => /^[0-9a-f]{7,40}$/i.test(s);
    const shaExists = (sha) => git(repo, ['cat-file', '-e', `${sha}^{commit}`]).ok;
    const isAncestor = (sha, ref) => git(repo, ['merge-base', '--is-ancestor', sha, ref]).ok;

    // ── Header fields ──────────────────────────────────────────────
    const doorLine = (board.match(/\*\*Door\*\*:\s*([^\n]+)/) || [])[1] || '';
    const doorOpen = /\(open\)/i.test(doorLine);
    const progress = board.match(/\*\*Progress\*\*:\s*(\d+)\s*\/\s*(\d+)/);
    const shippedRaw = ((board.match(/\*\*Shipped\*\*:\s*([^\n·]+)/) || [])[1] || '').trim();
    const updatedRaw = ((board.match(/\*\*Updated\*\*:\s*([^\n·]+)/) || [])[1] || '').trim();

    // ── Status table ───────────────────────────────────────────────
    const statusSection = (board.split(/^## Status\s*$/m)[1] || '').split(/^## /m)[0];
    const rows = [];
    for (const line of statusSection.split('\n')) {
        const t = line.trim();
        if (!t.startsWith('|')) continue;
        const cells = t.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1 + 1);
        // drop leading/trailing empties from the split
        while (cells.length && cells[0] === '') cells.shift();
        while (cells.length && cells[cells.length - 1] === '') cells.pop();
        if (cells.length < 2) continue;
        const state = cells[1].toLowerCase();
        if (state === 'state' || /^[-: ]+$/.test(state)) continue; // header/separator
        rows.push({ phase: cells[0], state, commit: (cells[4] || '').split(/[\s,]+/)[0] });
    }
    if (!rows.length) warns.push('Status table has no parseable rows');

    // 1. merged/shipped rows need a real, integrated SHA
    for (const row of rows) {
        if (row.state !== 'merged' && row.state !== 'shipped') continue;
        checks++;
        const sha = row.commit;
        if (!isHex(sha)) { fails.push(`"${row.phase}" is ${row.state} but has no commit SHA (found: "${sha || '—'}")`); continue; }
        if (!shaExists(sha)) { fails.push(`"${row.phase}": commit ${sha} does not exist in this repo`); continue; }
        if (!isAncestor(sha, branch)) fails.push(`"${row.phase}": commit ${sha} is NOT on ${branch} — state says ${row.state}`);
    }
    // green rows: SHA (when present) should at least exist
    for (const row of rows) {
        if (row.state === 'green' && isHex(row.commit) && !shaExists(row.commit)) {
            warns.push(`"${row.phase}" (green): commit ${row.commit} not found`);
        }
    }

    // 2. Progress line vs table
    if (progress) {
        checks++;
        const claimed = parseInt(progress[1], 10);
        const total = parseInt(progress[2], 10);
        const actual = rows.filter((r) => r.state === 'merged' || r.state === 'shipped').length;
        if (claimed !== actual) fails.push(`Progress says ${claimed}/${total} merged, but the Status table has ${actual} merged/shipped rows`);
        if (rows.length && total !== rows.length) warns.push(`Progress total is ${total}, Status table has ${rows.length} rows`);
    } else {
        warns.push('no **Progress**: X/Y line found');
    }

    // 3. Shipped SHA
    if (shippedRaw && !/not yet/i.test(shippedRaw)) {
        checks++;
        const sha = shippedRaw.split(/\s+/)[0];
        if (!isHex(sha)) warns.push(`Shipped field is not a SHA: "${shippedRaw}"`);
        else if (!shaExists(sha)) fails.push(`Shipped commit ${sha} does not exist`);
        else {
            const ref = git(repo, ['show-ref', '--verify', '--quiet', `refs/remotes/origin/${branch}`]).ok ? `origin/${branch}` : branch;
            if (!isAncestor(sha, ref)) fails.push(`Shipped commit ${sha} is not on ${ref}`);
        }
    }

    // 4. Door vs worktrees
    const wt = git(repo, ['worktree', 'list', '--porcelain']);
    const wtPaths = wt.ok ? wt.out.split('\n').filter((l) => l.startsWith('worktree ')).map((l) => l.slice(9).trim()) : [];
    if (doorOpen) {
        checks++;
        const m = doorLine.match(/^(\S+)(?:\s+on\s+(\S+))?\s*\(open\)/i);
        const doorPath = m ? m[1] : null;
        const doorBranch = m && m[2] ? m[2] : null;
        if (!doorPath) warns.push(`Door is open but path not parseable: "${doorLine}"`);
        else if (!wtPaths.some((p) => path.resolve(p) === path.resolve(repo, doorPath) || path.resolve(p) === path.resolve(doorPath))) {
            fails.push(`Door says open at ${doorPath}, but no such worktree in \`git worktree list\``);
        }
        if (doorBranch && !git(repo, ['show-ref', '--verify', '--quiet', `refs/heads/${doorBranch}`]).ok) {
            fails.push(`Door branch ${doorBranch} does not exist`);
        }
    } else if (/closed/i.test(doorLine)) {
        checks++;
        const leftover = wtPaths.filter((p) => p.toLowerCase().includes(planName.toLowerCase()));
        if (leftover.length) warns.push(`Door says closed, but worktree(s) mention this plan: ${leftover.join(', ')}`);
    } else if (doorLine) {
        warns.push(`Door line not recognized as open/closed: "${doorLine}"`);
    }

    // 5. Staleness
    if (doorOpen && updatedRaw) {
        const ts = Date.parse(updatedRaw.replace(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/, '$1T$2'));
        if (!Number.isNaN(ts) && Date.now() - ts > 24 * 3600 * 1000) {
            warns.push(`Door is open but the board was last updated ${Math.round((Date.now() - ts) / 3600000)}h ago`);
        }
    }

    // ── Report ─────────────────────────────────────────────────────
    console.log(`Board: ${boardPath}`);
    console.log(`Repo:  ${repo} (integration branch: ${branch})`);
    for (const f of fails) console.log(`  ❌ FAIL: ${f}`);
    for (const w of warns) console.log(`  ⚠️  WARN: ${w}`);
    if (!fails.length) {
        console.log(`  ✅ BOARD OK — ${checks} checks, ${rows.length} phases, ${warns.length} warning(s)`);
        process.exit(0);
    }
    console.log(`  ✖ ${fails.length} failure(s) — the board does not match git truth. Fix the BOARD from git evidence before dispatching.`);
    process.exit(1);
}

main();
