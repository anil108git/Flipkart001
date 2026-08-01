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
| `npx playwright test --grep "@priority-p0"` | Run only P0 (blocking) tests |
| `npx playwright test --grep "@priority-p1"` | Run only P1 tests |
| `npx playwright test --grep "@priority-p2"` | Run only P2 tests |
| `npx playwright test --grep "@smoke"` | Run smoke tests |
| `npx playwright test --retries=0` | Run without retries |
| `npx playwright test --retries=2` | Run with 2 retries |
| `npx playwright test --workers=4` | Run with 4 parallel workers |
| `npx playwright test --reporter=list` | Use list reporter |
| `npx playwright test --reporter=json` | Use JSON reporter |
| `npx playwright show-report` | Open last HTML report |

---

## Release Pipeline Scripts

| Command | Description |
|---------|-------------|
| `node scripts/init-release.mjs <version> <EPIC_KEY>` | Scaffold `artifacts/release-<version>-<NN>/` (auto-increment) |
| `node scripts/append-decision.mjs <releaseFolder> '<json>'` | Append a decision-log entry |
| `node scripts/build-coverage-matrix.mjs <releaseFolder> [results.json]` | Recompute coverage-matrix.json summary |
| `node scripts/build-rtm.mjs <releaseFolder>` | Generate human-readable `rtm.md` (Requirements Traceability Matrix) |
| `node scripts/ci-heal.mjs ...` | CI healing (decision-log aware) |

---

## Slash Commands (opencode)

These commands are defined in `.opencode/command/` and invoked inside opencode.

### Release Planning (one-shot orchestrator)

| Command | Description |
|---------|-------------|
| `/plan-release` | Full pipeline: scope → plan → generate → review → artifacts |
| `/plan-release KAN-45` | Plan + generate from an Epic key |
| `/plan-release KAN-101` | Plan + generate from a Story key |
| `/plan-release 'fixVersion = "v1.2" AND project = KAN'` | Plan + generate from JQL |

### Test Plan Creation

| Command | Description |
|---------|-------------|
| `/create-testplan` | Create test plan from any requirement source |
| `/create-testplan KAN-101` | Create plan from Jira issue |
| `/create-testplan requirements/flipkart.md` | Create plan from local file |
| `/create-testplan https://...` | Create plan from URL |

### Spec File Generation

| Command | Description |
|---------|-------------|
| `/generate-specs-from-plan` | Generate spec files from approved plan |
| `/generate-specs-from-plan artifacts/release-v1.2-01/stories/test-plan-KAN-101-v1.2.md` | Generate from specific plan |

### Incremental Updates

| Command | Description |
|---------|-------------|
| `/update-requirement` | Update plan when requirement changes |
| `/update-requirement old.md new.md artifacts/.../test-plan.md` | Full update command |

### Grooming Recheck

| Command | Description |
|---------|-------------|
| `/recheck-grooming` | Poll open grooming Question bugs; re-plan answered Stories |
| `/recheck-grooming artifacts/release-v1.2-01` | Recheck a specific release folder's grooming queue |

### Test Healing

| Command | Description |
|---------|-------------|
| `/heal-failed-run` | Fix failing tests (auto-detect last run) |
| `/heal-failed-run tests/login.spec.ts` | Fix specific spec file |
| `/heal-failed-run last` | Fix most recent local failure |

### Coverage

| Command | Description |
|---------|-------------|
| `/generate-coverage-matrix` | Reconcile latest run into coverage matrix |
| `/generate-coverage-matrix artifacts/release-v1.2-01` | Reconcile a specific release folder |

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
| `JIRA_API_TOKEN` | Token | Jira API token (Atlassian Cloud) |
| `JIRA_USER_EMAIL` | Email | Email associated with the Jira token |

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

## Quick Reference

### First Time Setup
```bash
npm ci                          # Install dependencies
npx playwright install          # Install browsers
npx tsc --noEmit                # Verify TypeScript
npm test                        # Run tests
```

### Plan + Generate a Release (one-shot)
```bash
# 1. Resolve scope + scaffold + plan + generate + review
/plan-release KAN-45

# 2. Run tests
npm test

# 3. Reconcile coverage
/generate-coverage-matrix

# 4. Fix any failures
/heal-failed-run
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
/update-requirement old.md new.md artifacts/release-<v>-<NN>/stories/test-plan-<STORY>-<v>.md

# 2. Human reviews plan in the release folder

# 3. Generate/update specs
/generate-specs-from-plan artifacts/release-<v>-<NN>/stories/test-plan-<STORY>-<v>.md

# 4. Run tests
npm test

# 5. Reconcile coverage
/generate-coverage-matrix

# 6. Fix any failures
/heal-failed-run
```

### Before Commit
```bash
npx tsc --noEmit                # Type-check
npm run lint                    # Lint
npm run format                  # Format
npm test                        # Verify tests pass
```
