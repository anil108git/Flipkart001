# E2E Automation Framework Architecture

Release-driven, Epic/Story-traceable Playwright E2E framework. AI assets
live in `.opencode/` (agents, commands, skills). MCP servers (Jira +
Playwright) are configured in `opencode.json`. Per-release artifacts land
in `artifacts/release-<version>-<NN>/`.

## Orchestration Flow

```
+=====================================================================================+
|                           REQUIREMENTS INPUT                                         |
|           (Jira Story / Epic / JQL filter)                                          |
+===========================================+=========================================+
                                            |
                                            v
+=====================================================================================+
|  OPENCODE SKILLS                                                                     |
|                                                                                      |
|  +----------------------+  +------------------+  +------------------+                |
|  | jira-to-test-plan    |  | coding-standards |  | test-data-setup  |                |
|  | Plan Phase           |  | Guardrails       |  | Data Phase       |                |
|  +----------+-----------+  +--------+---------+  +--------+---------+                |
|             |                       |                     |                           |
|             v                       v                     v                           |
|  +----------------------+  +------------------+  +------------------+                |
|  | healing-policy       |  | jira-write-back  |  | ci-reporting     |                |
|  | Post-Failure         |  | Results          |  | CI Phase         |                |
|  +----------------------+  +------------------+  +------------------+                |
|  +----------------------+  +------------------+  +------------------+                |
|  | epic-story-          |  | release-artifacts|  | test-            |                |
|  | traceability         |  | Per-release      |  | categorization   |                |
|  +----------------------+  +------------------+  +------------------+                |
+===========================================+=========================================+
                                            |
                                            v
+=====================================================================================+
|  OPENCODE AGENTS                                                                     |
|                                                                                      |
|  +----------------+  +----------+  +----------+  +-----------+  +-----------------+  |
|  | RELEASE-PLANNER|->| PLANNER  |->| GENERATOR|->| (REVIEWER)|->| COVERAGE-ANALYST|  |
|  | scope/version  |  | 5-cat    |  | specs+PO |  | big-pickle|  | matrix          |  |
|  | + scaffold     |  | plans    |  | code     |  | cross-    |  | reconcile       |  |
|  +----------------+  +----------+  +----------+  | review    |  +-----------------+  |
|                                                   +-----------+                      |
|  +-------------+       +-------------+                                                |
|  |   HEALER    |<------|  RUN FAILED |                                                |
|  |  fix/escalate|      +-------------+                                                |
|  +------+------+                                                                     |
+===========================================+=========================================+
                                            |
                                            v
+=====================================================================================+
|  GENERATED ASSETS                                                                    |
|                                                                                      |
|  artifacts/release-<v>-<NN>/   tests/             pages/                             |
|  +--------------+              +--------------+   +--------------+                   |
|  | test-plan-*  |              | kan-101-*.    |   | login.page   |                   |
|  | .md (stories)|------------->| spec.ts       |<--| .ts          |                   |
|  | coverage-    |              | (Tests)       |   | (Page Obj)   |                   |
|  | matrix.json  |              +--------------+   +--------------+                   |
|  | agent-decision-log.json                        |                                |
|  +--------------+                                                                     |
|                                                                                      |
|  fixtures/                     opencode.json                                         |
|  +--------------+              +--------------+                                     |
|  | auth.fixture |              | Jira MCP     |                                     |
|  | .ts          |              | Playwright   |                                     |
|  +--------------+              +--------------+                                     |
+===========================================+=========================================+
                                            |
                                            v
+=====================================================================================+
|  CI/CD PIPELINE (.github/workflows/e2e-tests.yml)                                   |
|                                                                                      |
|  +---------+    +---------+    +---------+    +---------+    +---------+            |
|  |  Setup  |--->| Install |--->|  Test   |--->| Report  |--->| Deploy  |            |
|  |  Node   |    | Browsers|    |  Run    |    |  HTML   |    |  Pages  |            |
|  +---------+    +---------+    +----+----+    +---------+    +---------+            |
|                                     |                                                |
|                          +----------+----------+                                    |
|                          v                   v                                      |
|                    +----------+         +----------+                                 |
|                    |   PASS   |         |   FAIL   |                                 |
|                    +----------+         +----+-----+                                 |
|                                               |                                     |
|                                               v                                     |
|                                     +-----------------+                              |
|                                     |  HEALER AGENT   |                              |
|                                     |  (Auto-fix)     |                              |
|                                     +--------+--------+                              |
|                                              |                                      |
|                                              v                                      |
|                                    +-----------------+                              |
|                                    | JIRA WRITE-BACK |                              |
|                                    | (Story + Epic)  |                              |
|                                    +-----------------+                              |
+=====================================================================================+
```

## Phase Details

### Phase 0: Scope Resolution

```
  Jira Input (Story | Epic | JQL)
       |
       v
  +-----------------+
  | Release Planner |
  | (deepseek-v4-   |
  |  flash-free)    |
  +--------+--------+
           |
           v
  +-----------------+
  | Resolve Epic -> |
  | Stories, derive |
  | fixVersion      |
  +--------+--------+
           |
           v
  +-----------------+
  | Scaffold:       |
  | artifacts/      |
  | release-<v>-<NN>|
  +--------+--------+
           |
           v
  agent-decision-log.json  <- scope entry
```

### Phase 1: Planning & Generation

```
  Test Spec          coding-standards     test-data-setup
     |                    |                    |
     v                    v                    v
  +----------------------------------------------------+
  |              Generator Agent                        |
  +---------------------+------------------------------+
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
   +-----------+  +-----------+  +-----------+
   | tests/*.  |  | pages/*.  |  | fixtures/ |
   | spec.ts   |  | page.ts   |  | *.fixture |
   +-----+-----+  +-----+-----+  +-----+-----+
         |              |              |
         +--------------+--------------+
                        |
                        v
                  +-----------+
                  |   Type    |
                  |  Check    |
                  +-----+-----+
                        |
                  Pass  |  Fail
                  +-----+-----+
                  |           |
                  v           v
              Phase 3    Fix Errors
                          (loop)
```

### Phase 2: Execution

```
  +-------------------+
  |  Setup Project    |
  +---------+---------+
            |
            v
  +-------------------+
  |  Chromium Browser |
  +---------+---------+
            |
            v
  +-------------------+
  |  Run Tests        |
  +---------+---------+
            |
            v
      +-----------+
      | Pass/Fail?|
      +-----+-----+
            |
    Pass    |    Fail
    +-------+-------+
    |               |
    v               v
+-------+     +---------+
|Report |     | Collect |
| HTML  |     | Trace   |
+---+---+     +----+----+
    |              |
    v              v
+-------+     +---------+
|Deploy |     | Phase 4 |
| Pages |     |  Heal   |
+-------+     +---------+
```

### Phase 3: Healing

```
  Failed Test          healing-policy
       |                    |
       v                    v
  +-----------------+
  | Healer Agent    |
  +--------+--------+
           |
           v
  +-----------------+
  | Diagnose Root   |
  | Cause           |
  +--------+--------+
           |
     +-----+-----+
     |     |     |
     v     v     v
  +-----+ +-----+ +-----+
  |Sel- | |Time-| |Flak-|
  |ector| |out  | |y    |
  +--+--+ +--+--+ +--+--+
     |      |      |
     v      v      v
  +-----+ +-----+ +-----+
  |Up-  | |Ad-  | |Retry|
  |date | |just | |     |
  +--+--+ +--+--+ +--+--+
     |      |      |
     +------+------+  |
            |         |
            v         |
  +-----------------+ |
  | Re-run Tests    | |
  +--------+--------+ |
           |           |
     Pass  |  Fail     |
     +-----+-----+    |
     |           |    |
     v           v    |
+-------+   +---------+
| Close |   |Escalate |
|Ticket |   | Human   |
+-------+   +---------+
```

## Component Matrix

See [responsibility-map](responsibility-map.md) for the full component-to-purpose mapping. Key files are:

| Category | Location |
|----------|----------|
| Skills (10) | `.opencode/skills/*/SKILL.md` |
| Agents (5) | `.opencode/agent/*.md` |
| Commands (7) | `.opencode/command/*.md` |
| MCP config | `opencode.json` |

## Data Flow

```
+-------------------+                  +-------------------+
|     EXTERNAL      |                  |    FRAMEWORK      |
|                   |                  |                   |
|  +-------+        |    Requirement   |  +-------+        |
|  | Jira  |--------+------------------>  | Plan  |        |
|  +-------+        |                  |  +---+---+        |
|                   |                  |      |            |
|  +-------+        |     Trigger      |      v            |
|  |GitHub |--------+------------------>  +-------+        |
|  |Actions|        |                  |  | Tests |        |
|  +-------+        |                  |  +---+---+        |
+-------------------+                  |      |            |
                                       |  +---+---+        |
                                       |  | Pages |        |
                                       |  +---+---+        |
                                       |      |            |
                                       |  +---+---+        |
                                       |  |Fixtures|       |
                                       |  +---+---+        |
                                       +-------+------------+
                                               |
                                               v
                                      +-----------------+
                                      |     OUTPUT      |
                                      |                 |
                                      |  +-----------+  |
                                      |  |HTML Report|  |
                                      |  +-----------+  |
                                      |                 |
                                      |  +-----------+  |
                                      |  |Trace Files|  |
                                      |  +-----------+  |
                                      |                 |
                                      |  +-----------+  |
                                      |  | Jira      |  |
                                      |  | Update    |  |
                                      |  +-----------+  |
                                      +--------+--------+
                                               |
                                               v
                                      +-----------------+
                                      |  Jira (Back)   |
                                      +-----------------+
```

## Environment Flow

```
  +----------------+     +----------------+
  |   .env.dev     |     |  .env.staging  |
  +-------+--------+     +--------+-------+
          |                       |
          +-----------+-----------+
                      |
                      v
               +-------------+
               |  TEST_ENV?  |
               +------+------+
                      |
          +-----------+-----------+
          |                       |
          v                       v
  +-----------------+   +-----------------+
  | dev.yourapp.com |   |staging.yourapp. |
  |                 |   |com              |
  +--------+--------+   +--------+--------+
           |                       |
           +-----------+-----------+
                       |
                       v
               +-------------+
               |Test Results |
               +-------------+
```

## Directory Structure

```
project-root/
|
+-- .opencode/                  # AI assets (opencode canonical root)
|   +-- agent/                  # Agents
|   |   +-- release-planner.md  # (primary, deepseek-v4-flash-free)
|   |   +-- planner.md          # (primary, nemotron-3-ultra-free)
|   |   +-- generator.md        # (subagent, north-mini-code-free)
|   |   +-- healer.md           # (subagent, mimo-v2.5-free)
|   |   +-- coverage-analyst.md # (subagent, big-pickle)
|   |
|   +-- command/                # Commands
|   |   +-- plan-release.md
|   |   +-- create-testplan.md
|   |   +-- generate-specs-from-plan.md
|   |   +-- update-requirement.md
|   |   +-- heal-failed-run.md
|   |   +-- generate-coverage-matrix.md
|   |
|   +-- skills/                 # Skills
|       +-- jira-to-test-plan/SKILL.md
|       +-- jira-write-back/SKILL.md
|       +-- ci-reporting/SKILL.md
|       +-- coding-standards/SKILL.md
|       +-- healing-policy/SKILL.md
|       +-- requirements-only-planning/SKILL.md
|       +-- test-data-setup/SKILL.md
|       +-- epic-story-traceability/SKILL.md
|       +-- release-artifacts/SKILL.md
|       +-- test-categorization/SKILL.md
|
+-- artifacts/                  # Per-release artifacts (gitignored)
|   +-- release-<version>-<NN>/
|       +-- test-plan-<EPIC>-<version>.md
|       +-- stories/
|       |   +-- test-plan-<STORY>-<version>.md
|       +-- coverage-matrix.json
|       +-- agent-decision-log.json
|
+-- docs/
|   +-- architecture.md            # This file
|
+-- fixtures/
|   +-- auth/
|   |   +-- .auth/                 # Stored auth state (gitignored)
|   |   +-- global.setup.ts        # Global auth setup
|   +-- auth.fixture.ts            # Authentication fixtures
|   +-- data/
|       +-- users.json             # Static test data
|       +-- generators.ts          # Dynamic data generators
|
+-- pages/
|   +-- login.page.ts              # Page objects
|
+-- requirements/
|   +-- flipkart-foryou-tab.md     # Requirements document
|
+-- scripts/                       # Release pipeline scripts
|   +-- init-release.mjs           # Scaffold release folder
|   +-- append-decision.mjs        # Append decision-log entry
|   +-- build-coverage-matrix.mjs  # Recompute coverage matrix
|   +-- ci-heal.mjs                # CI healer
|
+-- tests/
|   +-- kan-101-user-login.spec.ts # Story-traceable specs
|   +-- example.spec.ts            # Example test (boilerplate)
|   +-- seed.spec.ts               # Data seeding
|
+-- .env.dev                       # Dev environment
+-- .env.staging                   # Staging environment
+-- .env.example                   # Environment template
+-- .gitignore
+-- AGENTS.md                      # opencode project config
+-- opencode.json                  # opencode config + MCP servers
+-- package.json                   # Dependencies
+-- playwright.config.ts           # Playwright config
+-- tsconfig.json                  # TypeScript config
```
