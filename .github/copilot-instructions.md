# GitHub Copilot Instructions — Flipkart001

This repository is an AI-first Playwright E2E automation framework. Use this file to understand the project structure, key workflows, and agent conventions.

## What this repo does

- Uses Playwright and TypeScript for end-to-end browser tests.
- Uses AI agents and custom prompts to create test plans, generate spec code, and heal failing tests.
- Supports requirements-driven automation with `requirements/`, `specs/`, `tests/`, `pages/`, and `fixtures/`.
- Loads environment config from `.env.<env>` via `TEST_ENV`.

## Key files and directories

- `package.json`: npm scripts for tests, linting, and formatting.
- `playwright.config.ts`: Playwright test configuration and browser settings.
- `tests/`: generated and authored Playwright spec files.
- `pages/`: page object classes.
- `requirements/`: requirement source files.
- `specs/`: test plan markdown files.
- `fixtures/`: test data and auth state.
- `.github/agents/`: Copilot agent definitions.
- `.github/prompts/`: slash command prompt definitions.
- `.github/workflows/`: CI workflows.
- `docs/`: architecture and command documentation.

## AI workflow

1. Create/approve a plan with `/create-testplan`.
2. Generate tests with `/generate-specs-from-plan`.
3. Run tests with `npm test` or `npx playwright test`.
4. Fix failures with `/heal-failed-run`.

## Existing agent definitions

- `.github/agents/playwright-test-planner.agent.md`
- `.github/agents/playwright-test-generator.agent.md`
- `.github/agents/playwright-test-healer.agent.md`
- `.github/prompts/create-testplan.prompt.md`
- `.github/prompts/generate-specs-from-plan.prompt.md`
- `.github/prompts/heal-failed-run.prompt.md`
- `.github/prompts/update-requirement.prompt.md`

## Important command references

- `npm ci`
- `npx playwright install --with-deps`
- `npm test`
- `npm run test:headed`
- `npm run test:debug`
- `npm run test:ui`
- `npm run test:chromium`
- `npm run test:staging`
- `npm run test:report`
- `npm run lint`
- `npm run format`

## Agent guidance

- Prefer the existing `.github/agents` and `.github/prompts` definitions.
- Keep page objects role-first and use `page.getByRole()` before other locator strategies.
- Keep assertions in tests, not page objects.
- Do not create duplicate instructions that conflict with `docs/` or the `.claude/skills` definitions.
- If a new AI workflow is needed, update this file and the corresponding `.github/agents` / `.github/prompts` files.
