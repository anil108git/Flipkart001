# GitHub Copilot Instructions — Flipkart001

This repository is an AI-first Playwright E2E automation framework. Use this file to understand the project structure, key workflows, and agent conventions.

## What this repo does

- Uses Playwright and TypeScript for end-to-end browser tests.
- Uses AI agents and custom prompts to create test plans, generate spec code, and heal failing tests.
- Supports requirements-driven automation with `requirements/`, `tests/`, `pages/`, and `fixtures/`.
- Loads environment config from `.env.<env>` via `TEST_ENV`.

## Key files and directories

- `package.json`: npm scripts for tests, linting, and formatting.
- `playwright.config.ts`: Playwright test configuration and browser settings.
- `tests/`: generated and authored Playwright spec files.
- `pages/`: page object classes.
- `requirements/`: requirement source files.
- `artifacts/release-<version>-<NN>/`: per-release plans, coverage matrix, decision log.
- `fixtures/`: test data and auth state.
- `.opencode/agent/`: opencode agent definitions.
- `.opencode/command/`: slash command definitions.
- `.opencode/skills/`: skill definitions (coding-standards, jira-to-test-plan, healing-policy, etc.).
- `.github/workflows/`: CI workflows.
- `docs/`: architecture and command documentation.

## AI workflow

1. Plan a release with `/plan-release <Story|Epic|JQL>`.
2. Create/approve a plan with `/create-testplan`.
3. Generate tests with `/generate-specs-from-plan`.
4. Run tests with `npm test` or `npx playwright test`.
5. Reconcile coverage with `/generate-coverage-matrix`.
6. Fix failures with `/heal-failed-run`.
7. Recheck blocked grooming stories with `/recheck-grooming`.

## Existing agent definitions

- `.opencode/agent/release-planner.md`
- `.opencode/agent/planner.md`
- `.opencode/agent/generator.md`
- `.opencode/agent/healer.md`
- `.opencode/agent/coverage-analyst.md`
- `.opencode/command/plan-release.md`
- `.opencode/command/create-testplan.md`
- `.opencode/command/generate-specs-from-plan.md`
- `.opencode/command/heal-failed-run.md`
- `.opencode/command/update-requirement.md`
- `.opencode/command/generate-coverage-matrix.md`
- `.opencode/command/recheck-grooming.md`

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

- Prefer the existing `.opencode/agent` and `.opencode/command` definitions.
- Keep page objects role-first and use `page.getByRole()` before other locator strategies.
- Keep assertions in tests, not page objects.
- Do not create duplicate instructions that conflict with `docs/` or the `.opencode/skills` definitions.
- If a new AI workflow is needed, update this file and the corresponding `.opencode/agent` / `.opencode/command` files.
