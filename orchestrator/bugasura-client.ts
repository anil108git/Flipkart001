import * as fs from 'fs';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BugSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type BugLabel =
  | 'automated-failure'
  | 'healer-escalation'
  | 'flaky'
  | 'env-specific';

export type TestCaseStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED';

export interface BugPayload {
  title: string;
  severity: BugSeverity;
  environment: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  tracePath?: string;
  screenshotPath?: string;
  customFields: {
    specFile: string;
    testName: string;
    failureCategory: string;
    reqId?: string;
  };
  labels: BugLabel[];
}

export interface CommentPayload {
  requirementId: string;
  body: string;
}

export interface TestCaseUpdate {
  requirementId: string;
  testCaseTitle: string;
  status: TestCaseStatus;
  note?: string;
}

export interface BugasuraResponse {
  success: boolean;
  id?: string;           // created bug ID or comment ID
  error?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const BUGASURA_MCP_URL = 'https://mcp.bugasura.io/mcp';

function getApiKey(): string {
  const key = process.env.BUGASURA_API_KEY;
  if (!key) {
    throw new Error(
      '[bugasura-client] BUGASURA_API_KEY env variable is not set.\n' +
      'Set it in .env.dev / .env.staging or as a CI secret.'
    );
  }
  return key;
}

function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getApiKey()}`,
  };
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function mcpCall(
  toolName: string,
  params: Record<string, unknown>
): Promise<BugasuraResponse> {
  // Bugasura MCP uses JSON-RPC 2.0 over HTTP
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: params,
    },
  });

  try {
    const response = await fetch(BUGASURA_MCP_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${text}`,
      };
    }

    const json = await response.json() as {
      result?: { id?: string; content?: Array<{ text?: string }> };
      error?: { message: string };
    };

    if (json.error) {
      return { success: false, error: json.error.message };
    }

    // Extract ID from response content if available
    const content = json.result?.content?.[0]?.text ?? '';
    const idMatch = content.match(/BUG-\d+|REQ-\d+|CMT-\d+/);

    return {
      success: true,
      id: json.result?.id ?? idMatch?.[0],
    };
  } catch (err) {
    return {
      success: false,
      error: `Network error: ${(err as Error).message}`,
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a bug ticket in Bugasura.
 * Used by the Healer when a failure cannot be auto-fixed.
 */
export async function createBug(payload: BugPayload): Promise<BugasuraResponse> {
  console.log(`[bugasura-client] Creating bug: ${payload.title}`);

  // Attach trace and screenshot if they exist on disk
  const attachments: string[] = [];
  if (payload.tracePath && fs.existsSync(payload.tracePath)) {
    attachments.push(payload.tracePath);
  }
  if (payload.screenshotPath && fs.existsSync(payload.screenshotPath)) {
    attachments.push(payload.screenshotPath);
  }

  const result = await mcpCall('bugasura_create_issue', {
    title: payload.title,
    severity: payload.severity,
    type: 'Bug',
    environment: payload.environment,
    description: buildBugDescription(payload),
    labels: payload.labels,
    custom_fields: {
      spec_file: payload.customFields.specFile,
      test_name: payload.customFields.testName,
      failure_category: payload.customFields.failureCategory,
      ...(payload.customFields.reqId && { req_id: payload.customFields.reqId }),
    },
    attachments,
  });

  if (result.success) {
    console.log(`[bugasura-client] Bug created: ${result.id}`);
  } else {
    console.error(`[bugasura-client] Failed to create bug: ${result.error}`);
  }

  return result;
}

/**
 * Posts a test results comment on a Bugasura requirement.
 * Used by write-back after every test run (pass or fail).
 */
export async function postRequirementComment(
  payload: CommentPayload
): Promise<BugasuraResponse> {
  console.log(
    `[bugasura-client] Posting comment to requirement: ${payload.requirementId}`
  );

  const result = await mcpCall('bugasura_add_requirement_comment', {
    requirement_id: payload.requirementId,
    comment: payload.body,
  });

  if (result.success) {
    console.log(`[bugasura-client] Comment posted: ${result.id}`);
  } else {
    console.error(`[bugasura-client] Failed to post comment: ${result.error}`);
  }

  return result;
}

/**
 * Updates a linked test case status in Bugasura.
 * Used by write-back to sync pass/fail status per test.
 */
export async function updateTestCaseStatus(
  payload: TestCaseUpdate
): Promise<BugasuraResponse> {
  console.log(
    `[bugasura-client] Updating test case "${payload.testCaseTitle}" → ${payload.status}`
  );

  const result = await mcpCall('bugasura_update_test_case', {
    requirement_id: payload.requirementId,
    test_case_title: payload.testCaseTitle,
    status: payload.status,
    ...(payload.note && { note: payload.note }),
  });

  if (!result.success) {
    // Non-fatal — log and continue (test case may not exist in Bugasura yet)
    console.warn(
      `[bugasura-client] Could not update test case "${payload.testCaseTitle}": ${result.error}`
    );
  }

  return result;
}

/**
 * Builds the formatted comment body for a test run result.
 * Used by the orchestrator before calling postRequirementComment.
 */
export function buildRunComment(params: {
  reqId: string;
  runId: string;
  environment: string;
  triggeredBy: string;
  passed: number;
  failed: number;
  skipped: number;
  specFile: string;
  repoUrl: string;
  reportUrl: string;
  testDetails: Array<{ name: string; passed: boolean; note?: string }>;
  bugsRaised: string[];
}): string {
  const total = params.passed + params.failed + params.skipped;
  const status =
    params.failed === 0
      ? '✅ PASS'
      : params.passed === 0
        ? '❌ FAIL'
        : '⚠️ PARTIAL FAIL';

  const runDate = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  const testRows = params.testDetails
    .map(t => {
      const icon = t.passed ? '✅ Pass' : '❌ Fail';
      const note = t.note ?? '—';
      return `| ${t.name} | ${icon} | ${note} |`;
    })
    .join('\n');

  const bugsSection =
    params.bugsRaised.length > 0
      ? `- 🐛 Bugasura bugs raised this run: ${params.bugsRaised.join(', ')}`
      : '- 🐛 No bugs raised';

  return `## 🤖 Automated Test Results — ${status}

**Run ID:** ${params.runId}
**Environment:** ${params.environment}
**Triggered by:** ${params.triggeredBy}
**Run date:** ${runDate}

---

### Summary

| Result | Count |
|--------|-------|
| ✅ Passed | ${params.passed} |
| ❌ Failed | ${params.failed} |
| ⏭️ Skipped | ${params.skipped} |
| **Total** | **${total}** |

---

### Test Details

**Spec file:** \`${params.specFile}\`
[View on GitHub](${params.repoUrl}/blob/main/${params.specFile})

| Test | Result | Notes |
|------|--------|-------|
${testRows}

---

### Reports & Evidence

- 📊 [HTML Report](${params.reportUrl})
- 🔍 Traces: Available as CI artifacts for failed tests (14-day retention)
${bugsSection}

---

*Posted automatically by the Playwright Orchestrator.*`;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function buildBugDescription(payload: BugPayload): string {
  return `## Automated Test Failure Report

**Spec file:** \`${payload.customFields.specFile}\`
**Test name:** ${payload.customFields.testName}
**Failure category:** ${payload.customFields.failureCategory}
**Environment:** ${payload.environment}
${payload.customFields.reqId ? `**Bugasura Requirement:** ${payload.customFields.reqId}` : ''}

---

## Steps to Reproduce

${payload.stepsToReproduce}

---

## Expected Result

${payload.expectedResult}

## Actual Result

${payload.actualResult}

---

## Evidence

${payload.tracePath ? `- Trace: \`${payload.tracePath}\`` : '- Trace: not available'}
${payload.screenshotPath ? `- Screenshot: \`${payload.screenshotPath}\`` : '- Screenshot: not available'}

*Created automatically by the Playwright Healer Agent.*`;
}