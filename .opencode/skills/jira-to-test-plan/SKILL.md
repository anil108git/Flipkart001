---
name: jira-to-test-plan
description: >
  Use this skill when pulling requirements from Jira to create a
  structured test plan. Triggers when a user says "create test plan from
  Jira", "pull requirements from Jira", "plan tests for this issue",
  "plan this story", "plan this epic", or "generate test plan from Jira
  ticket". Uses the Jira MCP to fetch issue, epic, or filter scope and
  acceptance criteria, then produces structured plans per story in
  artifacts/release-<version>-<NN>/ for the Planner agent or Generator
  agent to consume. Use requirements-only-planning skill alongside this
  one when the feature is not yet built.
---

# Jira to Test Plan

## Core Principles

1. **Jira is the single source of truth** — All requirements, acceptance
   criteria, and test scope come from Jira via MCP. Never invent or
   assume scope not present in the ticket.
2. **Requirements map 1:1 to scenarios** — Each acceptance criteria line
   in the Jira issue produces one or more scenarios. Nothing more,
   nothing less unless explicitly asked.
3. **Ticket keys travel with the plan** — The Story key (primary) and Epic
   key (parent) are embedded in the spec file's `test.describe` block so
   write-back, healing, and CI reporting can trace results back to the
   originating ticket. See the epic-story-traceability skill.
4. **Existing issues inform, not constrain** — If Jira has linked
   subtasks, child issues, or test-plan comments on the ticket, use them
   as reference — but the Planner still validates against the live app
   before the Generator writes code.
5. **Five-category coverage** — Every story is planned across positive,
   negative, edge, non-functional, and performance. See the
   test-categorization skill.

---

## Workflow

### Step 1 — Resolve scope via Jira MCP

Use the `epic-story-traceability` skill to resolve the input into a set of
Stories under their parent Epic. Input may be a Story key, an Epic key, or
a JQL filter:

- **Story key** (e.g. `KAN-101`) → fetch it, resolve its parent Epic, and
  fetch sibling Stories under that Epic.
- **Epic key** (e.g. `KAN-45`) → `jira_search` with `parent = KAN-45` (or
  `epicLink = KAN-45`) to list its Stories.
- **JQL filter** (e.g. `fixVersion = "v1.2" AND project = KAN`) →
  `jira_search` and group results into Epics → Stories.

Extract per Story:

- **Issue key** — e.g. `KAN-101` (used in spec `describe` block)
- **Parent Epic key** — e.g. `KAN-45` (used in `describe` block)
- **Summary** — feature name
- **Description** — user story or feature explanation
- **Acceptance Criteria** — the source of truth for scenarios (usually a
  `*Acceptance Criteria*` heading, a checklist, or a numbered list in the
  description)
- **Linked issues / subtasks** — existing related work to be aware of
- **Labels** — informs prioritisation and tags
- **Priority** — informs which scenarios to write first
- **fixVersions** — the release version (per epic-story-traceability skill)

If the issue key is not known, use JQL with Jira MCP:
```
jira_search: jql="project = KAN AND summary ~ 'login' AND status != Closed"
```

### Step 2 — Check for existing coverage in the tickets

Before writing scenarios, look inside the issues for existing planning
artifacts:

- Linked subtasks or child issues that describe test scenarios
- Comments containing test plans or checklists

If existing scenarios are found:
- Use them as the baseline scenario list
- Mark them as `SOURCE: Jira issue <KEY>` in the plan
- Only add new scenarios for AC lines not already covered

If none exist:
- Write scenarios fresh from the AC lines (Step 3)

### Step 3 — Map AC lines to scenarios (5-category)

Each acceptance criteria line = one or more scenarios. Follow the same
rules as the `requirements-only-planning` skill and the
`test-categorization` skill:

- One scenario per distinct user behavior or outcome
- Group related positive/negative cases under the same AC reference
- Do not merge unrelated AC lines into one scenario
- Use Given/When/Then format for all scenarios
- Classify every scenario with `category` (positive/negative/edge/
  non-functional/performance) + `subtype` + `complexity`
- Apply the minimum-coverage rule: ≥1 positive + ≥1 negative + ≥1 edge per
  AC; non-functional/performance added when implied, else `na` with
  rationale

### Step 4 — Write the plan files

Save one plan per Story to
`artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md`
and the Epic aggregate to
`artifacts/release-<version>-<NN>/test-plan-<EPIC>-<version>.md`.
Scaffold the release folder first with `scripts/init-release.mjs` (see the
release-artifacts skill). Use this header per story plan:

```markdown
# Test Plan: [Feature Title]
Story: KAN-101
Epic: KAN-45
Release: v1.2
Status: DRAFT | READY (delete one — READY only after live-app Planner pass)
Created: YYYY-MM-DD
Grounding: Jira issue only | Live app verified (delete one)
Spec file: tests/kan-101-<feature>.spec.ts
Categories: positive [n] | negative [n] | edge [n] | non-functional [n] | performance [n]
NA rationale: [list excluded categories + why]

---
```

The Epic aggregate plan is a roll-up: per-story plan links plus a
categories summary table (see the coverage-matrix in the release-artifacts
skill for the underlying data).

### Step 5 — Embed both keys in the spec describe block

When the Generator produces the spec file, it must use this format:

```typescript
test.describe('[Feature Title] — KAN-101 (Epic: KAN-45)', () => { ... })
```

This is how write-back, healing-policy, coverage-analyst, and CI-reporting
skills trace results back to the originating Jira Story and Epic.

### Step 6 — Sync the plan back to Jira (optional)

After the plan is written and reviewed, use Jira MCP to leave a link to
the plan on the Story:

```
jira_add_comment: issue_key="KAN-101", body="Test plan created — see
artifacts/release-<version>-<NN>/stories/test-plan-KAN-101-<version>.md.
Review before generating specs."
```

This keeps Jira's issue thread in sync with your plan files.

---

## Scenario Template

```markdown
## Scenario [N]: [Short descriptive name]
Source: KAN-101 AC-[line number] | Jira issue [KEY]
Category: positive | negative | edge | non-functional | performance
Subtype: [for non-functional/performance — e.g. accessibility, performance-load]
Complexity: Simple | Medium | Complex
Priority: High | Medium | Low (inherited from issue priority)

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
| `OPEN QUESTION` | Ambiguity in the requirement — raise in Jira comment |

For `OPEN QUESTION` items, use Jira MCP to add a comment on the ticket
asking for clarification:
```
jira_add_comment: issue_key="KAN-101", body="OPEN QUESTION from QA:
Does empty email submission trigger a different error than empty
password? AC-2 is silent on this."
```

---

## Jira MCP Tools Used by This Skill

| Action | Jira MCP tool |
|--------|---------------|
| Find issues/epics/stories by JQL | `jira_search` |
| Get issue details + AC + fixVersion | `jira_get_issue` |
| List project issues | `jira_get_project_issues` |
| List project versions | `jira_get_project_versions` |
| Group epics under parents | `jira_get_project_epic_hierarchy` |
| Add plan/comment to issue | `jira_add_comment` |

---

## Artifacts This Skill Writes

- `artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md`
- `artifacts/release-<version>-<NN>/test-plan-<EPIC>-<version>.md`
- Coverage-matrix scenario rows (see release-artifacts skill)
- Decision-log entries (see release-artifacts skill)

---

## What This Skill Must Never Do

- Invent scenarios not traceable to a Jira AC line.
- Skip fetching the issue — always pull from Jira MCP first.
- Confuse a bug ticket with the requirement ticket — fetch the issue that
  actually contains the AC.
- Mark a plan as `READY` without a live-app Planner pass (unless the
  feature is confirmed live and the Planner has verified it).
- Post to Jira without linking the plan file path.
- Omit the Story and Epic keys from the spec `test.describe` block — this
  breaks write-back and CI traceability.
- Skip a category — record `na` with a rationale instead (test-categorization).
