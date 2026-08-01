---
name: epic-story-traceability
description: >
  Use this skill whenever resolving a Jira Epic/Story/issue-key/filter into
  release scope, or when writing the test.describe block that carries the
  Story + Epic keys. Triggers when a user says "plan release for KAN-45",
  "create test plan for epic", "resolve this Jira filter", "trace story to
  epic", or when a Planner/Generator needs the canonical describe-block
  format. Defines the Jira epic→story model, JQL filter patterns,
  release-version-from-fixVersion rule, and the spec-file traceability
  convention.
---

# Epic/Story Traceability — Jira Model & Spec Convention

## Core Principles

1. **Epic is the release container** — An Epic groups Stories for one
   feature area. A release is scoped by the Epics (and their Stories)
   that carry a given `fixVersion`.
2. **Story is the testable unit** — ACs live on Stories, so scenarios are
   planned per Story. The Epic gets an aggregate plan + rolled-up results.
3. **Traceability is two-level** — every spec `test.describe` block carries
   BOTH the Story key (primary) and the Epic key (parent), so
   write-back, healing, and coverage-matrix can trace test → story → epic.
4. **Release version comes from Jira** — derived from the `fixVersion` on
   the tickets in scope. If absent, prompt the user — never invent one.

---

## Jira Data Model

```
Epic (KAN-45)                          ← release container
 ├─ Story (KAN-101)                    ← testable unit — has ACs
 │    ├─ Subtask (optional)
 │    └─ child issues (optional)
 └─ Story (KAN-102)
```

- An **Epic** has issue type `Epic`.
- A **Story** has issue type `Story` and links to its parent Epic via
  `parent`/`epicLink`.
- A **Subtask** (`Subtask`, not `Sub-task`) links via `parent`.

---

## Verified Jira MCP Tools (mcp-atlassian)

| Action | Tool | Key params |
|--------|------|-----------|
| Get an issue (incl. fixVersion, epic link) | `jira_get_issue` | `issue_key`, `fields: "*all"` or `fixVersions`, `expand`, `comment_limit` |
| Search by JQL (Epics/Stories by filter) | `jira_search` | `jql`, `fields`, `limit`, `use_display_names: true` |
| List a project's fix versions | `jira_get_project_versions` | `project_key` |
| Group epics under parents | `jira_get_project_epic_hierarchy` | `project_key`, `max_epics` |
| List all issues in a project | `jira_get_project_issues` | `project_key`, `limit`, `start_at` |
| Add a comment | `jira_add_comment` | `issue_key`, `body` (Markdown) |
| Create a bug (escalation only) | `jira_create_issue` | `project_key`, `issue_type`, `summary`, `additional_fields` |

Note: `jira_create_issue` takes `project_key` (snake_case, e.g. `KAN`) and
`issue_type` as a string name. Fix versions are set via
`additional_fields: '{"fixVersions": [{"id": "<version-id>"}]}'`; epic links
via `additional_fields: '{"epicKey": "EPIC-123"}'`.

---

## Resolving Scope

### Input forms the release-planner accepts

1. **A single Story key** (e.g. `KAN-101`) → resolve parent Epic + sibling
   Stories in the same Epic.
2. **A single Epic key** (e.g. `KAN-45`) → resolve all Stories under it.
3. **A JQL filter** (e.g. `fixVersion = "v1.2" AND project = KAN`) → resolve
   all Epics/Stories matching.

### Resolution JQL patterns

```text
# Stories under an Epic
parent = KAN-45
# Stories under an Epic (epicLink fallback)
epicLink = KAN-45
# A named release across the project
fixVersion = "v1.2" AND project = KAN
# Find an Epic by key
key = KAN-45
```

### Release version rule

1. `jira_get_issue` each ticket in scope and read its `fixVersions`.
2. Collect the distinct version names across the scope.
3. Use the single common version as `releaseVersion`; if multiple or none,
   prompt the user for the version to use.

---

## Spec File Traceability Convention

Every generated spec file's top-level `test.describe` MUST embed both keys:

```typescript
test.describe('[Feature Name] — KAN-101 (Epic: KAN-45)', () => { ... });
```

- **Story key is primary** (drives per-story plan + write-back).
- **Epic key is the parent** (drives aggregate plan + roll-up).
- Spec file names use the Story key prefix: `tests/kan-101-<feature>.spec.ts`.
- Test title format: `should [expected behavior]`.

Regex used by write-back / coverage-analyst to extract keys:

```text
Story: /— ([A-Z]+-\d+)( \(Epic: ([A-Z]+-\d+)\))?/
Epic:  captured group 3
```

---

## Artifact Naming (see release-artifacts skill)

- Release folder: `artifacts/release-<version>-<NN>` (NN auto-increments).
- Epic aggregate plan: `artifacts/release-<version>-<NN>/test-plan-<EPIC>-<version>.md`
- Per-story plan: `artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md`
- Coverage matrix: `coverage-matrix.json`, Decision log: `agent-decision-log.json`

---

## What This Skill Must Never Do

- Invent a release version — derive from `fixVersions` or prompt.
- Treat a Bug ticket as a Story — Bugs are escalations, not scope.
- Merge two Stories into one plan — each Story gets its own plan.
- Write a `test.describe` without both Story and Epic keys.
- Assume a Jira tool's params — use the verified table above.
