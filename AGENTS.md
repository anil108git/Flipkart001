# AGENTS.md — Flipkart001

AI-driven Playwright E2E automation framework. Uses dedicated opencode free models per task type via multi-model routing.

## Key AI Components

- Agents in `.github/agents/`: planner, generator, healer
- Prompts in `.github/prompts/`: `/create-testplan`, `/generate-specs-from-plan`, `/heal-failed-run`, `/update-requirement`
- Skills in `.claude/skills/`: coding-standards, requirements-only-planning, bugasura-to-test-plan, test-data-setup, ci-reporting, healing-policy, bugasura-write-back

## Multi-Model Routing

| Task Type | Model | Skills | Component |
|-----------|-------|--------|-----------|
| Extraction | `opencode/deepseek-v4-flash-free` | Follow [bugasura-to-test-plan](.claude/skills/bugasura-to-test-plan/SKILL.md) | `/create-testplan` Phase 1 |
| Planning | `opencode/nemotron-3-ultra-free` | Follow [requirements-only-planning](.claude/skills/requirements-only-planning/SKILL.md), Follow [coding-standards](.claude/skills/coding-standards/SKILL.md#test-categorization) | Planner agent, `/create-testplan`, `/update-requirement` |
| Code Generation | `opencode/north-mini-code-free` | Follow [coding-standards](.claude/skills/coding-standards/SKILL.md), Follow [test-data-setup](.claude/skills/test-data-setup/SKILL.md) | Generator agent, `/generate-specs-from-plan` |
| Cross-Review | `opencode/big-pickle` | Follow [coding-standards](.claude/skills/coding-standards/SKILL.md) | Post-generation review step |
| Healing | `opencode/mimo-v2.5-free` | Follow [healing-policy](.claude/skills/healing-policy/SKILL.md) | Healer agent, `/heal-failed-run` |
| Defect Reporting | `opencode/ling-3.0-flash-free` | Follow [bugasura-write-back](.claude/skills/bugasura-write-back/SKILL.md), Follow [ci-reporting](.claude/skills/ci-reporting/SKILL.md) | `/heal-failed-run` escalation, CI |

## Workflow

1. **Extraction + Planning** → `/create-testplan` → `opencode/nemotron-3-ultra-free` → plan in `specs/`
2. **Code Generation** → `/generate-specs-from-plan` → `opencode/north-mini-code-free` → `.ts` files
3. **Cross-Review** → `opencode/big-pickle` (must differ from generator) → PASS/FAIL report
4. **Execution** → `npx playwright test`
5. **Healing** → `/heal-failed-run` → `opencode/mimo-v2.5-free` → fix or escalate
6. **Defect Reporting** → `opencode/ling-3.0-flash-free` → Bugasura write-back

## Cross-Verification Rules

- Generator (`opencode/north-mini-code-free`) and Reviewer (`opencode/big-pickle`) must ALWAYS be different models
- Reviewer must explicitly state: "I did NOT generate this code — reviewing only"
- Reviewer output must include PASS or FAIL per file with line-level issues
- No generated code reaches human review without passing cross-review

## Conventions

- Tests in `tests/`, page objects in `pages/`, plans in `specs/`, requirements in `requirements/`
- Env config via `.env.<env>` using `TEST_ENV`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BASE_URL` | Application base URL |
| `API_URL` | API endpoint URL |
| `TEST_USER_EMAIL` | Test user email |
| `TEST_USER_PASSWORD` | Test user password |
| `BUGASURA_API_KEY` | Bugasura API key |

## TypeScript

- Strict mode, Node16 module resolution
- Includes: `tests/**/*.ts`, `pages/**/*.ts`, `fixtures/**/*.ts`, `playwright.config.ts`
- Run `npx tsc --noEmit` to verify

## References

- [Architecture](docs/architecture.md) | [Commands](docs/list-of-commands.md) | [Copilot](.github/copilot-instructions.md)
