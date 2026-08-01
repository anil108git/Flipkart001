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

1. **Fix locators, never semantics** — The Healer patches broken locators
   and timeout issues caused by UI changes, in page objects only. It never
   modifies assertions, expected values, copy text, URLs, test logic,
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
    ├─ Is the error a locator ambiguity error (strict-mode violation)?
    │       Yes → Identify the correct element via Playwright MCP
    │               Specific locator derivable → AUTO-FIX (locator disambiguation)
    │               Cannot disambiguate safely → ESCALATE
    │       No ↓
    │
    ├─ Is the error a timing/timeout on a known element?
    │       Yes → Check if element eventually appears (slow load) via Playwright MCP
    │               Appears within extended timeout → AUTO-FIX (increase timeout on locator)
    │               Never appears → ESCALATE (element missing — possible regression)
    │       No ↓
    │
    └─ ANY other error (URL/navigation mismatch, copy/text mismatch, assertion
       logic, data mismatch, unexpected redirect, JS console error, API error)
       → ESCALATE immediately
```

**Copy/text mismatches and URL/navigation mismatches ALWAYS escalate** —
they are semantic changes that need QA judgment. Only locator and timeout
issues are eligible for auto-fix. See the What the Healer CAN Auto-Fix
table below.

---

## What the Healer CAN Auto-Fix

These are the ONLY categories where the Healer is permitted to edit page
object files without human approval. **The Healer NEVER edits spec files.**

| Category | Example | Allowed fix |
|----------|---------|-------------|
| Stale role locator | `getByRole('button', { name: 'Submit' })` fails — button now says 'Save' | Update name in page object |
| Stale testid | `getByTestId('user-menu')` fails — testid renamed to `user-avatar-menu` | Update testid in page object |
| Stale label | `getByLabel('Email')` fails — label now reads 'Email address' | Update label in page object |
| Locator ambiguity | Strict-mode violation — locator resolves to 2+ elements | Disambiguate in page object (scope to region / add name) |
| Locator timeout (slow load) | Element takes >30s on staging | Increase locator timeout, add `{ timeout: 60000 }` |

### Fix rules
- **Locator changes go in the page object, NEVER the spec** — edits are
  restricted to `pages/*.page.ts`. Spec files are read-only for the Healer.
- **Never change assertions, expected values, copy text, or URLs.** A
  `toHaveText`/`toHaveURL`/`toBe` mismatch is a semantic change — escalate.
- **Fix the root cause, not the symptom** — if three tests fail because one page object locator is stale, fix the page object once, not each spec separately.
- **Re-run the full spec file** after a fix — not just the failing test. A locator change may affect multiple tests.
- **Log every fix** in `healing-log.md` (see format below).

---

## What the Healer CANNOT Auto-Fix (Always Escalate)

The Healer must stop and raise a Jira bug for any of the following:

- Element no longer exists in the DOM (possible feature removal or regression)
- Assertion logic is wrong (expected outcome changed — needs QA judgment)
- Copy/text assertion mismatch (`toHaveText`, `toContainText`) — even if the
  new copy "looks equivalent" — semantic change needs QA judgment
- URL/navigation assertion mismatch (`toHaveURL`) — route changes escalate
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
| **Summary** | `[AUTO] <human-readable symptom — e.g. "Login page shows no error for invalid password" (staging)>` |
| **Priority** | `High` if blocking a feature flow; `Medium` for isolated edge case |
| **Environment** | `dev` or `staging` — whichever the test ran against |
| **Description** | **Human-readable** bug report in plain language (see template below). NO raw stack traces or Playwright error dumps in the description. |
| **Attachments** | Playwright trace file path + screenshot path (from `test-results/`) — uploaded via `jira_update_issue` |
| **Labels** | `automated-failure` + one of: `healer-escalation`, `flaky`, `env-specific` |

### Writing the description — human-readable first

The bug description must be written for a **human QA/developer**, not as a raw
Playwright dump. Translate the technical failure into plain language:

1. **What the user was doing** (user action, not locators).
2. **What the user expected to see/happen.**
3. **What actually happened** (observable symptom).
4. **How to reproduce** in a few plain steps.
5. **Evidence** — the trace and screenshot are ATTACHED as files, not pasted
   into the description. A short technical note (error type + spec/test) may
   appear at the bottom for engineers, but never a full stack trace.

**Raw technical details never go in the Jira description.** They live in the
attached trace.zip and screenshot — anyone investigating opens the attachment
instead of reading a stack dump.

### Escalation prompt the Healer sends to Jira MCP
```
jira_create_issue:
  project_key: KAN
  issue_type: Bug
  summary: [AUTO] Login page shows no error message for invalid password (staging)
  description: |
    **Environment:** staging

    **What the user was doing:** Submitting the login form with an invalid password.

    **Expected:** An error message is displayed explaining the password is incorrect.

    **Actual:** No error message appears — the page silently stays put, leaving
    the user unsure whether the form submitted.

    **Steps to reproduce:**
    1. Open the login page on staging.
    2. Enter a valid email and a wrong password.
    3. Click "Sign in".
    4. Observe: no error message is shown.

    **Impact:** Users cannot tell why their login failed; they may attempt
    repeated guesses or give up.

    **Technical note:** Failed Playwright assertion — expected a visible alert
    after invalid submission, none rendered. Full evidence in attached trace +
    screenshot.
    Spec: tests/kan-101-header.spec.ts — "should show error for invalid password"
    Story Key: KAN-101 · Epic Key: KAN-45
  additional_fields: '{"priority": {"name": "High"}, "labels": ["automated-failure", "healer-escalation"]}'
```

The Healer extracts `Story Key` and `Epic Key` from the spec's
`test.describe` block (`'Header — KAN-101 (Epic: KAN-45)'`).

### After the bug is created — link it and attach evidence

1. **Link the bug to the Story and Epic** via `jira_link_issues`
   (requires the `jira_links` toolset — see `opencode.json` `TOOLSETS`):
   ```
   jira_link_issues: issue_key=<BUG_KEY>, link_to_key=<STORY>
   jira_link_issues: issue_key=<BUG_KEY>, link_to_key=<EPIC>
   ```
2. **Upload the Playwright trace and screenshot** via
   `jira_update_issue` with attachments (requires the `jira_attachments`
   toolset):
   ```
   jira_update_issue:
     issue_key: <BUG_KEY>
     attachments: ["test-results/<folder>/trace.zip", "test-results/<folder>/screenshot.png"]
   ```
   If a trace does not exist, attach whatever evidence exists (screenshot,
   error file) rather than skipping entirely.
3. **Record the bug link** on the coverage matrix scenario: set
   `status: "escalated"` and add `bugKey`, `storyKey`, `epicKey` fields.

---

## Coverage Matrix + Decision Log Updates

After EVERY action — fix or escalation — the Healer must:

1. **Update the coverage matrix** — find the scenario(s) in
   `coverage-matrix.json` matching the failing test (`specFile` +
   `testName`) and set status:
   - `passed` after a confirmed re-run
   - `escalated` after raising a Jira bug (also add `bugKey`, `storyKey`,
     `epicKey` fields on the scenario)
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

- Edit test logic, scenario steps, assertions, expected values, copy text,
  or expected outcomes in spec files — spec files are read-only for the Healer.
- Edit a page object for anything other than a locator/selector or timeout change.
- Use `test.skip()`, `test.fixme()`, or comment out assertions to silence a failure.
- Attempt more than one fix per test before escalating.
- Mark a test as healed without a confirmed passing re-run.
- Create a Jira issue without linking it to the Story/Epic and attaching the Playwright trace file.
- Paste raw Playwright errors, stack traces, or technical dumps into the Jira bug description — write human-readable plain language and attach the evidence files instead.
- Create a Jira issue with a technical-only summary (`spec.ts — test name failing`) — use a human-readable symptom in the summary.
- Delete or archive a failing test — escalate instead.
- Auto-fix failures in auth-specific specs or `global.setup.ts` — always escalate these.
- Modify `playwright.config.ts` retry count to mask flaky tests.
- Raise a Jira issue without the `automated-failure` label.