---
description: >
  One-shot orchestrator: resolves a Jira Story/Epic/filter into release
  scope, scaffolds artifacts/release-<version>-<NN>/, plans every story
  across the 5 categories, generates specs + page objects, cross-reviews
  them, and writes agent-decision-log.json + coverage-matrix.json. Invoke
  with /plan-release <Story-Key | Epic-Key | JQL-filter>.
agent: release-planner
model: opencode/deepseek-v4-flash-free
---

# Plan Release — Epic/Story-Driven Spec Development

You orchestrate the full release pipeline. Follow every phase in order.
Skills to load as you go: `epic-story-traceability`, `release-artifacts`,
`jira-to-test-plan`, `test-categorization`, `coding-standards`,
`requirements-only-planning`.

## Input

**Release scope:** $ARGUMENTS

Acceptable inputs (per `epic-story-traceability`):
- A Story key (e.g. `KAN-101`) — resolves its parent Epic + siblings
- An Epic key (e.g. `KAN-45`) — resolves all Stories under it
- A JQL filter (e.g. `fixVersion = "v1.2" AND project = KAN`)

If empty, ask:
> "Provide a Jira Story key, Epic key, or JQL filter, e.g. `/plan-release KAN-45`."

---

## Phase 1 — Scope Resolution (release-planner)

Act as the Release Planner:

1. Resolve the input via Jira MCP (`jira_get_issue`, `jira_search`,
   `jira_get_project_epic_hierarchy`) into Epic → Stories.
2. Derive the release version from `fixVersions` (single common version) or
   prompt the user.
3. Scaffold the release folder:
   ```
   node scripts/init-release.mjs <version> <EPIC_KEY>
   ```
4. Log the scope-resolution decision:
   ```
   node scripts/append-decision.mjs artifacts/release-<version>-<NN> '{
     "phase": "scope-resolution",
     "agent": "release-planner",
     "model": "opencode/deepseek-v4-flash-free",
     "input": "$ARGUMENTS",
     "decision": "scoped <N> stories for release <version>",
     "rationale": "<fixVersion source>",
     "outputArtifacts": ["coverage-matrix.json"]
   }'
   ```
5. Print the resolved scope table and STOP for user confirmation.

---

## Phase 2 — Scenario Planning (planner)

For each Story, using the `jira-to-test-plan` and `test-categorization`
skills:

1. `jira_get_issue` the Story (fields include AC, priority, labels,
   fixVersions, parent Epic).
2. Map every AC line to scenarios across the 5 categories:
   positive, negative, edge, non-functional, performance (minimum rule +
   `na`-with-rationale per `test-categorization`).
3. Write one plan per Story:
   `artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md`
4. Write the Epic aggregate plan:
   `artifacts/release-<version>-<NN>/test-plan-<EPIC>-<version>.md`
5. Append each story's scenario rows to `coverage-matrix.json`
   (`epics[].stories[].scenarios[]`) with `status: "planned"`.
6. Log one planning decision per story:
   ```
   node scripts/append-decision.mjs artifacts/release-<version>-<NN> '{
     "phase": "planning",
     "agent": "planner",
     "model": "opencode/nemotron-3-ultra-free",
     "input": "<STORY>",
     "decision": "planned <N> scenarios across 5 categories",
     "rationale": "<category breakdown / na rationale>",
     "outputArtifacts": ["stories/test-plan-<STORY>-<version>.md"]
   }'
   ```

Stop and show the category summary for user review.

---

## Phase 3 — Code Generation (generator)

Using the `coding-standards` and `test-data-setup` skills:

1. Create missing page objects in `pages/`.
2. Generate spec files in `tests/` named
   `kan-<storynum>-<feature>.spec.ts`, each with:
   ```
   test.describe('[Feature Name] — <STORY> (Epic: <EPIC>)', () => { ... })
   ```
   and the category tags from `test-categorization`.
3. Update `coverage-matrix.json` scenario rows to `status: "generated"`
   (add `specFile` + `testName`).
4. Run `npx tsc --noEmit` and fix any type errors.

---

## Phase 4 — Cross-Review (reviewer)

As the cross-reviewer (`opencode/big-pickle`), you MUST explicitly state:

> "I did NOT generate this code — reviewing only"

Review each generated file against `coding-standards`. Output PASS or FAIL
per file with line-level issues. Only proceed after all files PASS.

---

## Phase 5 — Finalize

1. Recompute the coverage matrix summary:
   ```
   node scripts/build-coverage-matrix.mjs artifacts/release-<version>-<NN>
   ```
2. Log the pipeline decision:
   ```
   node scripts/append-decision.mjs artifacts/release-<version>-<NN> '{
     "phase": "release-finalize",
     "agent": "release-planner",
     "model": "opencode/deepseek-v4-flash-free",
     "input": "$ARGUMENTS",
     "decision": "release <version> planned + generated + reviewed",
     "rationale": "<counts>",
     "outputArtifacts": ["coverage-matrix.json", "agent-decision-log.json"]
   }'
   ```
3. Print the final report:
   ```
   Release: <version>
   Folder:  artifacts/release-<version>-<NN>
   Epic:    <EPIC>
   Stories: <list>
   Scenarios planned/generated: <N>
   Categories: positive | negative | edge | non-functional | performance
   TypeScript: ✅
   Cross-review: PASS (big-pickle)
   ```

## Hard Rules

- Never invent a release version — fixVersion or prompt.
- The reviewer model (`opencode/big-pickle`) MUST differ from the generator
  (`opencode/north-mini-code-free`).
- Never mark a plan READY without a live-app pass (Phase 2 is DRAFT unless
  the app is live and verified).
- Every phase logs a decision; the matrix is always recomputed, never
  hand-edited.
