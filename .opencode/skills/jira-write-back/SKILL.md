---
name: jira-write-back
description: >
  Use this skill after Playwright tests finish running — in CI or locally —
  to write results back to the originating Jira Story (and roll up to its
  Epic) via Jira MCP. Triggers when a user says "update Jira with results",
  "post test summary to Jira", "write back results", or when CI completes a
  test run. Adds a structured comment to each Jira Story that originated
  the test plan, containing a pass/fail summary and a link to the spec file
  and HTML report, plus a roll-up comment on the parent Epic. Also updates
  coverage-matrix.json. Always uses Jira MCP — never calls the Jira REST
  API directly.
---

# Jira Write-Back — Test Results

## Core Principles

1. **Comment on the Story, not a new bug** — Results are posted as a
   comment on the Jira Story that originated the plan. Real bugs are
   created separately by the healing-policy skill when needed.
2. **One comment per run** — Do not create multiple comments for the same
   run. If a comment already exists for the run ID, update it instead.
3. **Both pass and fail get a comment** — Every completed run is
   documented.
4. **Trace back via Story + Epic keys** — The Story key and Epic key are
   extracted from the spec file's `test.describe` block
   (e.g. `'Header — KAN-101 (Epic: KAN-45)'`). See the
   epic-story-traceability skill for the regex.
5. **Epic gets a roll-up** — After commenting each Story, post one
   aggregate comment on the parent Epic summarising all its Stories.
6. **Evidence is required** — Every comment links the HTML report and the
   spec file.

---

## Trigger Conditions

Write back to Jira after ANY of the following:
- CI pipeline completes a test run (pass or fail)
- A human manually runs `npx playwright test` and asks for write-back
- The Healer agent finishes a healing pass

Do NOT write back if:
- The run was a dry-run or `--list` only (no tests executed)
- The issue key cannot be found in the spec `describe` block — log a
  warning
- Jira MCP is unavailable — log locally, alert human, do not skip silently

---

## Workflow

### Step 1 — Extract Story and Epic keys from spec files

Read the `test.describe` block in each spec file:

```typescript
test.describe('Header — KAN-101 (Epic: KAN-45)', () => { ... })
//                      ^^^^^^^ Story: KAN-101     ^^^^^^^ Epic: KAN-45

test.describe('Checkout — KAN-17 (Epic: KAN-10)', () => { ... })
//                       ^^^^^^^ Story: KAN-17     ^^^^^^^ Epic: KAN-10
```

Regex:
```text
/— ([A-Z]+-\d+)( \(Epic: ([A-Z]+-\d+)\))?/
```

If no Story key is found, skip write-back for that spec and log:
`WARN: No Jira issue key found in <spec-file> — skipping write-back`

### Step 2 — Collect run results per Story

Group test results by Story key (and note the parent Epic):

```
KAN-101 (Epic: KAN-45) → tests/kan-101-header.spec.ts
  ✅ should show search box
  ✅ should show error for empty search
  ❌ should reject special characters
     Error: getByRole('alert') not found — Jira KAN-304 raised

KAN-17 (Epic: KAN-10) → tests/kan-17-checkout.spec.ts
  ✅ should complete purchase with valid card
  ✅ should show error for expired card
```

### Step 3 — Check for an existing comment for this run

For each Story, fetch the issue with its comments:
```
jira_get_issue: issue_key="KAN-101", comment_limit=50
```
Search the comments for one containing the run ID (GitHub run ID or
local timestamp).

- If found → **edit** that comment (Step 4 uses `jira_edit_comment`)
- If not found → **create** a new comment (Step 4 uses `jira_add_comment`)

### Step 4 — Build and post the comment body

```markdown
## 🤖 Automated Test Results — [✅ PASS / ⚠️ PARTIAL FAIL / ❌ FAIL]

**Run ID:** <github-run-id or local timestamp>
**Environment:** dev | staging
**Triggered by:** CI (GitHub Actions) | Manual run
**Run date:** YYYY-MM-DD HH:MM UTC

---

### Summary

| Result | Count |
|--------|-------|
| ✅ Passed | N |
| ❌ Failed | N |
| ⏭️ Skipped | N |
| **Total** | **N** |

---

### Test Details

**Spec file:** `tests/login.spec.ts`
[View on GitHub](https://github.com/<org>/<repo>/blob/main/tests/login.spec.ts)

| Test | Result | Notes |
|------|--------|-------|
| should log in with valid credentials | ✅ Pass | — |
| should show error for invalid password | ✅ Pass | — |
| should reject email with special characters | ❌ Fail | Locator not found — KAN-304 raised |

---

### Reports & Evidence

- 📊 [HTML Report](https://<org>.github.io/<repo>/playwright-report/)
- 🔍 Traces: Available as CI artifacts for failed tests (14-day retention)
- 🐛 Jira bugs raised this run: KAN-304

---

*Posted automatically by the Playwright Healer Agent via Jira MCP.*
```

Post it via Jira MCP:
```
jira_add_comment: issue_key="KAN-101", body=<formatted comment from above>
```

Or edit the existing comment for the same run:
```
jira_edit_comment: issue_key="KAN-101", comment_id=<id>, body=<updated comment>
```

### Step 4b — Post Epic roll-up comment

After every Story in an Epic has its comment, post ONE roll-up comment on
the parent Epic:

```
jira_add_comment: issue_key="KAN-45", body="## 🤖 Automated Test Roll-up — Epic KAN-45
Run ID: <run-id>
Environment: dev | staging

| Story | Passed | Failed | Skipped | Status |
|-------|--------|--------|---------|--------|
| KAN-101 | N | N | N | ✅ / ⚠️ / ❌ |
| KAN-102 | N | N | N | ✅ / ⚠️ / ❌ |

Coverage matrix: artifacts/release-<version>-<NN>/coverage-matrix.json

Posted automatically by the Playwright framework via Jira MCP."
```

If a roll-up for the same run ID already exists on the Epic, edit it
instead of posting a duplicate.

### Step 5 — Update the coverage matrix

After the run, recompute `coverage-matrix.json`:
```bash
node scripts/build-coverage-matrix.mjs artifacts/release-<version>-<NN>
```
This matches Playwright results to matrix scenarios via `specFile` +
`testName` and refreshes the summary.

### Step 6 — Optionally update a status field

Jira has no first-class "test case" entity — test results are tracked via
comments and, optionally, a custom field. If the team
tracks automated-test health on the ticket via a custom field (e.g.
`Automated Test Status`) or a label, update it via Jira MCP:
```
jira_update_issue: issue_key="KAN-101",
  fields='{"customfield_XXXXX": "PASS"}'
```
Discover the field ID with `jira_search_fields` first. Only do this if
the field exists — never invent custom fields.

### Step 7 — Handle multiple Stories in one run

Post a separate comment on each Story — not one combined comment.
Each Story only receives results for its own spec file(s). Epic roll-ups
are posted once per Epic.

---

## Comment Status Labels

| Outcome | Label |
|---------|-------|
| All tests passed | `✅ PASS` |
| Some failed, bugs raised | `⚠️ PARTIAL FAIL` |
| All tests failed | `❌ FAIL` |
| No executable tests found | `⏭️ SKIPPED` |

---

## Jira MCP Tools Used by This Skill

| Action | Jira MCP tool |
|--------|---------------|
| Get Story + existing comments | `jira_get_issue` |
| Add result comment to Story | `jira_add_comment` |
| Edit result comment (same run) | `jira_edit_comment` |
| Post Epic roll-up comment | `jira_add_comment` |
| Update status custom field | `jira_update_issue` |
| Discover custom field IDs | `jira_search_fields` |

---

## Jira MCP Config

Configured in `opencode.json` at project root (the `jira` server,
Atlassian MCP). `JIRA_API_TOKEN` and `JIRA_USER_EMAIL` must be in
`.env`, `.env.dev`, `.env.staging`, and CI secrets. Never hardcode them.

---

## What This Skill Must Never Do

- Post to a bug ticket — comments go on the originating Story (and its
  Epic roll-up) only.
- Create new bug tickets — that is the healing-policy skill's job.
- Post without linking to the HTML report and spec file.
- Create duplicate comments for the same run — check first, edit if exists.
- Post partial results — wait for the full run to complete.
- Skip the Epic roll-up when more than one Story shares an Epic.
- Invent custom fields on the Jira issue.
- Hardcode Jira API token, site URL, or project keys in any file.
