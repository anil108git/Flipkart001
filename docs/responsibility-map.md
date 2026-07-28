# Responsibility Map

Visual reference showing what each prompt and component in the framework is responsible for.

---

## Prompt Responsibilities

| Capability | `create-testplan` | `generate-specs-from-plan` | `update-requirement` | `heal-failed-run` |
|------------|:---:|:---:|:---:|:---:|
| **Create plan from Bugasura REQ-ID** | ✅ | ❌ | ❌ | ❌ |
| **Create plan from local .md file** | ✅ | ❌ | ❌ | ❌ |
| **Create plan from URL** | ✅ | ❌ | ❌ | ❌ |
| **Classify scenarios (Type)** | ✅ | ❌ | ✅ | ❌ |
| **Classify scenarios (Complexity)** | ✅ | ❌ | ✅ | ❌ |
| **Ensure coverage (positive/negative/edge)** | ✅ | ❌ | ✅ | ❌ |
| **Detect requirement changes (diff)** | ❌ | ❌ | ✅ | ❌ |
| **Update existing plan (incremental)** | ❌ | ❌ | ✅ | ❌ |
| **Generate spec files (first time)** | ❌ | ✅ | ❌ | ❌ |
| **Update spec files (incremental)** | ❌ | ✅ | ❌ | ❌ |
| **Create page objects** | ❌ | ✅ | ❌ | ❌ |
| **Update page objects** | ❌ | ✅ | ❌ | ❌ |
| **Apply test tags** | ❌ | ✅ | ❌ | ❌ |
| **TypeScript validation** | ❌ | ✅ | ❌ | ❌ |
| **Classify test failures** | ❌ | ❌ | ❌ | ✅ |
| **Auto-fix locator/copy/route issues** | ❌ | ❌ | ❌ | ✅ |
| **Escalate to Bugasura** | ❌ | ❌ | ❌ | ✅ |
| **Update healing-log.md** | ❌ | ❌ | ❌ | ✅ |

---

## Workflow Diagrams

### First-Time Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                     FIRST-TIME SETUP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   requirements/flipkart.md                                      │
│          │                                                      │
│          ▼                                                      │
│   /create-testplan                                              │
│          │                                                      │
│          ▼                                                      │
│   specs/flipkart.md (DRAFT)                                     │
│          │                                                      │
│          ▼                                                      │
│   Human review + approval                                       │
│          │                                                      │
│          ▼                                                      │
│   /generate-specs-from-plan                                     │
│          │                                                      │
│          ├──► pages/flipkart.page.ts                            │
│          └──► tests/flipkart.spec.ts                            │
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
│            specs/flipkart.md (updated)                          │
│                     │                                           │
│                     ▼                                           │
│            /generate-specs-from-plan                            │
│                     │                                           │
│                     ├──► pages/flipkart.page.ts (updated)       │
│                     └──► tests/flipkart.spec.ts (updated)       │
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
│          ├─► FLAKY          ──► ESCALATE ──► Bugasura ticket    │
│          ├─► ASSERTION_LOGIC──► ESCALATE ──► Bugasura ticket    │
│          └─► UNKNOWN        ──► ESCALATE ──► Bugasura ticket    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Skill Responsibilities

| Skill | Used By | Purpose |
|-------|---------|---------|
| `bugasura-to-test-plan` | `create-testplan` | Fetch requirements from Bugasura MCP |
| `requirements-only-planning` | `create-testplan`, `update-requirement` | Create plans from local files, ensure coverage |
| `coding-standards` | `generate-specs-from-plan`, `heal-failed-run` | Enforce locator/POM/naming patterns, test tags |
| `healing-policy` | `heal-failed-run` | Auto-fix vs escalate decision tree |
| `bugasura-write-back` | `heal-failed-run` | Post results back to Bugasura |
| `test-data-setup` | Test execution | Auth state and fixture configuration |
| `ci-reporting` | CI pipeline | GitHub Actions workflow config |

---

## Prompt Selection Guide

```
What do you want to do?
│
├─► Create a test plan from scratch
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
└─► Run tests
      └─► npx playwright test
```

---

## File Flow

```
requirements/*.md          →  /create-testplan       →  specs/*.md
specs/*.md                 →  /generate-specs-from-plan  →  tests/*.spec.ts
                            →  /generate-specs-from-plan  →  pages/*.page.ts
requirements/*.md (old)    →  /update-requirement    →  specs/*.md (updated)
requirements/*.md (new)    →  /update-requirement    →  specs/*.md (updated)
specs/*.md                 →  /generate-specs-from-plan  →  tests/*.spec.ts (updated)
tests/*.spec.ts (failures) →  /heal-failed-run       →  auto-fix or Bugasura ticket
```
