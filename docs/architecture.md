# E2E Automation Framework Architecture

## Orchestration Flow

```
+=====================================================================================+
|                           REQUIREMENTS INPUT                                         |
|                       (Jira/Bugasura Ticket)                                         |
+===========================================+=========================================+
                                            |
                                            v
+=====================================================================================+
|  CLAUDE CODE SKILLS                                                                  |
|                                                                                      |
|  +----------------------+  +------------------+  +------------------+                |
|  | bugasura-to-test-plan|  | coding-standards |  | test-data-setup  |                |
|  | Plan Phase           |  | Guardrails       |  | Data Phase       |                |
|  +----------+-----------+  +--------+---------+  +--------+---------+                |
|             |                       |                     |                           |
|             v                       v                     v                           |
|  +----------------------+  +------------------+  +------------------+                |
|  | healing-policy       |  | bugasura-write-  |  | ci-reporting     |                |
|  | Post-Failure         |  | back             |  | CI Phase         |                |
|  +----------------------+  +------------------+  +------------------+                |
+===========================================+=========================================+
                                            |
                                            v
+=====================================================================================+
|  GITHUB COPILOT AGENTS                                                               |
|                                                                                      |
|  +-------------+       +-------------+       +-------------+                        |
|  |   PLANNER   |------>|  GENERATOR  |------>|   HEALER   |                        |
|  |             |       |             |       |             |                        |
|  | - Analyze   |       | - Generate  |       | - Diagnose  |                        |
|  |   ticket    |       |   test code |       |   failure   |                        |
|  | - Create    |       | - Create    |       | - Fix tests |                        |
|  |   plan      |       |   page obj  |       | - Re-run    |                        |
|  +------+------+       +------+------+       +------+------+                        |
+===========================================+=========================================+
                                            |
                                            v
+=====================================================================================+
|  GENERATED ASSETS                                                                    |
|                                                                                      |
|  specs/                      tests/                     pages/                       |
|  +--------------+           +--------------+           +--------------+              |
|  | login-flow   |           | login-flow   |           | login.page   |              |
|  | .md          |---------->| .spec.ts     |<----------| .ts          |              |
|  | (Plan)       |           | (Tests)      |           | (Page Obj)   |              |
|  +--------------+           +--------------+           +--------------+              |
|                                                                                      |
|  fixtures/                     mcp.config.json                                      |
|  +--------------+           +--------------+                                        |
|  | auth.fixture |           | Playwright   |                                        |
|  | .ts          |           | Bugasura     |                                        |
|  +--------------+           +--------------+                                        |
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
|                                    |  BUGASURA WRITE-BACK |                              |
|                                    |  (Results)           |                              |
|                                    +-----------------+                              |
+=====================================================================================+
```

## Phase Details

### Phase 1: Planning

```
  Jira Ticket
       |
       v
  +-----------------+
  | bugasura-to-    |
  | test-plan Skill |
  +--------+--------+
           |
           v
  +-----------------+
  | Planner Agent   |
  +--------+--------+
           |
           v
  +-----------------+
  | specs/login-    |
  | flow.md         |
  +--------+--------+
           |
           v
     +-----------+
     |  Quality  |
     |   Gate    |
     +-----+-----+
           |
     Pass  |  Fail
     +-----+-----+
     |           |
     v           v
  Phase 2    Revise Plan
              (loop)
```

### Phase 2: Generation

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

### Phase 3: Execution

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

### Phase 4: Healing

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

| Component           | File                                              | Purpose                  | Triggers On      |
|---------------------|---------------------------------------------------|--------------------------|------------------|
| bugasura-to-test-plan | `.claude/skills/bugasura-to-test-plan/SKILL.md` | Ticket -> test plan      | New ticket       |
| coding-standards      | `.claude/skills/coding-standards/SKILL.md`      | Enforce patterns         | Code generation  |
| test-data-setup       | `.claude/skills/test-data-setup/SKILL.md`       | Auth & data config       | Test setup       |
| ci-reporting          | `.claude/skills/ci-reporting/SKILL.md`          | CI pipeline config       | CI run           |
| healing-policy        | `.claude/skills/healing-policy/SKILL.md`        | Auto-fix rules           | Test failure     |
| bugasura-write-back   | `.claude/skills/bugasura-write-back/SKILL.md`   | Results -> Bugasura      | Test complete    |
| requirements-only-planning | `.claude/skills/requirements-only-planning/SKILL.md` | Shift-left plans | No live app yet  |
| Planner Agent       | `.github/agents/playwright-test-planner.agent.md` | Plan structure           | New requirement  |
| Generator Agent     | `.github/agents/playwright-test-generator.agent.md`| Write code             | Plan approved    |
| Healer Agent        | `.github/agents/playwright-test-healer.agent.md`  | Fix failures             | Test fails       |
| Create Test Plan    | `.github/prompts/create-testplan.prompt.md` | Create plan from any source | /create-testplan |
| Generate Specs      | `.github/prompts/generate-specs-from-plan.prompt.md` | Plan -> spec files | /generate-specs-from-plan |
| Update Requirement  | `.github/prompts/update-requirement.prompt.md` | Diff detect + plan update | /update-requirement |
| Heal Tests          | `.github/prompts/heal-failed-run.prompt.md` | Fix failing tests       | /heal-failed-run |

## Data Flow

```
+-------------------+                  +-------------------+
|     EXTERNAL      |                  |    FRAMEWORK      |
|                   |                  |                   |
|  +-------+        |    Requirement   |  +-------+        |
|  |Bugasura|--------+------------------>  | Specs |        |
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
                                       |  |Bugasura   |  |
                                       |  | Update    |  |
                                       |  +-----------+  |
                                       +--------+--------+
                                                |
                                                v
                                       +-----------------+
                                       | Bugasura (Back) |
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
+-- .github/
|   +-- agents/                    # GitHub Copilot agents
|   |   +-- playwright-test-generator.agent.md
|   |   +-- playwright-test-healer.agent.md
|   |   +-- playwright-test-planner.agent.md
|   |
|   +-- prompts/                   # Copilot prompts
|   |   +-- create-testplan.prompt.md
|   |   +-- generate-specs-from-plan.prompt.md
|   |   +-- update-requirement.prompt.md
|   |   +-- heal-failed-run.prompt.md
|   |
|   +-- workflows/                 # CI/CD pipelines
|       +-- e2e-tests.yml
|
+-- .claude/
|   +-- skills/                    # Claude Code skills
|       +-- bugasura-to-test-plan/SKILL.md
|       +-- bugasura-write-back/SKILL.md
|       +-- ci-reporting/SKILL.md
|       +-- coding-standards/SKILL.md
|       +-- healing-policy/SKILL.md
|       +-- requirements-only-planning/SKILL.md
|       +-- test-data-setup/SKILL.md
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
+-- orchestrator/
|   +-- bugasura-client.ts         # Bugasura MCP client
|   +-- orchestrator.ts            # Run orchestration logic
|   +-- skill-loader.ts            # Skill file loader
|
+-- requirements/
|   +-- flipkart-foryou-tab.md     # Requirements document
|
+-- specs/
|   +-- login-flow.md              # Test specifications
|
+-- tests/
|   +-- example.spec.ts            # Example test (boilerplate)
|   +-- seed.spec.ts               # Data seeding
|
+-- .env.dev                       # Dev environment
+-- .env.staging                   # Staging environment
+-- .env.example                   # Environment template
+-- .gitignore
+-- CLAUDE.md                      # Claude Code project config
+-- mcp.config.json                # MCP server config
+-- package.json                   # Dependencies
+-- playwright.config.ts           # Playwright config
+-- tsconfig.json                  # TypeScript config
```
