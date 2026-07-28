# AGENTS.md — AI Agent Instructions

## Commands

```bash
npm test                    # Run all tests (loads .env.dev by default)
npm run test:chromium       # Chromium only (fastest for CI)
npm run test:staging        # Run against staging environment
TEST_ENV=staging npx playwright test   # Explicit env override
npx tsc --noEmit            # Type-check (must pass before commits)
npm run lint                # Lint TypeScript
npm run format              # Format code
```

## Environment Loading

Config reads `process.env.TEST_ENV` (defaults to `dev`), loads `.env.{TEST_ENV}`.
Available files: `.env.dev`, `.env.staging`. Never commit `.env*` — `.env.example` is the template.

Environment variables:
- `BASE_URL` — Application base URL (required)
- `API_URL` — API endpoint URL (required)
- `TEST_USER_EMAIL` — Test user email
- `TEST_USER_PASSWORD` — Test user password
- `LLM_PROVIDER` — `gemini` (CI) or `local` (dev, requires Ollama)
- `GEMINI_API_KEY` — Gemini API key (required when `LLM_PROVIDER=gemini`)
- `LOCAL_LLM_URL` — Local LLM endpoint (default: `http://localhost:11434`)
- `LOCAL_LLM_MODEL` — Local model name (default: `llama3`)
- `BUGASURA_API_KEY` — Bugasura API key (required for Jira integration)

## TypeScript

- Strict mode, Node16 module resolution
- Config includes: `tests/**/*.ts`, `pages/**/*.ts`, `fixtures/**/*.ts`, `orchestrator/**/*.ts`, `playwright.config.ts`
- Run `npx tsc --noEmit` to verify — must pass before commits

## Locator Priority (Mandatory)

1. `getByRole` — always first
2. `getByLabel` — form inputs
3. `getByTestId` — fallback only
4. CSS/XPath — prohibited unless documented exception

## Page Object Model

All page interactions go through page objects in `pages/`. Never use raw `page.goto()` or `page.click()` in spec files.

Page object rules:
- No assertions inside page objects
- No test data inside page objects
- One method = one action
- Methods return `Promise<void>` or readable value

## Test Rules

- Each test independent — no shared state between tests
- Use `test.describe` blocks with Jira ticket ID when available
- Never use `page.waitForTimeout()` — use auto-waiting
- Auth state stored in `fixtures/auth/.auth/` (gitignored)
- No `test.only` committed to repo

## Test Tags (Mandatory)

Every test MUST have at least one tag. Tags are comments above the test function.

| Tag | Description | When to Use |
|-----|-------------|-------------|
| `@smoke` | Critical path | Positive + Simple/Medium complexity |
| `@regression` | Full suite | All scenarios |
| `@e2e` | End-to-end flow | Complex multi-page scenarios |
| `@ui` | UI element verification | Element visibility, layout |
| `@negative` | Error handling | All negative scenarios |
| `@edge-case` | Boundary inputs | All edge case scenarios |
| `@accessibility` | A11y compliance | Keyboard, screen reader |
| `@performance` | Load time, rendering | Performance scenarios |
| `@security` | Security validation | XSS, injection |

### Running Tests by Tag

```bash
npx playwright test --grep @smoke        # Smoke tests only
npx playwright test --grep @regression   # Regression tests only
npx playwright test --grep @e2e          # E2E tests only
npx playwright test --grep @negative     # Negative tests only
npx playwright test --grep @edge-case    # Edge case tests only
npx playwright test --grep "@smoke|@regression"  # Multiple tags
```

## Test Categorization

Plans must include all three types for complete coverage:

| Type | Description | Example |
|------|-------------|---------|
| Positive | Happy path — valid input, expected behavior | User logs in with correct credentials |
| Negative | Error paths — invalid input, error handling | User logs in with wrong password |
| Edge Cases | Boundary conditions, unusual inputs | Empty fields, max length, special characters |

### Complexity Levels

| Complexity | Description | Examples |
|------------|-------------|----------|
| Simple | Single action, single assertion | Click button, verify element visible |
| Medium | Multi-step flow, multiple assertions | Fill form, submit, verify result |
| Complex | Multi-page flow, conditional logic, API + UI | Login → add to cart → checkout → verify order |

### Coverage Rules

- For every positive scenario, ask: "What happens if this fails?"
- For every input field, include: valid, invalid, empty, boundary cases
- For every action, include: success, failure, and timeout scenarios
- If a negative/edge case is not in the AC, mark as `SUGGESTED`

## Test Data Strategy

- Static data (happy path): `fixtures/data/*.json`
- Dynamic data (edge cases): `fixtures/data/generators.ts` using Faker
- No hardcoded strings in spec files — always import from `fixtures/data/`

## CI Behavior

- `retries: 1` on CI (never higher)
- `workers: 1` on CI
- `forbidOnly: true` on CI
- `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`

## Skills Location

Claude Code skills are in `.claude/skills/`. Load relevant skill before generating code:
- `coding-standards` — locator rules, POM patterns, test tags
- `test-data-setup` — fixtures, env config
- `healing-policy` — auto-fix rules
- `ci-reporting` — CI pipeline config
- `bugasura-to-test-plan` — Requirements to test plans
- `bugasura-write-back` — Results to Jira
- `requirements-only-planning` — Shift-left plans when feature isn't built yet

## Prompt Workflow

Prompts are in `.github/prompts/`. Use these to generate plans and specs:

| Prompt | Purpose | When to Use |
|--------|---------|-------------|
| `create-testplan` | Create test plan from requirements | Starting new feature tests |
| `generate-specs-from-plan` | Generate spec files from approved plan | After plan is approved |
| `update-requirement` | Update plan when requirements change | Requirement file changes |
| `heal-failed-run` | Fix failing tests | Tests fail in CI or locally |

## Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Page object file | `kebab-case.page.ts` | `login.page.ts` |
| Spec file | `kebab-case.spec.ts` | `login.spec.ts` |
| Page object class | `PascalCase + Page` | `LoginPage` |
| Test describe block | `'FeatureName — TICKET-ID'` | `'Login — AUTH-42'` |
| Test name | `'should [expected behavior]'` | `'should show error for invalid password'` |
