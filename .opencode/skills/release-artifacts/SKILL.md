---
name: release-artifacts
description: >
  Use this skill whenever creating, updating, or consuming the release
  artifact folders under artifacts/. Triggers when a user says "init a
  release folder", "scaffold artifacts", "update the coverage matrix",
  "log a decision", or "where do test plans go". Defines the exact
  folder/file naming, the agent-decision-log.json and coverage-matrix.json
  schemas, the NA-with-rationale rule, and the suffix auto-increment
  behavior.
---

# Release Artifacts — Layout, Naming, Schemas

## Core Principles

1. **Every release gets one folder** — `artifacts/release-<version>-<NN>`.
   `<NN>` is zero-padded and auto-incremented by `scripts/init-release.mjs`;
   you never type it.
2. **Two JSON audit files are mandatory** — `agent-decision-log.json`
   (append-only audit of every AI decision) and `coverage-matrix.json`
   (machine-readable test coverage). Both are created by
   `scripts/init-release.mjs`.
3. **Plans live next to the JSON** — the epic aggregate plan and per-story
   plans are Markdown files in the same release folder.
4. **NA is a decision, not an omission** — a category excluded from a Story
   MUST be recorded as `status: "na"` with a `rationale`. Silence reads as
   a gap, not a decision.

---

## Folder Layout

```
artifacts/
└── release-v1.2-01/                        # release-<version>-<NN>
    ├── agent-decision-log.json             # append-only audit trail
    ├── coverage-matrix.json                # machine-readable coverage
    ├── grooming-queue.json                 # open grooming questions (if any)
    ├── rtm.md                              # human-readable Requirements Traceability Matrix (generated)
    ├── test-plan-KAN-45-v1.2.md            # epic aggregate plan
    └── stories/
        ├── test-plan-KAN-101-v1.2.md       # per-story plan
        └── test-plan-KAN-102-v1.2.md
```

Naming rules:

| Artifact | Pattern | Example |
|----------|---------|---------|
| Release folder | `release-<version>-<NN>` | `release-v1.2-01` |
| Epic aggregate plan | `test-plan-<EPIC>-<version>.md` | `test-plan-KAN-45-v1.2.md` |
| Per-story plan | `test-plan-<STORY>-<version>.md` | `test-plan-KAN-101-v1.2.md` |
| Coverage matrix | `coverage-matrix.json` | fixed name |
| Decision log | `agent-decision-log.json` | fixed name |

---

## agent-decision-log.json

Append-only array. Each entry is written by a phase/agent/script via
`scripts/append-decision.mjs` (or `ci-heal`):

```json
{
  "timestamp": "2026-08-02T09:30:00.000Z",
  "phase": "planning",
  "agent": "planner",
  "model": "opencode/nemotron-3-ultra-free",
  "prompt": "/plan-release KAN-45",
  "skills": ["epic-story-traceability", "test-categorization"],
  "input": "KAN-45 -> stories [KAN-101, KAN-102]",
  "decision": "added 12 scenarios across 5 categories",
  "rationale": "AC 1-6 mapped; performance na (no perf requirement in AC)",
  "outputArtifacts": ["stories/test-plan-KAN-101-v1.2.md"]
}
```

Rules:
- Never delete or rewrite previous entries.
- Every phase that makes a decision logs one entry.
- `outputArtifacts` lists relative paths written by that phase.

---

## coverage-matrix.json

Release-scoped tree. Created with `summary` = zeroed counters by
`init-release.mjs`; `scripts/build-coverage-matrix.mjs` recomputes statuses
from `test-results/results.json` after each run.

```json
{
  "release": "v1.2",
  "releaseFolder": "artifacts/release-v1.2-01",
  "epicKey": "KAN-45",
  "generatedAt": "2026-08-02T09:30:00.000Z",
  "epics": [
    {
      "key": "KAN-45",
      "name": "Header",
      "stories": [
        {
          "key": "KAN-101",
          "name": "Header search",
          "scenarios": [
            {
              "id": "KAN-101-001",
              "source": "AC-1",
              "acText": "Search box is visible on the header",
              "priority": "p1",
              "title": "Search box is visible",
              "category": "positive",
              "subtype": null,
              "complexity": "Simple",
              "tags": ["@smoke", "@ui", "@priority-p1"],
              "status": "passed",
              "na": false,
              "rationale": null,
              "specFile": "tests/kan-101-header.spec.ts",
              "testName": "should show search box",
              "lastRunAt": "2026-08-02T09:30:00.000Z"
            },
            {
              "id": "KAN-101-006",
              "source": "AC-6",
              "acText": "Search response time under 2 seconds",
              "priority": "p0",
              "title": "Search response time under 2s",
              "category": "performance",
              "subtype": "performance-load",
              "complexity": "Medium",
              "tags": ["@performance", "@priority-p0"],
              "status": "planned",
              "na": false,
              "rationale": null,
              "specFile": "tests/kan-101-performance.spec.ts",
              "testName": "should respond within 2 seconds",
              "lastRunAt": null
            },
            {
              "id": "KAN-101-007",
              "source": "AC-7",
              "acText": "Screen reader support for search",
              "priority": "p2",
              "title": "Screen-reader support for search",
              "category": "non-functional",
              "subtype": "accessibility",
              "complexity": "Simple",
              "tags": ["@a11y", "@priority-p2"],
              "status": "na",
              "na": true,
              "rationale": "No accessibility requirement in AC — excluded deliberately",
              "specFile": null,
              "testName": null,
              "lastRunAt": null
            }
          ]
        }
      ]
    }
  ],
  "summary": {
    "epics": 1,
    "stories": 1,
    "scenarios": 3,
    "planned": 1,
    "generated": 0,
    "passed": 1,
    "failed": 0,
    "escalated": 0,
    "skipped": 0,
    "na": 1
  }
}
```

### Scenario fields

| Field | Meaning |
|-------|---------|
| `id` | `<STORY>-<NNN>` sequential per story |
| `source` | AC line or description reference the scenario traces to |
| `acText` | Verbatim text of the AC line the scenario maps to (RTM source) |
| `priority` | `p0` \| `p1` \| `p2` — inherited from Jira priority: Highest/High→`p0`, Medium→`p1`, Low/Lowest→`p2` |
| `category` | `positive` \| `negative` \| `edge` \| `non-functional` \| `performance` |
| `subtype` | see test-categorization skill |
| `complexity` | `Simple` \| `Medium` \| `Complex` |
| `status` | `planned` \| `generated` \| `passed` \| `failed` \| `escalated` \| `skipped` \| `na` \| `blocked` |
| `na` + `rationale` | MUST be set together when a category is excluded |
| `blockedReason` | only on `status: "blocked"` — e.g. `needs-grooming` + question key |

### Priority mapping

| Jira priority | Matrix `priority` | Tag |
|---------------|-------------------|-----|
| Highest, High | `p0` | `@priority-p0` |
| Medium | `p1` | `@priority-p1` |
| Low, Lowest | `p2` | `@priority-p2` |

The Planner inherits `priority` from the issue's Jira priority at planning
time; the Generator must add the matching `@priority-*` tag to the test (see
test-categorization skill).

---

## Summary Counter Semantics

| Counter | Counts |
|---------|--------|
| `planned` | scenario in the plan, spec not yet generated |
| `generated` | spec exists for the scenario, not yet run |
| `passed` / `failed` | matched to a Playwright result |
| `escalated` | healer raised a Jira bug for it |
| `skipped` | skipped in the run |
| `na` | deliberately excluded with rationale |

`build-coverage-matrix.mjs` recomputes these from scratch every run — it
never relies on prior values.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `node scripts/init-release.mjs <version> [epicKey]` | create next release folder |
| `node scripts/append-decision.mjs <folder> '<json>'` | append a decision-log entry |
| `node scripts/build-coverage-matrix.mjs <folder> [results.json]` | refresh coverage-matrix |
| `node scripts/build-rtm.mjs <folder>` | generate human-readable `rtm.md` from coverage-matrix |
| `node scripts/ci-heal.mjs` | CI healer (appends decisions too) |

---

## What This Skill Must Never Do

- Hardcode a suffix — always use `init-release.mjs` to auto-increment.
- Log a scenario as `na` without a `rationale`.
- Rewrite `agent-decision-log.json` entries — append only.
- Put per-story plans at the top level — they live in `stories/`.
- Commit generated artifacts if `artifacts/` is gitignored (it is, by default).
