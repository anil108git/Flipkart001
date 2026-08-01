---
name: requirements-only-planning
description: >
  Use this skill when asked to write a Playwright test plan and the feature
  is not yet built or the live app is not available via Playwright MCP.
  Triggers when the user says "shift-left", "feature is still in dev",
  "create plan from Jira ticket", "no live app yet", or "draft test plan
  from requirements". Produces a structured DRAFT plan grounded strictly in
  Jira ticket text — no selectors, no assumed UI, no invented flows — across
  the 5 mandatory categories (positive, negative, edge, non-functional,
  performance). Do NOT use this skill when a live app is available — use
  the Planner agent with Playwright MCP directly in that case.
---

# Requirements-Only Test Planning

## Core Principles

1. **Grounding over guessing** — Every scenario must trace to a specific line in the Jira ticket description, acceptance criteria, or attached design/API contract. If it isn't there, don't write it.
2. **Behavior, not implementation** — Write in Given/When/Then terms. No selectors, no field IDs, no assumed UI copy. Those don't exist yet.
3. **Visible uncertainty** — Never silently fill in missing information. Tag every gap explicitly so it gets resolved during live-app re-sync, not discovered as a bug.
4. **Draft status is mandatory** — This plan is never ready for the Generator. It requires human sign-off first, then a live-app re-sync pass by the Planner agent once the feature ships.
5. **Five-category coverage** — positive, negative, edge, non-functional, and performance. Excluded categories are recorded as `na` with a rationale, never silently dropped (see test-categorization skill).

---

## Trigger Conditions

Use this skill when ANY of the following are true:
- Feature is still in development — no testable build exists
- Playwright MCP cannot reach a live dev/staging environment
- User explicitly says "shift-left", "plan from requirements", or "no app yet"
- Jira ticket is the only available input

Do NOT use this skill if a live browser environment is available — switch to the Planner agent with Playwright MCP instead.

---

## Workflow

### Step 1 — Pull the Jira ticket
Use the Jira MCP to fetch the ticket. Extract:
- **Summary** — feature name
- **Description** — user story or feature explanation
- **Acceptance Criteria (AC)** — the source of truth for scenarios
- **Linked designs or API contracts** — if attached, treat as supplementary grounding
- **Out of scope items** — explicitly note what NOT to test

If the Jira MCP is unavailable, ask the user to paste the ticket text directly.

**Grooming gate:** if the ticket has **zero** AC lines, do NOT write a plan.
Stop and follow the `jira-to-test-plan` skill Step 1.5 — raise a
`Question:` bug, link it to the Story/Epic, and mark the Story blocked in
`coverage-matrix.json` + `grooming-queue.json`. Planning resumes via
`/recheck-grooming` once the PM replies.

### Step 2 — Map AC lines to scenarios
Each acceptance criteria line = one or more scenarios. Work through them in order:
- One scenario per distinct user behavior or outcome described
- Group related positive/negative cases under the same AC reference
- Do not merge unrelated AC lines into a single scenario
- **Mandatory coverage**: Every feature MUST include positive, negative, edge, non-functional, and performance assessment (see test-categorization)

### Step 2.1 — Ensure complete coverage (5 categories)
For every AC line, check:
1. **Positive path**: What happens when the user does this correctly?
2. **Negative path**: What happens when the user does this incorrectly?
3. **Edge cases**: What about empty inputs, max lengths, special characters?
4. **Non-functional**: Does this imply accessibility, security, compatibility, usability, or reliability?
5. **Performance**: Does this imply response-time, load, or throughput?

If a negative or edge case is not in the AC, mark it as `SUGGESTED`.
If non-functional or performance does not apply, record `na` with a
rationale — do not drop it silently.

### Step 2.2 — Classify each scenario
Every scenario must be classified by:

| Classification | Values |
|----------------|--------|
| **Category** | Positive, Negative, Edge Case, Non-Functional, Performance |
| **Subtype** | non-functional: accessibility, security, compatibility, usability, reliability; performance: load, response, throughput, resource |
| **Complexity** | Simple, Medium, Complex |

#### Complexity Definitions

| Level | Definition | Examples |
|-------|------------|----------|
| **Simple** | Single action, single assertion | Click button → element visible |
| **Medium** | Multi-step flow, multiple assertions | Fill form → submit → verify result |
| **Complex** | Multi-page flow, conditional logic | Login → cart → checkout → verify order |

### Step 3 — Write scenarios in behavior terms
Use this template for every scenario:

```
Scenario [N]: [Short descriptive name]
Source: [Jira AC line or description reference — e.g. "AC-3"]
Category: [Positive | Negative | Edge Case | Non-Functional | Performance]
Subtype: [only for non-functional/performance — e.g. accessibility, performance-load]
Complexity: [Simple | Medium | Complex]
Given: [Precondition — user state, page, data]
When:  [Action the user takes — no selector/field detail]
Then:  [Expected observable outcome — no exact copy/UI text unless explicitly in AC]
TBD:   [List of implementation details needed before Generator can run this]
```

### Step 4 — Tag all gaps explicitly
Use these standard tags — never guess instead of tagging:

| Tag | Meaning |
|-----|---------|
| `TBD` | Detail not yet known — must be resolved during live-app re-sync |
| `ASSUMPTION` | You inferred something not explicitly stated — must be confirmed |
| `SUGGESTED` | Extra scenario not in AC — clearly optional, needs team approval |
| `OUT OF SCOPE` | Explicitly excluded based on ticket text |
| `OPEN QUESTION` | Ambiguity in the ticket itself — needs BA/Dev clarification |

### Step 5 — Add the plan header
Every plan produced by this skill must start with:

```markdown
# Test Plan: [Feature Name]
Story: [STORY-ID]
Epic: [EPIC-ID]
Release: [version]
Status: DRAFT — requirements-only, NOT verified against implementation
Created: [Date]
Grounding: Jira ticket text only. No live app used.
Categories: positive [n] | negative [n] | edge [n] | non-functional [n] | performance [n]
NA rationale: [excluded categories + why]
Next step: Human (QA/BA) review → Dev completes feature → Planner re-sync with live app
```

Save to `artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md`
(scaffold the release folder with `scripts/init-release.mjs` first — see the
release-artifacts skill).

### Step 6 — Do not proceed to Generator
Stop after writing the plan. Do NOT:
- Generate any `.spec.ts` files from this plan
- Pass this plan to the Generator agent
- Treat this plan as complete or approved

Output only the draft `.md` plan file(s) into the release folder.

---

## Anti-Hallucination Rules

These rules are non-negotiable:

- **No invented selectors** — Never write `#submit-btn`, `.login-form`, `data-testid="email"` or any selector. These don't exist yet.
- **No assumed UI copy** — Never write exact button labels, error messages, or placeholder text unless the ticket explicitly states them.
- **No inferred flows** — If the ticket says "user submits the form" but doesn't describe what happens next, write `Then: [TBD — outcome not specified in AC]` not a guess.
- **Mandatory minimums are not scope creep** — positive/negative/edge minimums are required even when the AC is thin (test-categorization). Anything BEYOND that minimum (extra edge cases, non-functional/performance not implied) is tagged `SUGGESTED` and never asserted as required.
- **No silent category drops** — a category you don't plan must be recorded `na` with a rationale.
- **One source per claim** — Every scenario line must be traceable. If you can't point to the ticket line that justifies it, remove it or tag it `ASSUMPTION`.

---

## Re-sync Workflow (Once Feature is Live)

When the dev team completes the feature:

1. Open the draft plan from `artifacts/release-<version>-<NN>/stories/`
2. Switch to **Planner agent** (`.opencode/agent/planner.md`) with Playwright MCP active
3. Prompt: _"Using this draft plan as input, navigate the live app and resolve all TBD, ASSUMPTION, and OPEN QUESTION markers. Confirm each scenario still matches the AC. Flag anything that diverged from the original ticket."_
4. Planner produces a **verified plan** — all gaps resolved, real selectors/flows observed
5. Human reviews the delta between draft and verified plan
6. Only now hand the verified plan to **Generator** to produce `.spec.ts` files

---

## Example Output

```markdown
# Test Plan: User Login
Story: KAN-101
Epic: KAN-45
Release: v1.2
Status: DRAFT — requirements-only, NOT verified against implementation
Created: 2026-08-02
Grounding: Jira ticket text only. No live app used.
Categories: positive [1] | negative [1] | edge [1] | non-functional [1 na] | performance [1 na]
NA rationale: non-functional (accessibility/security) and performance excluded — not implied by AC
Next step: QA review → Dev completes feature → Planner re-sync with live app

---

## Scenario 1: Successful login with valid credentials
Source: AC-1 — "Registered users can log in with email and password"
Category: Positive
Complexity: Simple
Given: A registered user with valid credentials exists in the system
When:  The user enters their email and password and submits the login form
Then:  The user is redirected to the dashboard
TBD:   Exact dashboard URL, redirect behaviour, session/cookie details

---

## Scenario 2: Login fails with incorrect password
Source: AC-2 — "An error message is shown for invalid credentials"
Category: Negative
Complexity: Simple
Given: A registered user is on the login page
When:  The user enters a valid email with an incorrect password and submits
Then:  An error message is displayed on the page
TBD:   Exact error message text, whether field is cleared, max retry behaviour

---

## Scenario 3: Login form validation — empty fields
Source: AC-2 (implied — "invalid credentials" includes empty submission)
Category: Edge Case
ASSUMPTION: Empty submission triggers inline validation, not a server error
Given: The user is on the login page
When:  The user submits the form without entering any values
Then:  Inline validation errors appear on the required fields
TBD:   Which fields are marked required, validation message text, field highlight style
OPEN QUESTION: Does empty email vs empty password produce different errors? Ticket is silent on this.

---

## SUGGESTED (not in AC — needs team approval before adding)
- Scenario: Login with unregistered email → confirm error message differs from wrong password
- Scenario: Account lockout after N failed attempts → AC does not mention this

## NA Rationale
- Non-functional: accessibility/security/compatibility — not implied by AC
- Performance: no response-time requirement stated
```