# E2E Automation Framework

AI-powered Playwright E2E testing framework with Claude Code skills and GitHub Copilot agents.

## Project Structure

- `tests/` — Playwright test specs
- `pages/` — Page Object Model classes
- `fixtures/` — Auth fixtures and test data
- `orchestrator/` — Run orchestration and Bugasura client
- `requirements/` — Requirements documents
- `specs/` — Test specifications (acceptance criteria)
- `.claude/skills/` — Claude Code skills for coding standards, test setup, CI, healing, and Jira integration
- `.github/agents/` — GitHub Copilot agents (planner, generator, healer)
- `.github/prompts/` — Copilot prompts for test generation and healing
- `.github/workflows/` — CI pipeline (e2e-tests.yml)

## Skills

- `coding-standards` — Locator strategy, POM patterns, naming conventions
- `test-data-setup` — Auth fixtures, env config, data generators
- `ci-reporting` — CI pipeline, retry policy, report deployment
- `healing-policy` — Auto-fix rules, escalation criteria
- `bugasura-to-test-plan` — Requirements to test plans
- `bugasura-write-back` — Write results back to Jira
- `requirements-only-planning` — Shift-left plans when feature isn't built yet

## Commands

```bash
npm test              # Run all tests
npm run test:headed   # Run in headed mode
npm run test:ui       # Open Playwright UI
npm run test:debug    # Debug mode
npm run test:chromium # Chromium only
npm run test:report   # View HTML report
npm run lint          # Lint TypeScript
npm run format        # Format code
```

## Conventions

- Use Page Object Model for all page interactions
- Prefer `getByRole` > `getByLabel` > `getByTestId` > CSS selectors
- Never use `page.waitForTimeout()` — use auto-waiting
- Each test must be independent (no shared state)
- Use `test.describe` blocks with Jira ticket IDs
- Store auth state in `fixtures/auth/.auth/`
