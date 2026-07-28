---
name: bugasura-to-test-plan
description: >
  Use this skill when pulling requirements from Bugasura to create a
  structured test plan. Triggers when a user says "create test plan from
  Bugasura", "pull requirements from Bugasura", "plan tests for this
  requirement", or "generate test plan from Bugasura ticket". Uses Bugasura
  MCP to fetch requirement details, acceptance criteria, and linked test
  cases, then produces a structured plan in specs/ for the Planner agent
  or Generator agent to consume. Use requirements-only-planning skill
  alongside this one when the feature is not yet built.
---

# Bugasura to Test Plan

## Core Principles

1. **Bugasura is the single source of truth** — All requirements, acceptance
   criteria, and test scope come from Bugasura via MCP. Never invent or
   assume scope not present in the ticket.
2. **Requirements map 1:1 to scenarios** — Each acceptance criteria line
   in the Bugasura requirement produces one or more scenarios. Nothing more,
   nothing less unless explicitly asked.
3. **Ticket ID travels with the plan** — The Bugasura requirement ID is
   embedded in the spec file's `test.describe` block so write-back, healing,
   and CI reporting can trace results back to the originating ticket.
4. **Existing test cases inform, not constrain** — If Bugasura already has
   linked test cases on the requirement, use them as reference — but the
   Planner still validates against the live app before the Generator writes
   code.

---

## Workflow

### Step 1 — Fetch the requirement via Bugasura MCP

Use the Bugasura MCP `bugasura_list_requirements` or
`bugasura_get_requirement` tool to fetch the requirement. Extract:

- **Requirement ID** — e.g. `REQ-42` (used in spec `describe` block)
- **Title** — feature name
- **Description** — user story or feature explanation
- **Acceptance Criteria** — the source of truth for scenarios
- **Linked issues / bugs** — existing known defects to be aware of
- **Linked test cases** — any previously written test cases in Bugasura
- **Priority** — informs which scenarios to write first

If the requirement ID is not known, use natural language with Bugasura MCP:
```
"Find the requirement for the login feature in the Web App project"
```
<cite index="27-1">Bugasura MCP guides you through team → project → sprint selection
automatically using natural language — you don't need to know IDs upfront.</cite>

### Step 2 — Check for existing linked test cases

Before writing scenarios, ask Bugasura MCP:
```
"List test cases linked to requirement REQ-42"
```

If test cases exist:
- Use them as the baseline scenario list
- Mark them as `SOURCE: Bugasura test case <ID>` in the plan
- Only add new scenarios for AC lines not already covered

If no test cases exist:
- Write scenarios fresh from the AC lines (Step 3)

### Step 3 — Map AC lines to scenarios

Each acceptance criteria line = one or more scenarios. Follow the same
rules as the `requirements-only-planning` skill:

- One scenario per distinct user behavior or outcome
- Group related positive/negative cases under the same AC reference
- Do not merge unrelated AC lines into one scenario
- Use Given/When/Then format for all scenarios

### Step 4 — Write the plan file

Save the plan to `specs/<feature-name>.md`. Use this header:

```markdown
# Test Plan: [Feature Title]
Bugasura Requirement: REQ-42
Bugasura Project: [Project Name]
Status: DRAFT | READY (delete one — READY only after live-app Planner pass)
Created: YYYY-MM-DD
Grounding: Bugasura requirements only | Live app verified (delete one)
Spec file: tests/<feature-name>.spec.ts

---
```

### Step 5 — Embed the Bugasura ID in the spec describe block

When the Generator produces the spec file, it must use this format:

```typescript
test.describe('[Feature Title] — REQ-42', () => { ... })
```

This is how write-back, healing-policy, and CI-reporting skills trace
results back to the originating Bugasura requirement.

### Step 6 — Sync test cases back to Bugasura (optional)

After the plan is written and reviewed, use Bugasura MCP to create
corresponding test cases in Bugasura linked to the requirement:

```
"Create a test case in Bugasura under requirement REQ-42 with title
'User logs in with valid credentials', precondition 'User is registered',
steps from the Given/When/Then scenario, and expected result from the Then clause"
```

This keeps Bugasura's test management in sync with your spec files.

---

## Scenario Template

```markdown
## Scenario [N]: [Short descriptive name]
Source: REQ-42 AC-[line number] | Bugasura test case [ID]
Priority: High | Medium | Low (inherited from requirement priority)

Given: [Precondition — user state, page, data]
When:  [Action — behavior terms, no selectors]
Then:  [Expected observable outcome]
TBD:   [Details needed before Generator can run — only in DRAFT plans]
```

---

## Gap Tagging (DRAFT plans only)

Use these tags when the requirement is incomplete — same as
`requirements-only-planning` skill:

| Tag | Meaning |
|-----|---------|
| `TBD` | Missing detail — resolve during live-app Planner pass |
| `ASSUMPTION` | Inferred from context — must be confirmed |
| `SUGGESTED` | Extra coverage not in AC — needs team approval |
| `OPEN QUESTION` | Ambiguity in the requirement — raise in Bugasura comment |

For `OPEN QUESTION` items, use Bugasura MCP to add a comment on the
requirement asking for clarification:
```
"Add a comment to Bugasura requirement REQ-42:
'OPEN QUESTION from QA: Does empty email submission trigger a different
error than empty password? AC-2 is silent on this.'"
```

---

## Bugasura MCP Tools Used by This Skill

| Action | Bugasura MCP tool |
|--------|------------------|
| Find requirement by name | `bugasura_list_requirements` |
| Get requirement details + AC | `bugasura_get_requirement` |
| List linked test cases | `bugasura_list_test_cases` |
| Create test case from scenario | `bugasura_create_test_case` |
| Add clarification comment | `bugasura_add_issue_comment` or `bugasura_add_requirement_comment` |

---

## What This Skill Must Never Do

- Invent scenarios not traceable to a Bugasura AC line.
- Skip fetching the requirement — always pull from Bugasura MCP first.
- Use the Bugasura issue ID (bug ID) instead of the requirement ID —
  requirements and bugs are separate entities in Bugasura.
- Mark a plan as `READY` without a live-app Planner pass (unless the
  feature is confirmed live and the Planner has verified it).
- Create test cases in Bugasura without linking them to the requirement.
- Omit the `REQ-ID` from the spec `test.describe` block — this breaks
  write-back and CI traceability.