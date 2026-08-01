---
name: healing-policy
description: >
  Use this skill whenever the Healer agent is invoked after a Playwright
  test failure. Triggers when a user says "heal failing tests", "fix broken
  specs", "tests are failing after deployment", or when CI reports test
  failures. Defines exactly what the Healer is allowed to fix automatically,
  what it must escalate, and how to raise a bug in Jira via Jira MCP
  when escalation is required. The Healer must consult this policy before
  taking any action on a failing test — auto-fixing and escalating without
  this policy is not permitted.
---

# Healing Policy — Playwright Healer Agent

## Core Principles

1. **Fix selectors, never logic** — The Healer patches broken locators and
   outdated assertions caused by UI changes. It never modifies test logic,
   scenario coverage, or expected outcomes.
2. **When in doubt, escalate** — If the Healer cannot determine with
   confidence that a failure is a test maintenance issue (not a real bug),
   it stops and raises a Jira issue. False negatives (missed real bugs)
   are worse than false positives (unnecessary escalations).
3. **One fix per test** — The Healer attempts a single targeted fix per
   failing test. If the fix does not resolve the failure on re-run, it
   escalates — it does not retry with a different fix.
4. **Always re-run after fixing** — A fix is not complete until the test
   passes. Never mark a test as healed without a passing run to confirm.
5. **Never suppress failures** — The Healer must not use `test.skip()`,
   `test.fixme()`, or comment out assertions to make a test pass.
   Suppression always triggers escalation instead.

---

## Decision Tree

When the Healer encounters a failing test, it follows this exact order:

```
Test fails
    │
    ├─ Is the failure consistent across 3 retries?
    │       No → Mark as flaky → escalate with FLAKY label (see below)
    │       Yes ↓
    │
    ├─ Is the error a locator/selector not found error?
    │       Yes → Check if element exists in current DOM via Playwright MCP
    │               Found with different role/name/testid → AUTO-FIX (locator update)
    │               Not found at all → ESCALATE (element may be removed — real change)
    │       No ↓
    │
    ├─ Is the error a URL/navigation mismatch?
    │       Yes → Check if route changed in app via Playwright MCP
    │               Route exists, just changed → AUTO-FIX (URL update)
    │               Route gone entirely → ESCALATE (feature may be removed)
    │       No ↓
    │
    ├─ Is the error a text/copy assertion mismatch?
    │       Yes → Check if copy changed in DOM via Playwright MCP
    │               Copy changed but semantics same → AUTO-FIX (assertion text update)
    │               Copy changed and semantics changed → ESCALATE (behaviour change)
    │       No ↓
    │
    ├─ Is the error a timing/timeout on a known element?
    │       Yes → Check if element eventually appears (slow load) via Playwright MCP
    │               Appears within extended timeout → AUTO-FIX (increase timeout on locator)
    │               Never appears → ESCALATE (element missing — possible regression)
    │       No ↓
    │
    └─ Any other error (assertion logic, data mismatch, unexpected redirect,
       JS console error, API error in network tab) → ESCALATE immediately
```

---

## What the Healer CAN Auto-Fix

These are the only categories where the Healer is permitted to edit spec
or page object files without human approval:

| Category | Example | Allowed fix |
|----------|---------|-------------|
| Stale role locator | `getByRole('button', { name: 'Submit' })` fails — button now says 'Save' | Update name in page object |
| Stale testid | `getByTestId('user-menu')` fails — testid renamed to `user-avatar-menu` | Update testid in page object |
| Stale label | `getByLabel('Email')` fails — label now reads 'Email address' | Update label in page object |
| Route change | `toHaveURL('/login')` fails — route changed to `/auth/login` | Update URL in spec |
| Copy change (same semantics) | `toHaveText('Success')` fails — text now 'Done' | Update assertion text in spec |
| Locator timeout (slow load) | Element takes >30s on staging | Increase locator timeout, add `{ timeout: 60000 }` |

### Fix rules
- **Always fix in the page object, not the spec** — locator changes go in `pages/*.page.ts`, not in `tests/*.spec.ts`.
- **Fix the root cause, not the symptom** — if three tests fail because one page object locator is stale, fix the page object once, not each spec separately.
- **Re-run the full spec file** after a fix — not just the failing test. A locator change may affect multiple tests.
- **Log every fix** in `healing-log.md` (see format below).

---

## What the Healer CANNOT Auto-Fix (Always Escalate)

The Healer must stop and raise a Jira bug for any of the following:

- Element no longer exists in the DOM (possible feature removal or regression)
- Assertion logic is wrong (expected outcome changed — needs QA judgment)
- Test data is invalid or API returns unexpected response
- JS console errors or network failures during test execution
- Test passes on dev but fails on staging (environment-specific issue)
- Failure appears only on specific browser or viewport
- Flaky test (passes and fails non-deterministically across retries)
- Any failure in an auth-specific spec (`test.use({ storageState: ... })` override tests)
- Failure in `global.setup.ts` — auth state cannot be captured
- Healer's first fix attempt did not resolve the failure on re-run

---

## Escalation — Raising a Bug in Jira via Jira MCP

When escalation is required, the Healer uses the Jira MCP to create
a bug ticket in the **KAN** project. It must never skip this step or leave
the failure undocumented.

### Jira MCP config

Configured in `opencode.json` — see [opencode.json](../../../opencode.json). `JIRA_API_TOKEN` and `JIRA_USER_EMAIL` must be set in `.env`, `.env.dev`, `.env.staging`, and CI secrets. Never hardcode them.

### Bug ticket fields — required for every escalation

| Field | Value |
|-------|-------|
| **Project key** | `KAN` |
| **Issue type** | `Bug` |
| **Summary** | `[AUTO] <spec file name> — <test name> failing on <env>` |
| **Priority** | `High` if blocking a feature flow; `Medium` for isolated edge case |
| **Environment** | `dev` or `staging` — whichever the test ran against |
| **Description** | Exact Playwright error message + stack trace, expected vs actual result |
| **Attachments** | Playwright trace file path + screenshot path (from `test-results/`) |
| **Labels** | `automated-failure` + one of: `healer-escalation`, `flaky`, `env-specific` |

### Escalation prompt the Healer sends to Jira MCP
```
jira_create_issue:
  project_key: KAN
  issue_type: Bug
  summary: [AUTO] tests/kan-101-header.spec.ts — "should show error for invalid password" failing on staging
  description: |
    **Environment:** staging

    **Steps to reproduce:**
    <paste exact Playwright error and stack trace>

    **Expected:** Error message visible after invalid password submission
    **Actual:** Element 'alert' role not found in DOM within 30000ms

    **Attachments:** test-results/login-failing/trace.zip, test-results/login-failing/screenshot.png
    **Spec File:** tests/kan-101-header.spec.ts
    **Test Name:** should show error for invalid password
    **Story Key:** KAN-101
    **Epic Key:** KAN-45
    **Failure Category:** LOCATOR_MISSING
  additional_fields: '{"priority": {"name": "High"}, "labels": ["automated-failure", "healer-escalation"]}'
```

The Healer extracts `Story Key` and `Epic Key` from the spec's
`test.describe` block (`'Header — KAN-101 (Epic: KAN-45)'`).

---

## Coverage Matrix + Decision Log Updates

After EVERY action — fix or escalation — the Healer must:

1. **Update the coverage matrix** — find the scenario(s) in
   `coverage-matrix.json` matching the failing test (`specFile` +
   `testName`) and set status:
   - `passed` after a confirmed re-run
   - `escalated` after raising a Jira bug
2. **Append a decision-log entry**:
   ```
   node scripts/append-decision.mjs artifacts/release-<version>-<NN> '{
     "phase": "healing",
     "agent": "healer",
     "model": "opencode/mimo-v2.5-free",
     "input": "<spec> :: <test name>",
     "decision": "AUTO-FIX | ESCALATED (KAN-304) | FLAKY",
     "rationale": "<failure type + reason>"
   }'
   ```
3. The `scripts/ci-heal.mjs` pipeline does the same automatically when run
   in CI.

---

## Healing Log

Every action the Healer takes — fix or escalation — must be appended to
`healing-log.md` in the project root. This is the audit trail.

### Format
```markdown
## [2026-07-25] login.spec.ts — "should show error for invalid password"

**Environment:** staging
**Failure type:** Stale role locator
**Error:** `getByRole('alert')` not found within 30000ms

**Action taken:** AUTO-FIX
**Fix applied:** Updated `errorMessage` locator in `pages/login.page.ts`
  from: `page.getByRole('alert')`
  to:   `page.getByRole('status', { name: 'Error' })`
**Re-run result:** PASSED ✅
**Files changed:** `pages/login.page.ts`

---

## [2026-07-25] checkout.spec.ts — "should complete purchase with valid card"

**Environment:** staging
**Failure type:** Element missing from DOM
**Error:** `getByTestId('payment-submit')` not found — element absent from DOM

**Action taken:** ESCALATED
**Jira issue:** KAN-304
**Reason:** Payment submit button not present — possible regression or feature flag issue
**Files changed:** None

---
```

---

## What the Healer Must Never Do

- Edit test logic, scenario steps, or expected outcomes in spec files.
- Use `test.skip()`, `test.fixme()`, or comment out assertions to silence a failure.
- Attempt more than one fix per test before escalating.
- Mark a test as healed without a confirmed passing re-run.
- Create a Jira issue without attaching the Playwright trace file.
- Delete or archive a failing test — escalate instead.
- Auto-fix failures in auth-specific specs or `global.setup.ts` — always escalate these.
- Modify `playwright.config.ts` retry count to mask flaky tests.
- Raise a Jira issue without the `automated-failure` label.