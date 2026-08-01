# AGENTS.md — Flipkart001

AI-driven Playwright E2E automation framework. Release-driven, Epic/Story-traceable
spec development using dedicated opencode free models per task type via multi-model routing.

## Key AI Components

- Agents in `.opencode/agent/`: release-planner (primary), planner (primary), generator,
  healer, coverage-analyst (subagents)
- Commands in `.opencode/command/`: `/plan-release`, `/create-testplan`,
  `/generate-specs-from-plan`, `/heal-failed-run`, `/update-requirement`,
  `/generate-coverage-matrix`
- Skills in `.opencode/skills/`: coding-standards, requirements-only-planning,
  jira-to-test-plan, test-data-setup, ci-reporting, healing-policy, jira-write-back,
  epic-story-traceability, release-artifacts, test-categorization
- Jira + Playwright MCP servers configured in `opencode.json`

## Multi-Model Routing

| Task Type | Model | Skills | Component |
|-----------|-------|--------|-----------|
| Scope Resolution | `opencode/deepseek-v4-flash-free` | Follow [jira-to-test-plan](.opencode/skills/jira-to-test-plan/SKILL.md), [epic-story-traceability](.opencode/skills/epic-story-traceability/SKILL.md) | Release Planner agent, `/plan-release` Phase 1 |
| Planning | `opencode/nemotron-3-ultra-free` | Follow [requirements-only-planning](.opencode/skills/requirements-only-planning/SKILL.md), Follow [coding-standards](.opencode/skills/coding-standards/SKILL.md#test-categorization), [test-categorization](.opencode/skills/test-categorization/SKILL.md) | Planner agent, `/create-testplan`, `/update-requirement` |
| Code Generation | `opencode/north-mini-code-free` | Follow [coding-standards](.opencode/skills/coding-standards/SKILL.md), Follow [test-data-setup](.opencode/skills/test-data-setup/SKILL.md) | Generator agent, `/generate-specs-from-plan` |
| Cross-Review | `opencode/big-pickle` | Follow [coding-standards](.opencode/skills/coding-standards/SKILL.md) | Post-generation review step |
| Coverage Analysis | `opencode/big-pickle` | Follow [release-artifacts](.opencode/skills/release-artifacts/SKILL.md), [test-categorization](.opencode/skills/test-categorization/SKILL.md) | Coverage Analyst agent, `/generate-coverage-matrix` |
| Healing | `opencode/mimo-v2.5-free` | Follow [healing-policy](.opencode/skills/healing-policy/SKILL.md) | Healer agent, `/heal-failed-run` |
| Defect Reporting | `opencode/ling-3.0-flash-free` | Follow [jira-write-back](.opencode/skills/jira-write-back/SKILL.md), Follow [ci-reporting](.opencode/skills/ci-reporting/SKILL.md) | `/heal-failed-run` escalation, CI |

## Workflow

1. **Scope Resolution** → `/plan-release <Story|Epic|JQL>` → `opencode/deepseek-v4-flash-free`
   → scope table + `artifacts/release-<version>-<NN>/` scaffolded
2. **Extraction + Planning** → `/create-testplan` → `opencode/nemotron-3-ultra-free`
   → 5-category plans in `artifacts/release-<version>-<NN>/stories/`
3. **Code Generation** → `/generate-specs-from-plan` → `opencode/north-mini-code-free` → `.ts` files
4. **Cross-Review** → `opencode/big-pickle` (must differ from generator) → PASS/FAIL report
5. **Execution** → `npx playwright test`
6. **Coverage** → `/generate-coverage-matrix` → `opencode/big-pickle` → `coverage-matrix.json`
7. **Healing** → `/heal-failed-run` → `opencode/mimo-v2.5-free` → fix or escalate
8. **Defect Reporting** → `opencode/ling-3.0-flash-free` → Jira write-back

## Cross-Verification Rules

- Generator (`opencode/north-mini-code-free`) and Reviewer (`opencode/big-pickle`) must ALWAYS be different models
- Reviewer must explicitly state: "I did NOT generate this code — reviewing only"
- Reviewer output must include PASS or FAIL per file with line-level issues
- No generated code reaches human review without passing cross-review

## Conventions

- Tests in `tests/`, page objects in `pages/`, plans in `artifacts/release-<version>-<NN>/`,
  requirements in `requirements/`, AI assets in `.opencode/`
- Env config via `.env.<env>` using `TEST_ENV`
- Spec `test.describe` embeds traceability:
  `test.describe('[Feature Name] — <STORY> (Epic: <EPIC>)', () => { ... })`
- Scenario categories: positive / negative / edge / non-functional / performance
- Every release writes `agent-decision-log.json` + `coverage-matrix.json` under its folder

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BASE_URL` | Application base URL |
| `API_URL` | API endpoint URL |
| `TEST_USER_EMAIL` | Test user email |
| `TEST_USER_PASSWORD` | Test user password |
| `JIRA_API_TOKEN` | Jira API token (Atlassian Cloud) |
| `JIRA_USER_EMAIL` | Email associated with the Jira token |

## TypeScript

- Strict mode, Node16 module resolution
- Includes: `tests/**/*.ts`, `pages/**/*.ts`, `fixtures/**/*.ts`, `playwright.config.ts`
- Run `npx tsc --noEmit` to verify

## References

- [Architecture](docs/architecture.md) | [Commands](docs/list-of-commands.md) | [Responsibility Map](docs/responsibility-map.md)
