# List of Commands

All commands available in the AI-powered Playwright E2E framework.

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (loads `.env.dev` by default) |
| `npm run test:headed` | Run tests in headed (visible browser) mode |
| `npm run test:ui` | Run tests in Playwright UI mode |
| `npm run test:debug` | Run tests in debug mode (step through) |
| `npm run test:chromium` | Run tests in Chromium only (fastest) |
| `npm run test:staging` | Run tests against staging environment |
| `npm run test:report` | Open HTML test report in browser |
| `npm run lint` | Lint TypeScript files |
| `npm run format` | Format code with Prettier |

---

## Playwright CLI Commands

| Command | Description |
|---------|-------------|
| `npx playwright test` | Run all tests |
| `npx playwright test --headed` | Run with visible browser |
| `npx playwright test --debug` | Debug mode with step-through |
| `npx playwright test --ui` | Interactive UI mode |
| `npx playwright test --project=chromium` | Run Chromium project only |
| `npx playwright test tests/login.spec.ts` | Run specific spec file |
| `npx playwright test --grep "should login"` | Run tests matching pattern |
| `npx playwright test --retries=0` | Run without retries |
| `npx playwright test --retries=2` | Run with 2 retries |
| `npx playwright test --workers=4` | Run with 4 parallel workers |
| `npx playwright test --reporter=list` | Use list reporter |
| `npx playwright test --reporter=json` | Use JSON reporter |
| `npx playwright show-report` | Open last HTML report |

---

## Slash Commands (Prompts)

These commands are used in VS Code with GitHub Copilot or Claude Code.

### Test Plan Creation

| Command | Description |
|---------|-------------|
| `/create-testplan` | Create test plan from any requirement source |
| `/create-testplan REQ-42` | Create plan from Bugasura requirement |
| `/create-testplan requirements/flipkart.md` | Create plan from local file |
| `/create-testplan https://...` | Create plan from URL |

### Spec File Generation

| Command | Description |
|---------|-------------|
| `/generate-specs-from-plan` | Generate spec files from approved plan |
| `/generate-specs-from-plan specs/flipkart.md` | Generate from specific plan |

### Incremental Updates

| Command | Description |
|---------|-------------|
| `/update-requirement` | Update plan when requirement changes |
| `/update-requirement old.md new.md specs/plan.md` | Full update command |

### Test Healing

| Command | Description |
|---------|-------------|
| `/heal-failed-run` | Fix failing tests (auto-detect last run) |
| `/heal-failed-run tests/login.spec.ts` | Fix specific spec file |
| `/heal-failed-run last` | Fix most recent local failure |

---

## TypeScript & Code Quality

| Command | Description |
|---------|-------------|
| `npx tsc --noEmit` | Type-check without emitting files |
| `npm run lint` | Run ESLint on TypeScript files |
| `npm run format` | Format with Prettier |

---

## Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `TEST_ENV` | `dev`, `staging` | Environment to test against (default: `dev`) |
| `BASE_URL` | URL | Application base URL |
| `API_URL` | URL | API endpoint URL |
| `TEST_USER_EMAIL` | Email | Test user email |
| `TEST_USER_PASSWORD` | Password | Test user password |


### Usage Examples

```bash
# Run against staging
TEST_ENV=staging npx playwright test
```

---

## CI Commands (GitHub Actions)

| Command | Description |
|---------|-------------|
| `npm ci` | Install dependencies (clean install) |
| `npx playwright install --with-deps` | Install Playwright browsers + OS deps |
| `npx playwright test` | Run all tests in CI |


---



---## Quick Reference

### First Time Setup
```bash
npm ci                          # Install dependencies
npx playwright install          # Install browsers
npx tsc --noEmit                # Verify TypeScript
npm test                        # Run tests
```

### Daily Development
```bash
npm run test:headed             # Run tests (visible)
npm run test:debug              # Debug failing test
npx playwright test --grep "login"  # Run specific test
npm run test:report             # View report
```

### When Requirement Changes
```bash
# 1. Create/update plan
/create-testplan requirements/flipkart.md

# 2. Human reviews plan in specs/

# 3. Generate/update specs
/generate-specs-from-plan specs/flipkart.md

# 4. Run tests
npm test

# 5. Fix any failures
/heal-failed-run
```

### Before Commit
```bash
npx tsc --noEmit                # Type-check
npm run lint                    # Lint
npm run format                  # Format
npm test                        # Verify tests pass
```
