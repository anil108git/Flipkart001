# Responsibility Map

Visual reference showing what each command and component in the framework is responsible for.

---

## Command Responsibilities

| Capability | `plan-release` | `create-testplan` | `generate-specs-from-plan` | `update-requirement` | `heal-failed-run` | `generate-coverage-matrix` |
|------------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Resolve Jira scope (Story/Epic/JQL)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Derive release version from fixVersion** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Scaffold release artifact folder** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Create plan from Jira issue key** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Create plan from local .md file** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Create plan from URL** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Classify scenarios (5 categories)** | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Classify scenarios (Complexity)** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Ensure coverage (positive/negative/edge/nf/perf)** | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Detect requirement changes (diff)** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Update existing plan (incremental)** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Generate spec files (first time)** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Update spec files (incremental)** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Create page objects** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Update page objects** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Apply test tags** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **TypeScript validation** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Classify test failures** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Auto-fix locator/copy/route issues** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Escalate to Jira** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Update healing-log.md / decision log** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Reconcile results into coverage matrix** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Workflow Diagrams

### Release-Driven Pipeline (one-shot)

```
┌─────────────────────────────────────────────────────────────────┐
│                     RELEASE-DRIVEN PIPELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /plan-release KAN-45 (Epic) or KAN-101 (Story) or JQL        │
│          │                                                      │
│          ▼                                                      │
│   Release Planner ──► Epic → Stories scope table               │
│          │            fixVersion → release version             │
│          ▼                                                      │
│   node scripts/init-release.mjs <v> <EPIC>                     │
│   artifacts/release-<version>-<NN>/ (scaffolded)               │
│          │                                                      │
│          ▼                                                      │
│   Planner ──► stories/test-plan-<STORY>-<version>.md (5-cat)   │
│               test-plan-<EPIC>-<version>.md (aggregate)        │
│               coverage-matrix.json (status: planned)           │
│          │                                                      │
│          ▼                                                      │
│   Generator ──► pages/*.page.ts                                 │
│                 tests/kan-<story>-<feature>.spec.ts            │
│          │                                                      │
│          ▼                                                      │
│   Reviewer (big-pickle) ──► PASS/FAIL per file                │
│          │                                                      │
│          ▼                                                      │
│   Finalize ──► build-coverage-matrix.mjs → coverage-matrix.json│
│                agent-decision-log.json                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Requirement Update (Incremental)

```
┌─────────────────────────────────────────────────────────────────┐
│                  REQUIREMENT UPDATE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   requirements/flipkart.md (old)  requirements/flipkart.md (new)│
│          │                              │                       │
│          └──────────┬───────────────────┘                       │
│                     ▼                                           │
│            /update-requirement                                  │
│                     │                                           │
│                     ▼                                           │
│            Diff detection by AC ID                              │
│            ┌────────────────────┐                               │
│            │ HEADER-001: same   │ → preserved                   │
│            │ HEADER-008: changed│ → updated                     │
│            │ HEADER-030: new    │ → added                       │
│            │ HEADER-015: removed│ → OUT OF SCOPE                │
│            └────────────────────┘                               │
│                     │                                           │
│                     ▼                                           │
│            artifacts/release-<v>-<NN>/.../test-plan-*.md        │
│                     │                                           │
│                     ▼                                           │
│            /generate-specs-from-plan                            │
│                     │                                           │
│                     ├──► pages/*.page.ts (updated)              │
│                     └──► tests/kan-*.spec.ts (updated)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Test Failure Healing

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEST FAILURE HEALING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   npx playwright test                                           │
│          │                                                      │
│          ▼                                                      │
│   tests fail ──► test-results/results.json                      │
│          │                                                      │
│          ▼                                                      │
│   /heal-failed-run                                              │
│          │                                                      │
│          ▼                                                      │
│   classifyError()                                               │
│          │                                                      │
│          ├─► LOCATOR_MISSING ──► AUTO_FIX ──► re-run ──► pass?  │
│          ├─► COPY_MISMATCH  ──► AUTO_FIX ──► re-run ──► pass?  │
│          ├─► ROUTE_CHANGE   ──► AUTO_FIX ──► re-run ──► pass?  │
│          ├─► TIMEOUT        ──► AUTO_FIX ──► re-run ──► pass?  │
│          ├─► FLAKY          ──► ESCALATE ──► Jira issue       │
│          ├─► ASSERTION_LOGIC──► ESCALATE ──► Jira issue       │
│          └─► UNKNOWN        ──► ESCALATE ──► Jira issue       │
│                                                                 │
│   Every action → agent-decision-log.json + coverage-matrix.json │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Coverage Reconciliation

```
┌─────────────────────────────────────────────────────────────────┐
│                    COVERAGE RECONCILIATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   npx playwright test                                           │
│          │                                                      │
│          ▼                                                      │
│   test-results/results.json                                     │
│          │                                                      │
│          ▼                                                      │
│   /generate-coverage-matrix [releaseFolder]                     │
│          │                                                      │
│          ▼                                                      │
│   node scripts/build-coverage-matrix.mjs                       │
│          │                                                      │
│          ▼                                                      │
│   coverage-matrix.json (summary recomputed)                    │
│          │                                                      │
│          ▼                                                      │
│   Gap audit: ≥1 pos/neg/edge per AC, nf/perf or 'na'+rationale │
│          │                                                      │
│          ▼                                                      │
│   Report gaps → agent-decision-log.json                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Skill Responsibilities

| Skill | Used By | Purpose |
|-------|---------|---------|
| `epic-story-traceability` | `plan-release`, `create-testplan` | Resolve Epic→Story scope; embed keys in describe blocks |
| `jira-to-test-plan` | `plan-release`, `create-testplan` | Fetch requirements from Jira MCP |
| `requirements-only-planning` | `plan-release`, `create-testplan`, `update-requirement` | Create plans from local files, ensure coverage |
| `test-categorization` | `plan-release`, `create-testplan`, `update-requirement`, `generate-coverage-matrix` | 5-category scenario classification + mandatory coverage |
| `release-artifacts` | `plan-release`, `generate-coverage-matrix` | Per-release folder, coverage-matrix.json, decision log |
| `coding-standards` | `generate-specs-from-plan`, `heal-failed-run` | Enforce locator/POM/naming patterns, test tags |
| `healing-policy` | `heal-failed-run` | Auto-fix vs escalate decision tree |
| `jira-write-back` | `heal-failed-run` | Post results back to Jira (Story comment + Epic roll-up) |
| `test-data-setup` | Test execution | Auth state and fixture configuration |
| `ci-reporting` | CI pipeline | GitHub Actions workflow config |

---

## Command Selection Guide

```
What do you want to do?
│
├─► Plan + generate a full release from Jira scope
│     └─► /plan-release <Story|Epic|JQL>
│
├─► Create a test plan from scratch (any source)
│     └─► /create-testplan [source]
│
├─► Generate spec files from an approved plan
│     └─► /generate-specs-from-plan [plan-file]
│
├─► Update plan when requirement file changes
│     └─► /update-requirement [old-file] [new-file] [plan-file]
│
├─► Fix failing Playwright tests
│     └─► /heal-failed-run [spec-file | last]
│
├─► Reconcile coverage matrix after a run
│     └─► /generate-coverage-matrix [releaseFolder]
│
└─► Run tests
      └─► npx playwright test
```

---

## File Flow

```
Jira (Story/Epic/JQL)     →  /plan-release        →  artifacts/release-<v>-<NN>/
requirements/*.md         →  /create-testplan     →  artifacts/release-<v>-<NN>/stories/test-plan-*.md
test-plan-*.md            →  /generate-specs-from-plan → tests/kan-*.spec.ts + pages/*.page.ts
requirements/*.md (old)   →  /update-requirement  →  test-plan-*.md (updated)
requirements/*.md (new)   →  /update-requirement  →  test-plan-*.md (updated)
tests/*.spec.ts (failures)→  /heal-failed-run     →  auto-fix or Jira issue
test-results/results.json →  /generate-coverage-matrix → coverage-matrix.json (summary)
all phases               →  append-decision.mjs   →  agent-decision-log.json
```
