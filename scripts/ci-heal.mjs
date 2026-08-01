#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, appendFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const RESULTS_JSON = 'test-results/results.json';
const HEALING_LOG = 'healing-log-ci.md';
const REPO = process.env.GITHUB_REPOSITORY ?? 'unknown/repo';
const RUN_ID = process.env.GITHUB_RUN_ID ?? 'local';
const SHA = process.env.GITHUB_SHA ?? 'HEAD';
const ENV = process.env.TEST_ENV ?? 'dev';

// Latest release artifact folder (best-effort) — for decision logging.
function latestReleaseFolder() {
  if (!existsSync('artifacts')) return null;
  const dirs = readdirSync('artifacts').filter((d) => /^release-.+-\d+$/.test(d));
  if (dirs.length === 0) return null;
  dirs.sort();
  return join('artifacts', dirs[dirs.length - 1]);
}

function appendDecision(entry) {
  try {
    const folder = latestReleaseFolder();
    if (!folder) return;
    const logPath = join(folder, 'agent-decision-log.json');
    if (!existsSync(logPath)) return;
    const log = JSON.parse(readFileSync(logPath, 'utf-8'));
    log.push({ timestamp: new Date().toISOString(), source: 'ci-heal', runId: RUN_ID, ...entry });
    writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n', 'utf-8');
  } catch {
    // best-effort — never fail the healer because logging failed
  }
}

function fail(msg) {
  console.error(`[ci-heal] FAIL: ${msg}`);
  process.exit(1);
}

function log(msg) {
  console.log(`[ci-heal] ${msg}`);
}

function readJSON(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', timeout: 300_000, ...opts }).trim();
}

function classifyError(msg) {
  const m = msg.toLowerCase();
  if (m.includes('locator') && m.includes('not found')) return 'LOCATOR_MISSING';
  if (m.includes('strict mode violation') || m.includes('resolved to') && m.includes('elements')) return 'LOCATOR_AMBIGUOUS';
  if (m.includes('tohavetext') || m.includes('tocontaintext')) return 'COPY_MISMATCH';
  if (m.includes('tohaveurl') || m.includes('navigation')) return 'ROUTE_CHANGE';
  if (m.includes('timeout') || m.includes('exceeded')) return 'TIMEOUT';
  if (m.includes('tobe') || m.includes('toequal') || m.includes('assertion')) return 'ASSERTION_LOGIC';
  if (m.includes('net::') || m.includes('fetch failed') || m.includes('api error')) return 'API_ERROR';
  if (m.includes('401') || m.includes('403') || m.includes('unauthorized')) return 'AUTH_FAILURE';
  return 'UNKNOWN';
}

function isAutoFixable(type) {
  return ['LOCATOR_MISSING', 'LOCATOR_AMBIGUOUS', 'COPY_MISMATCH', 'ROUTE_CHANGE', 'TIMEOUT'].includes(type);
}

function isInstalled(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function appendToLog(entry) {
  appendFileSync(HEALING_LOG, entry + '\n---\n', 'utf-8');
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  log(`Environment: ${ENV}, Run: ${RUN_ID}, Repo: ${REPO}`);

  // 1. Read Playwright results
  const results = readJSON(RESULTS_JSON);
  if (!results) {
    log(`No results found at ${RESULTS_JSON} — skipping healer`);
    return;
  }

  // 2. Collect failing specs
  const failingSpecs = new Map(); // specFile -> [{ testName, errorMessage, errorType }]
  for (const suite of results.suites ?? []) {
    for (const spec of suite.specs ?? []) {
      if (spec.ok) continue;
      const specFile = spec.file ?? suite.file ?? 'unknown';
      for (const test of spec.tests ?? []) {
        const lastFail = test.results?.filter(r => r.status === 'failed')?.at(-1);
        if (!lastFail) continue;
        const errorMessage = lastFail.error?.message ?? 'Unknown error';
        const errorType = classifyError(errorMessage);
        if (!failingSpecs.has(specFile)) failingSpecs.set(specFile, []);
        failingSpecs.get(specFile).push({ testName: spec.title, errorMessage, errorType });
      }
    }
  }

  if (failingSpecs.size === 0) {
    log('No failing specs found — nothing to heal');
    return;
  }

  log(`Found ${failingSpecs.size} failing spec(s) with ${[...failingSpecs.values()].flat().length} test(s)`);

  // 3. Check opencode
  if (!isInstalled('opencode')) {
    log('opencode not installed — installing...');
    try {
      run('curl -fsSL https://opencode.ai/install | bash');
    } catch (e) {
      fail(`Failed to install opencode: ${e.message}`);
    }
  }
  log(`opencode version: ${run('opencode --version')}`);

  // 4. Heal each failing spec
  const results_log = [];

  for (const [specFile, failures] of failingSpecs.entries()) {
    const types = [...new Set(failures.map(f => f.errorType))];
    log(`\n═══ Healing: ${specFile} ═══`);
    log(`  Failures: ${failures.length} test(s), types: ${types.join(', ')}`);

    // Check if all failures are auto-fixable
    const allAutoFixable = types.every(t => isAutoFixable(t));
    const hasUnfixable = types.some(t => !isAutoFixable(t));

    if (hasUnfixable) {
      log(`  ⚠️  ${types.filter(t => !isAutoFixable(t)).join(', ')} requires escalation`);
    }

    if (!allAutoFixable && allAutoFixable === false) {
      // Some failures can be auto-fixed, some need escalation
      log(`  Mixed: some auto-fixable, some need escalation`);
    }

    // Run the Healer via opencode
    log(`  Running: opencode run --command /heal-failed-run "${specFile}" --auto`);
    log(`  (this may take a few minutes...)`);

    try {
      const output = run(
        `opencode run --command /heal-failed-run "${specFile}" --auto`,
        { timeout: 600_000 }
      );
      log(`  Output: ${output.slice(0, 500)}${output.length > 500 ? '...' : ''}`);

      // Check if files changed after healing
      const diffStat = run('git diff --stat', { timeout: 10_000 });
      if (diffStat) {
        log(`  Files changed:\n${diffStat}`);
        results_log.push({ specFile, status: 'FIXED', changes: diffStat, failures });
      } else {
        log(`  No files changed — fix not applied or not possible`);
        results_log.push({ specFile, status: 'FAILED', changes: null, failures });
      }
    } catch (e) {
      log(`  ⚠️  Healer failed: ${e.message.slice(0, 200)}`);
      results_log.push({ specFile, status: 'ERROR', changes: null, failures, error: e.message });
    }
  }

  // 5. Check if any files were changed overall
  const totalDiff = run('git diff --stat', { timeout: 10_000 });
  const hasChanges = totalDiff.length > 0;

  appendDecision({
    phase: 'healing',
    agent: 'healer',
    model: 'opencode/mimo-v2.5-free',
    input: [...failingSpecs.keys()].join(', '),
    decision: hasChanges ? 'auto-fixed (PR created)' : 'escalated / no fix applied',
    rationale: `Specs processed: ${results_log.length}; fixed: ${results_log.filter(r => r.status === 'FIXED').length}; not fixed: ${results_log.filter(r => r.status !== 'FIXED').length}`,
    outputArtifacts: [HEALING_LOG],
  });

  if (hasChanges) {
    // Create a fix PR
    log('\n═══ Creating fix PR ═══');
    const branchName = `healer-fix-${RUN_ID}`;
    const commitMsg = `[auto-heal] Fix locator/copy/route issues from run ${RUN_ID}`;

    try {
      run('git config user.name "CI Healer Agent"');
      run('git config user.email "healer@ci.bot"');
      run(`git checkout -b ${branchName}`);
      run(`git add -A`);
      run(`git commit -m "${commitMsg}"`);
      run(`git push origin ${branchName}`);

      const fixedSpecs = results_log
        .filter(r => r.status === 'FIXED')
        .map(r => `- \`${r.specFile}\` — ${[...new Set(r.failures.map(f => f.errorType))].join(', ')}`)
        .join('\n');

      const body = [
        '## Auto-Healed by CI',
        '',
        `Run: ${RUN_ID}`,
        `Environment: ${ENV}`,
        '',
        '### Changes',
        '```',
        totalDiff,
        '```',
        '',
        '### Failing specs healed',
        fixedSpecs || '(none)',
        '',
        '---',
        '_This PR was auto-generated by the CI Healer agent._',
      ].join('\n');

      const bodyFile = `/tmp/pr-body-${RUN_ID}.md`;
      writeFileSync(bodyFile, body, 'utf-8');

      const prUrl = run(
        `gh pr create --base main --head ${branchName} ` +
        `--title "${commitMsg}" ` +
        `--body-file ${bodyFile}`
      );

      log(`  ✅ Fix PR created: ${prUrl}`);
      appendToLog(`## [${new Date().toISOString()}] Fix PR created\nSpecs: ${results_log.filter(r => r.status === 'FIXED').map(r => r.specFile).join(', ')}\nPR: ${prUrl}\nChanges:\n${totalDiff}`);
    } catch (e) {
      log(`  ⚠️  Failed to create PR: ${e.message.slice(0, 200)}`);
      appendToLog(`## [${new Date().toISOString()}] PR creation failed\n${e.message}`);
    }
  } else {
    log('\n═══ No changes from healer ═══');
    appendToLog(`## [${new Date().toISOString()}] No fixes applied\nSpecs: ${[...failingSpecs.keys()].join(', ')}`);
  }

  // 6. Summary
  const fixed = results_log.filter(r => r.status === 'FIXED').length;
  const failed = results_log.filter(r => r.status !== 'FIXED').length;
  console.log('\n' + '═'.repeat(50));
  console.log('CI Healer Summary');
  console.log('═'.repeat(50));
  console.log(`  Specs processed: ${results_log.length}`);
  console.log(`  Auto-fixed:     ${fixed}`);
  console.log(`  Not fixed:      ${failed}`);
  if (hasChanges) console.log(`  PR created with fixes ✅`);
  console.log(`  Healing log: ${HEALING_LOG}`);
  console.log('═'.repeat(50) + '\n');

  // Exit non-zero if there are unfixed failures that should block
  // (healing is best-effort in CI, so always exit 0)
}

main().catch(err => {
  console.error(`[ci-heal] Fatal: ${err.message}`);
  process.exit(1);
});
