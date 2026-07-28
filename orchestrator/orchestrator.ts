import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { callLLM } from './llm-client';
import {
  loadSkillContext,
  selectSkillsForFailure,
  REPORTING_SKILLS,
} from './skill-loader';
import {
  createBug,
  postRequirementComment,
  updateTestCaseStatus,
  buildRunComment,
  BugPayload,
} from './bugasura-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type ErrorType =
  | 'LOCATOR_MISSING'
  | 'LOCATOR_AMBIGUOUS'
  | 'COPY_MISMATCH'
  | 'ROUTE_CHANGE'
  | 'TIMEOUT'
  | 'ASSERTION_LOGIC'
  | 'API_ERROR'
  | 'AUTH_FAILURE'
  | 'FLAKY'
  | 'UNKNOWN';

type HealerAction = 'AUTO_FIX' | 'ESCALATE';

interface FailedTest {
  testName: string;
  specFile: string;
  errorMessage: string;
  stackTrace: string;
  tracePath?: string;
  screenshotPath?: string;
  reqId?: string;             // extracted from test.describe block
  retryCount: number;         // how many times it failed across retries
  totalRuns: number;          // how many times it was attempted
}

interface PassedTest {
  testName: string;
  specFile: string;
  reqId?: string;
}

interface PlaywrightResults {
  passed: PassedTest[];
  failed: FailedTest[];
  skipped: string[];
  environment: string;
  runId: string;
}

interface HealerDecision {
  action: HealerAction;
  errorType: ErrorType;
  fixInstructions?: string;     // populated if action is AUTO_FIX
  escalationReason?: string;    // populated if action is ESCALATE
  patchFile?: string;           // file to patch if AUTO_FIX
  patchContent?: string;        // new file content if AUTO_FIX
  bugId?: string;               // populated after Bugasura bug is created
}

interface HealingLogEntry {
  date: string;
  specFile: string;
  testName: string;
  environment: string;
  failureType: ErrorType;
  error: string;
  action: HealerAction;
  fixApplied?: string;
  fileChanged?: string;
  reRunResult?: 'PASSED' | 'FAILED';
  bugasuraTicket?: string;
  escalationReason?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEST_RESULTS_DIR = process.env.TEST_RESULTS_DIR ?? 'test-results';
const PLAYWRIGHT_RESULTS_JSON = path.join(TEST_RESULTS_DIR, 'results.json');
const HEALING_LOG = path.resolve(process.cwd(), 'healing-log.md');
const ENVIRONMENT = process.env.TEST_ENV ?? 'dev';
const RUN_ID = process.env.GITHUB_RUN_ID ?? `local-${Date.now()}`;
const REPO_URL = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`
  : 'https://github.com/your-org/your-repo';
const REPORT_URL = process.env.GITHUB_PAGES_URL
  ?? `${REPO_URL.replace('github.com', 'your-org.github.io')}/playwright-report`;
const TRIGGERED_BY = process.env.GITHUB_ACTIONS ? 'CI (GitHub Actions)' : 'Manual run';

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎭 Playwright Orchestrator starting...');
  console.log(`Environment: ${ENVIRONMENT} | Run ID: ${RUN_ID}\n`);

  // 1. Read Playwright results
  const results = readPlaywrightResults();
  console.log(
    `Results: ${results.passed.length} passed, ` +
    `${results.failed.length} failed, ` +
    `${results.skipped.length} skipped\n`
  );

  // 2. If no failures — just write back results to Bugasura and exit
  if (results.failed.length === 0) {
    console.log('✅ All tests passed — running write-back only\n');
    await writeBackResults(results, []);
    console.log('\n✅ Orchestrator complete — all tests passed');
    return;
  }

  // 3. Process each failing test through the Healer
  console.log(`🔧 Starting healing pass for ${results.failed.length} failing test(s)...\n`);
  const decisions: HealerDecision[] = [];

  for (const failedTest of results.failed) {
    console.log(`\n── Healing: "${failedTest.testName}" (${failedTest.specFile})`);
    const decision = await healTest(failedTest);
    decisions.push(decision);
  }

  // 4. Write back all results (pass + fail) to Bugasura
  await writeBackResults(results, decisions);

  // 5. Print final summary
  printSummary(results, decisions);
}

// ─── Results reader ───────────────────────────────────────────────────────────

function readPlaywrightResults(): PlaywrightResults {
  if (!fs.existsSync(PLAYWRIGHT_RESULTS_JSON)) {
    // If no JSON results file, try to parse from the test-results directory
    console.warn(
      `[orchestrator] results.json not found at ${PLAYWRIGHT_RESULTS_JSON}.\n` +
      `Ensure playwright.config.ts includes: reporter: [["json", { outputFile: "test-results/results.json" }]]`
    );
    return { passed: [], failed: [], skipped: [], environment: ENVIRONMENT, runId: RUN_ID };
  }

  const raw = fs.readFileSync(PLAYWRIGHT_RESULTS_JSON, 'utf-8');
  const json = JSON.parse(raw);

  const passed: PassedTest[] = [];
  const failed: FailedTest[] = [];
  const skipped: string[] = [];

  // Playwright JSON reporter structure: { suites: [{ specs: [{ tests: [...] }] }] }
  for (const suite of json.suites ?? []) {
    const specFile = suite.file as string;
    const reqId = extractReqId(suite.title as string ?? '');

    for (const spec of suite.specs ?? []) {
      const testName = spec.title as string;

      // Check across all retries
      const allResults = (spec.tests ?? []).flatMap((t: { results: unknown[] }) => t.results);
      const totalRuns = allResults.length;
      const failedRuns = allResults.filter((r: { status: string }) => r.status === 'failed').length;
      const passedRuns = allResults.filter((r: { status: string }) => r.status === 'passed').length;

      if (spec.ok) {
        passed.push({ testName, specFile, reqId });
        continue;
      }

      if (failedRuns === 0) {
        skipped.push(testName);
        continue;
      }

      // Get the last failure for error details
      const lastFail = allResults
        .filter((r: { status: string }) => r.status === 'failed')
        .at(-1) as { error?: { message?: string; stack?: string }; attachments?: Array<{ name: string; path: string }> } | undefined;

      const errorMessage = lastFail?.error?.message ?? 'Unknown error';
      const stackTrace = lastFail?.error?.stack ?? '';

      // Find trace and screenshot attachments
      const attachments = lastFail?.attachments ?? [];
      const tracePath = attachments.find((a) => a.name === 'trace')?.path;
      const screenshotPath = attachments.find((a) => a.name === 'screenshot')?.path;

      // Flaky: passed at least once but also failed
      const isFlaky = passedRuns > 0 && failedRuns > 0;

      failed.push({
        testName,
        specFile,
        errorMessage,
        stackTrace,
        tracePath,
        screenshotPath,
        reqId,
        retryCount: failedRuns,
        totalRuns,
        ...(isFlaky && { retryCount: failedRuns }),
      });
    }
  }

  return { passed, failed, skipped, environment: ENVIRONMENT, runId: RUN_ID };
}

// ─── Error classifier ─────────────────────────────────────────────────────────

function classifyError(failedTest: FailedTest): ErrorType {
  const { errorMessage, retryCount, totalRuns } = failedTest;
  const msg = errorMessage.toLowerCase();

  // Flaky: passed at least once in the retry set
  if (retryCount < totalRuns && retryCount > 0) return 'FLAKY';

  if (msg.includes('locator.click') && msg.includes('not found')) return 'LOCATOR_MISSING';
  if (msg.includes('locator resolved to') && msg.includes('elements')) return 'LOCATOR_AMBIGUOUS';
  if (msg.includes('tohavetext') || msg.includes('tocontaintext')) return 'COPY_MISMATCH';
  if (msg.includes('tohaveurl') || msg.includes('navigation')) return 'ROUTE_CHANGE';
  if (msg.includes('timeout') || msg.includes('exceeded')) return 'TIMEOUT';
  if (msg.includes('tobe') || msg.includes('toequal') || msg.includes('assertion')) return 'ASSERTION_LOGIC';
  if (msg.includes('net::') || msg.includes('fetch failed') || msg.includes('api')) return 'API_ERROR';
  if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized')) return 'AUTH_FAILURE';

  return 'UNKNOWN';
}

// ─── Healer ───────────────────────────────────────────────────────────────────

async function healTest(failedTest: FailedTest): Promise<HealerDecision> {
  const errorType = classifyError(failedTest);
  console.log(`  Error type: ${errorType}`);

  // Auth failures and setup failures always escalate — never auto-fix
  if (
    errorType === 'AUTH_FAILURE' ||
    failedTest.specFile.includes('global.setup')
  ) {
    return escalate(failedTest, errorType, 'Auth and setup failures always escalate per healing-policy');
  }

  // Load appropriate skills for this error type
  const skillNames = selectSkillsForFailure(errorType);
  const skillContext = loadSkillContext(skillNames);

  // Call LLM — Healer decides action and provides instructions
  console.log(`  Calling LLM with skills: ${skillNames.join(', ')}`);
  const healerResponse = await callClaudeHealer(failedTest, errorType, skillContext);

  if (healerResponse.action === 'ESCALATE') {
    return escalate(failedTest, errorType, healerResponse.escalationReason ?? 'Healer determined escalation required');
  }

  // Attempt auto-fix
  return applyFix(failedTest, errorType, healerResponse);
}

// ─── LLM Healer call ─────────────────────────────────────────────────────────

async function callClaudeHealer(
  failedTest: FailedTest,
  errorType: ErrorType,
  skillContext: string
): Promise<{ action: HealerAction; fixInstructions?: string; escalationReason?: string; patchFile?: string; patchContent?: string }> {

  // Read the failing spec file and its page object for context
  const specContent = readFileIfExists(failedTest.specFile);
  const pageObjectFile = resolvePageObjectPath(failedTest.specFile);
  const pageObjectContent = readFileIfExists(pageObjectFile);

  const systemPrompt = `You are the Playwright Healer Agent. Your job is to analyse a failing
Playwright test and decide whether to auto-fix it or escalate it to Bugasura.

You must follow the healing-policy skill exactly. Every decision must be
traceable to a specific rule in that skill.

${skillContext}

Respond ONLY with a valid JSON object — no preamble, no markdown fences:
{
  "action": "AUTO_FIX" | "ESCALATE",
  "errorType": "${errorType}",
  "escalationReason": "string (if ESCALATE — required)",
  "fixInstructions": "string (if AUTO_FIX — describe exactly what to change)",
  "patchFile": "string (if AUTO_FIX — relative path of file to edit, e.g. pages/login.page.ts)",
  "patchContent": "string (if AUTO_FIX — the COMPLETE new file content after the fix)"
}`;

  const userPrompt = `Failing test details:

Test name: "${failedTest.testName}"
Spec file: ${failedTest.specFile}
Error type classified as: ${errorType}
Retry count: ${failedTest.retryCount} failures out of ${failedTest.totalRuns} runs

Error message:
${failedTest.errorMessage}

Stack trace:
${failedTest.stackTrace}

Spec file content:
\`\`\`typescript
${specContent}
\`\`\`

Page object content (${pageObjectFile}):
\`\`\`typescript
${pageObjectContent}
\`\`\`

Using the healing-policy skill, decide: should this be AUTO_FIX or ESCALATE?
If AUTO_FIX, provide the complete corrected file content in patchContent.
If ESCALATE, provide the reason in escalationReason.`;

  try {
    const { text } = await callLLM(systemPrompt, userPrompt);

    try {
      // Strip any accidental markdown fences before parsing
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      console.warn('[orchestrator] Could not parse LLM response as JSON — escalating');
      return {
        action: 'ESCALATE',
        escalationReason: `LLM response was not parseable JSON. Raw response: ${text.slice(0, 200)}`,
      };
    }
  } catch (err) {
    console.error(`[orchestrator] LLM call failed: ${(err as Error).message} — escalating`);
    return {
      action: 'ESCALATE',
      escalationReason: `LLM call failed: ${(err as Error).message}`,
    };
  }
}

// ─── Fix applier ──────────────────────────────────────────────────────────────

async function applyFix(
  failedTest: FailedTest,
  errorType: ErrorType,
  healerResponse: { fixInstructions?: string; patchFile?: string; patchContent?: string }
): Promise<HealerDecision> {

  const { patchFile, patchContent, fixInstructions } = healerResponse;

  if (!patchFile || !patchContent) {
    console.warn('  Healer said AUTO_FIX but provided no patch — escalating');
    return escalate(failedTest, errorType, 'Healer returned AUTO_FIX but no patch content');
  }

  const absolutePath = path.resolve(process.cwd(), patchFile);
  const originalContent = readFileIfExists(patchFile);

  console.log(`  Applying fix to: ${patchFile}`);
  fs.writeFileSync(absolutePath, patchContent, 'utf-8');

  // Re-run the full spec file to confirm the fix
  console.log(`  Re-running: ${failedTest.specFile}`);
  const reRunPassed = reRunSpec(failedTest.specFile);

  if (!reRunPassed) {
    // Revert — fix didn't work
    console.warn('  Fix did not resolve failure — reverting and escalating');
    fs.writeFileSync(absolutePath, originalContent, 'utf-8');

    appendHealingLog({
      date: todayStr(),
      specFile: failedTest.specFile,
      testName: failedTest.testName,
      environment: ENVIRONMENT,
      failureType: errorType,
      error: failedTest.errorMessage,
      action: 'AUTO_FIX',
      fixApplied: fixInstructions ?? 'See patch',
      fileChanged: patchFile,
      reRunResult: 'FAILED',
    });

    return escalate(
      failedTest,
      errorType,
      'Auto-fix attempted but did not resolve failure on re-run — patch reverted'
    );
  }

  console.log(`  ✅ Fix confirmed — ${patchFile} updated`);

  const entry: HealingLogEntry = {
    date: todayStr(),
    specFile: failedTest.specFile,
    testName: failedTest.testName,
    environment: ENVIRONMENT,
    failureType: errorType,
    error: failedTest.errorMessage,
    action: 'AUTO_FIX',
    fixApplied: fixInstructions ?? 'See patch',
    fileChanged: patchFile,
    reRunResult: 'PASSED',
  };

  appendHealingLog(entry);

  return {
    action: 'AUTO_FIX',
    errorType,
    fixInstructions,
    patchFile,
    patchContent,
  };
}

// ─── Escalator ────────────────────────────────────────────────────────────────

async function escalate(
  failedTest: FailedTest,
  errorType: ErrorType,
  reason: string
): Promise<HealerDecision> {

  console.log(`  ⬆️  Escalating to Bugasura: ${reason}`);

  const severity = isFeatureBlocking(errorType) ? 'HIGH' : 'MEDIUM';
  const labels: BugPayload['labels'] = ['automated-failure'];

  if (errorType === 'FLAKY') labels.push('flaky');
  else if (errorType === 'AUTH_FAILURE') labels.push('env-specific');
  else labels.push('healer-escalation');

  const bugPayload: BugPayload = {
    title: `[AUTO] ${failedTest.specFile} — "${failedTest.testName}" failing on ${ENVIRONMENT}`,
    severity,
    environment: ENVIRONMENT,
    stepsToReproduce: `${failedTest.errorMessage}\n\n${failedTest.stackTrace}`,
    expectedResult: extractExpected(failedTest.errorMessage),
    actualResult: extractActual(failedTest.errorMessage),
    tracePath: failedTest.tracePath,
    screenshotPath: failedTest.screenshotPath,
    customFields: {
      specFile: failedTest.specFile,
      testName: failedTest.testName,
      failureCategory: errorType,
      ...(failedTest.reqId && { reqId: failedTest.reqId }),
    },
    labels,
  };

  const bugResult = await createBug(bugPayload);
  const bugId = bugResult.id ?? 'UNKNOWN';

  appendHealingLog({
    date: todayStr(),
    specFile: failedTest.specFile,
    testName: failedTest.testName,
    environment: ENVIRONMENT,
    failureType: errorType,
    error: failedTest.errorMessage,
    action: 'ESCALATE',
    bugasuraTicket: bugId,
    escalationReason: reason,
  });

  return {
    action: 'ESCALATE',
    errorType,
    escalationReason: reason,
    bugId,
  };
}

// ─── Write-back ───────────────────────────────────────────────────────────────

async function writeBackResults(
  results: PlaywrightResults,
  decisions: HealerDecision[]
): Promise<void> {

  // Group everything by REQ-ID
  const reqMap = new Map<string, {
    passed: PassedTest[];
    failed: Array<{ test: FailedTest; decision: HealerDecision }>;
    specFile: string;
  }>();

  for (const p of results.passed) {
    if (!p.reqId) continue;
    const entry = reqMap.get(p.reqId) ?? { passed: [], failed: [], specFile: p.specFile };
    entry.passed.push(p);
    reqMap.set(p.reqId, entry);
  }

  results.failed.forEach((f, i) => {
    if (!f.reqId) {
      console.warn(`[orchestrator] No REQ-ID in describe block for: ${f.specFile} — skipping write-back`);
      return;
    }
    const entry = reqMap.get(f.reqId) ?? { passed: [], failed: [], specFile: f.specFile };
    entry.failed.push({ test: f, decision: decisions[i] });
    reqMap.set(f.reqId, entry);
  });

  for (const [reqId, data] of reqMap.entries()) {
    const bugsRaised = data.failed
      .map(f => f.decision.bugId)
      .filter(Boolean) as string[];

    const testDetails = [
      ...data.passed.map(p => ({ name: p.testName, passed: true })),
      ...data.failed.map(f => ({
        name: f.test.testName,
        passed: false,
        note: f.decision.bugId
          ? `${f.decision.errorType} — ${f.decision.bugId} raised`
          : f.decision.errorType,
      })),
    ];

    const comment = buildRunComment({
      reqId,
      runId: RUN_ID,
      environment: ENVIRONMENT,
      triggeredBy: TRIGGERED_BY,
      passed: data.passed.length,
      failed: data.failed.length,
      skipped: 0,
      specFile: data.specFile,
      repoUrl: REPO_URL,
      reportUrl: REPORT_URL,
      testDetails,
      bugsRaised,
    });

    await postRequirementComment({ requirementId: reqId, body: comment });

    // Update individual test case statuses in Bugasura
    for (const p of data.passed) {
      await updateTestCaseStatus({
        requirementId: reqId,
        testCaseTitle: p.testName,
        status: 'PASS',
      });
    }

    for (const { test, decision } of data.failed) {
      await updateTestCaseStatus({
        requirementId: reqId,
        testCaseTitle: test.testName,
        status: 'FAIL',
        note: decision.bugId
          ? `${decision.escalationReason} — ${decision.bugId}`
          : decision.escalationReason,
      });
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractReqId(describeTitle: string): string | undefined {
  // Matches: 'Login — REQ-42' or 'Checkout - REQ-17'
  const match = describeTitle.match(/[—\-]\s*(REQ-\d+)/i);
  return match ? match[1] : undefined;
}

function resolvePageObjectPath(specFile: string): string {
  // tests/login.spec.ts → pages/login.page.ts
  const base = path.basename(specFile).replace('.spec.ts', '.page.ts');
  return path.join('pages', base);
}

function readFileIfExists(filePath: string): string {
  const abs = path.resolve(process.cwd(), filePath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : '// File not found';
}

function reRunSpec(specFile: string): boolean {
  try {
    execSync(`npx playwright test ${specFile} --reporter=list`, {
      stdio: 'inherit',
      timeout: 120_000,
    });
    return true; // exit 0 = all passed
  } catch {
    return false; // non-zero exit = still failing
  }
}

function isFeatureBlocking(errorType: ErrorType): boolean {
  return ['LOCATOR_MISSING', 'ROUTE_CHANGE', 'AUTH_FAILURE', 'API_ERROR'].includes(errorType);
}

function extractExpected(errorMessage: string): string {
  const match = errorMessage.match(/expected[:\s]+(.+?)(?:\n|actual|$)/i);
  return match ? match[1].trim() : 'See error message';
}

function extractActual(errorMessage: string): string {
  const match = errorMessage.match(/(?:received|actual)[:\s]+(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : 'See error message';
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function appendHealingLog(entry: HealingLogEntry): void {
  const separator = '\n---\n';

  const block = entry.action === 'AUTO_FIX'
    ? `\n## [${entry.date}] ${entry.specFile} — "${entry.testName}"\n
**Environment:** ${entry.environment}
**Failure type:** ${entry.failureType}
**Error:** ${entry.error.slice(0, 200)}

**Action taken:** AUTO-FIX
**Fix applied:** ${entry.fixApplied ?? 'See patch'}
**File changed:** \`${entry.fileChanged}\`
**Re-run result:** ${entry.reRunResult === 'PASSED' ? 'PASSED ✅' : 'FAILED ❌'}
`
    : `\n## [${entry.date}] ${entry.specFile} — "${entry.testName}"\n
**Environment:** ${entry.environment}
**Failure type:** ${entry.failureType}
**Error:** ${entry.error.slice(0, 200)}

**Action taken:** ESCALATED
**Bugasura ticket:** ${entry.bugasuraTicket ?? 'N/A'}
**Reason:** ${entry.escalationReason ?? 'See logs'}
**Files changed:** None
`;

  fs.appendFileSync(HEALING_LOG, block + separator, 'utf-8');
}

function printSummary(results: PlaywrightResults, decisions: HealerDecision[]): void {
  const fixed = decisions.filter(d => d.action === 'AUTO_FIX' && d.patchFile);
  const escalated = decisions.filter(d => d.action === 'ESCALATE');

  console.log('\n' + '═'.repeat(50));
  console.log('Orchestrator Summary');
  console.log('═'.repeat(50));
  console.log(`✅ Passed:    ${results.passed.length}`);
  console.log(`🔧 Auto-fixed: ${fixed.length}`);
  console.log(`⬆️  Escalated: ${escalated.length}`);

  if (fixed.length > 0) {
    console.log('\nAuto-fixed:');
    fixed.forEach(d => console.log(`  ✅ Fixed in ${d.patchFile}`));
  }

  if (escalated.length > 0) {
    console.log('\nEscalated to Bugasura:');
    escalated.forEach(d =>
      console.log(`  🐛 ${d.bugId ?? 'N/A'} — ${d.escalationReason?.slice(0, 80)}`)
    );
  }

  console.log(`\nHealing log: ${HEALING_LOG}`);
  console.log('═'.repeat(50) + '\n');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('[orchestrator] Fatal error:', err);
  process.exit(1);
});