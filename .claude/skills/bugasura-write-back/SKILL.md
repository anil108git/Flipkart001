---
name: bugasura-write-back
description: >
  Use this skill after Playwright tests finish running — in CI or locally —
  to write results back to the originating Bugasura requirement via Bugasura
  MCP. Triggers when a user says "update Bugasura with results", "post test
  summary to Bugasura", "write back results", or when CI completes a test
  run. Adds a structured comment to the Bugasura requirement that originated
  the test plan, containing a pass/fail summary and a link to the spec file
  and HTML report. Also updates the linked test case statuses in Bugasura.
  Always uses Bugasura MCP — never calls Bugasura REST API directly.
---

# Bugasura Write-Back — Test Results

## Core Principles

1. **Comment on the requirement, not the bug** — Results are posted as a
   comment on the Bugasura requirement that originated the plan. Bug tickets
   are created separately by the healing-policy skill when needed.
2. **Update linked test case statuses** — Every test case in Bugasura linked
   to the requirement gets its status updated (Pass / Fail / Blocked) to
   match the actual run result.
3. **One comment per run** — Do not create multiple comments for the same
   run. If a comment already exists for the run ID, update it instead.
4. **Both pass and fail get a comment** — Every completed run is documented.
5. **Trace back via REQ-ID** — The Bugasura requirement ID is extracted from
   the spec file's `test.describe` block (e.g. `'Login — REQ-42'`).

---

## Trigger Conditions

Write back to Bugasura after ANY of the following:
- CI pipeline completes a test run (pass or fail)
- A human manually runs `npx playwright test` and asks for write-back
- The Healer agent finishes a healing pass

Do NOT write back if:
- The run was a dry-run or `--list` only (no tests executed)
- The REQ-ID cannot be found in the spec `describe` block — log a warning
- Bugasura MCP is unavailable — log locally, alert human, do not skip silently

---

## Workflow

### Step 1 — Extract Bugasura REQ-IDs from spec files

Read the `test.describe` block in each spec file:

```typescript
test.describe('Login — REQ-42', () => { ... })
//                              ^^^^^^ → Bugasura requirement: REQ-42

test.describe('Checkout — REQ-17', () => { ... })
//                                 ^^^^^^ → Bugasura requirement: REQ-17
```

If no REQ-ID is found, skip write-back for that spec and log:
`WARN: No Bugasura REQ-ID found in <spec-file> — skipping write-back`

### Step 2 — Collect run results per requirement

Group test results by REQ-ID:

```
REQ-42 → tests/login.spec.ts
  ✅ should log in with valid credentials
  ✅ should show error for invalid password
  ❌ should reject email with special characters
     Error: getByRole('alert') not found — Bugasura BUG-1042 raised

REQ-17 → tests/checkout.spec.ts
  ✅ should complete purchase with valid card
  ✅ should show error for expired card
```

### Step 3 — Update linked test case statuses in Bugasura

For each test result, find the matching Bugasura test case (linked to the
requirement) and update its status via Bugasura MCP:

```
"Update test case linked to requirement REQ-42 with title
'should log in with valid credentials' — set status to PASS"

"Update test case linked to requirement REQ-42 with title
'should reject email with special characters' — set status to FAIL,
add note: 'getByRole alert not found — Bugasura BUG-1042 raised'"
```

If no matching test case exists in Bugasura for a spec test, skip status
update and note it in the comment: `⚠️ No linked Bugasura test case found`.

### Step 4 — Build the comment body

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
| should reject email with special characters | ❌ Fail | Locator not found — BUG-1042 raised |

---

### Reports & Evidence

- 📊 [HTML Report](https://<org>.github.io/<repo>/playwright-report/)
- 🔍 Traces: Available as CI artifacts for failed tests (14-day retention)
- 🐛 Bugasura bugs raised this run: BUG-1042

---

*Posted automatically by the Playwright Healer Agent via Bugasura MCP.*
```

### Step 5 — Post comment via Bugasura MCP

```
"Add a comment to Bugasura requirement REQ-42 with the following content:
<formatted comment from Step 4>"
```

### Step 6 — Handle multiple requirements in one run

Post a separate comment on each requirement — not one combined comment.
Each requirement only receives results for its own spec file(s).

---

## Comment Status Labels

| Outcome | Label |
|---------|-------|
| All tests passed | `✅ PASS` |
| Some failed, bugs raised | `⚠️ PARTIAL FAIL` |
| All tests failed | `❌ FAIL` |
| No executable tests found | `⏭️ SKIPPED` |

---

## Bugasura MCP Tools Used by This Skill

| Action | Bugasura MCP tool |
|--------|------------------|
| Add comment to requirement | `bugasura_add_requirement_comment` |
| Update test case status | `bugasura_update_test_case` |
| List test cases on requirement | `bugasura_list_test_cases` |

---

## Bugasura MCP Config (`mcp.config.json`)

```json
{
  "mcpServers": {
    "bugasura": {
      "url": "https://mcp.bugasura.io/mcp",
      "headers": {
        "Authorization": "Bearer ${BUGASURA_API_KEY}"
      }
    }
  }
}
```

`BUGASURA_API_KEY` must be in `.env.dev`, `.env.staging`, and CI secrets.
Never hardcode it.

---

## What This Skill Must Never Do

- Post to a bug ticket — comments go on requirements only.
- Create new bug tickets — that is the healing-policy skill's job.
- Post without linking to the HTML report and spec file.
- Create duplicate comments for the same run — check first, update if exists.
- Skip test case status updates in Bugasura — both comment and status update
  are required for a complete write-back.
- Post partial results — wait for the full run to complete.
- Hardcode Bugasura API key or project IDs in any file.