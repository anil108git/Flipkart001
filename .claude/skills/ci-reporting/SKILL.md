---
name: ci-reporting
description: >
  Use this skill when setting up, editing, or running the Playwright CI
  pipeline on GitHub Actions. Triggers when a user says "set up CI",
  "configure GitHub Actions", "publish test report", "fix the pipeline",
  "add retries to CI", or "deploy report to GitHub Pages". Covers the
  full pipeline: environment selection, test execution, retry/parallel
  config, HTML report publishing to GitHub Pages, artifact upload for
  traces, flaky test quarantine policy, and merge-blocking rules.
  All generated workflow YAML must follow these rules exactly.
---

# CI Reporting — GitHub Actions + GitHub Pages

## Core Principles

1. **CI is the source of truth** — Local runs are for development only.
   The merge decision is always based on the CI run result.
2. **Reports must be publicly linkable** — Every CI run produces an HTML
   report published to GitHub Pages so Jira write-back comments can link
   to it without requiring repo access.
3. **Flaky tests are quarantined, not ignored** — A flaky test is never
   silently retried into a pass. It is flagged, quarantined, and a
   Bugasura ticket is raised.
4. **Traces are always uploaded for failures** — A failing test without
   a trace is undebuggable. Trace upload is non-negotiable.
5. **Staging runs are never merge-blocking** — Only the dev environment
   run gates the PR. Staging is a post-merge verification step.

---

## Pipeline Overview

```
PR opened / push to branch
        │
        ├─ [Job: test-dev]
        │     Run tests against dev environment
        │     Retry failed tests once
        │     Upload traces for failures
        │     Publish HTML report to GitHub Pages
        │     Trigger Jira write-back
        │     MERGE-BLOCKING ✅
        │
Merge to main
        │
        └─ [Job: test-staging]
              Run tests against staging environment
              Retry failed tests once
              Upload traces for failures
              Publish HTML report to GitHub Pages
              Trigger Jira write-back
              Trigger Healer agent on failure
              NOT merge-blocking ℹ️
```

---

## GitHub Actions Workflow

**File:** `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  # ─── DEV — runs on PR, merge-blocking ───────────────────────────────
  test-dev:
    name: E2E Tests (dev)
    runs-on: ubuntu-latest
    environment:
      name: dev

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests (dev)
        run: npx playwright test
        env:
          TEST_ENV: dev
          BASE_URL: ${{ secrets.DEV_BASE_URL }}
          API_URL: ${{ secrets.DEV_API_URL }}
          TEST_USER_EMAIL: ${{ secrets.DEV_TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.DEV_TEST_USER_PASSWORD }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
          JIRA_USER_EMAIL: ${{ secrets.JIRA_USER_EMAIL }}
          BUGASURA_API_KEY: ${{ secrets.BUGASURA_API_KEY }}

      - name: Upload traces (failures only)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces-dev-${{ github.run_id }}
          path: test-results/
          retention-days: 14

      - name: Upload HTML report
        if: always()
        uses: actions/upload-pages-artifact@v3
        with:
          path: playwright-report/

  # ─── Deploy report to GitHub Pages (dev) ────────────────────────────
  deploy-report-dev:
    name: Publish Report (dev)
    needs: test-dev
    if: always()
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

  # ─── STAGING — runs on merge to main, NOT merge-blocking ────────────
  test-staging:
    name: E2E Tests (staging)
    runs-on: ubuntu-latest
    needs: []
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment:
      name: staging

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests (staging)
        run: npx playwright test
        env:
          TEST_ENV: staging
          BASE_URL: ${{ secrets.STAGING_BASE_URL }}
          API_URL: ${{ secrets.STAGING_API_URL }}
          TEST_USER_EMAIL: ${{ secrets.STAGING_TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.STAGING_TEST_USER_PASSWORD }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
          JIRA_USER_EMAIL: ${{ secrets.JIRA_USER_EMAIL }}
          BUGASURA_API_KEY: ${{ secrets.BUGASURA_API_KEY }}

      - name: Upload traces (failures only)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces-staging-${{ github.run_id }}
          path: test-results/
          retention-days: 14

      - name: Upload HTML report
        if: always()
        uses: actions/upload-pages-artifact@v3
        with:
          path: playwright-report/

  deploy-report-staging:
    name: Publish Report (staging)
    needs: test-staging
    if: always() && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Playwright Config — CI-Specific Settings

These settings must be present in `playwright.config.ts` for CI to work
correctly with the pipeline above:

```typescript
export default defineConfig({
  // Retry once in CI, no retries locally
  retries: process.env.CI ? 1 : 0,

  // Parallel workers — full parallelism in CI, single worker locally
  workers: process.env.CI ? '50%' : 1,

  // Always produce HTML report + always produce traces
  reporter: [
    ['html', { open: 'never' }],
    ['github'],           // Annotates PR with failed test names
    ['list'],             // Console output for CI logs
  ],

  use: {
    // Capture trace on first retry only — avoids large trace files for flaky
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

---

## Retry and Parallelism Policy

| Setting | Dev CI | Staging CI | Local |
|---------|--------|-----------|-------|
| Retries | 1 | 1 | 0 |
| Workers | 50% of available | 50% of available | 1 |
| Trace | on-first-retry | on-first-retry | on |
| Screenshot | only-on-failure | only-on-failure | only-on-failure |
| Video | retain-on-failure | retain-on-failure | off |

**Never set retries above 1 in CI** — more than one retry masks flaky
tests instead of surfacing them.

---

## Flaky Test Policy

A test is flaky if it passes on the first attempt but fails on retry,
OR fails on the first attempt and passes on retry.

```
Test fails on first attempt
        │
        ├─ Retry 1: PASSES → Flaky detected
        │     Do NOT mark as passed
        │     Tag result as FLAKY in run summary
        │     Raise Bugasura ticket with label: flaky
        │     Do NOT block merge for flaky failures
        │
        └─ Retry 1: FAILS → Consistent failure
              Block merge (dev only)
              Raise Bugasura ticket with label: healer-escalation
              Trigger Healer agent (staging only, post-merge)
```

---

## GitHub Pages Setup

### One-time setup (do this before first pipeline run)

1. Go to repo **Settings → Pages**
2. Set **Source** to `GitHub Actions`
3. No branch selection needed — the workflow handles deployment

### Report URL pattern
```
https://<org>.github.io/<repo>/
```

This URL is what gets embedded in Jira write-back comments.
Replace `<org>` and `<repo>` in the `jira-write-back` skill template.

### One report at a time
GitHub Pages hosts one deployment at a time. Each run overwrites the
previous report. Traces are preserved as downloadable CI artifacts
for 14 days (see workflow above).

---

## Required GitHub Secrets

Set all of these under **repo Settings → Secrets and variables → Actions**
before the first pipeline run:

| Secret | Description |
|--------|-------------|
| `DEV_BASE_URL` | Dev environment base URL |
| `DEV_API_URL` | Dev environment API URL |
| `DEV_TEST_USER_EMAIL` | Test user email for dev |
| `DEV_TEST_USER_PASSWORD` | Test user password for dev |
| `STAGING_BASE_URL` | Staging environment base URL |
| `STAGING_API_URL` | Staging environment API URL |
| `STAGING_TEST_USER_EMAIL` | Test user email for staging |
| `STAGING_TEST_USER_PASSWORD` | Test user password for staging |
| `JIRA_API_TOKEN` | Jira personal access token |
| `JIRA_USER_EMAIL` | Email associated with Jira token |
| `BUGASURA_API_KEY` | Bugasura MCP API key |

---

## Merge-Blocking Rules

| Condition | Dev | Staging |
|-----------|-----|---------|
| All tests pass | ✅ Allow merge | ℹ️ Post-merge only |
| Some tests fail (consistent) | ❌ Block merge | ℹ️ Raise Bugasura ticket |
| Some tests flaky | ⚠️ Allow merge + raise Bugasura | ℹ️ Raise Bugasura ticket |
| All tests fail | ❌ Block merge | ℹ️ Raise Bugasura ticket |
| Pipeline setup error | ❌ Block merge | ❌ Block next staging run |

---

## What This Skill Must Never Do

- Set retries above 1 in CI — masks flaky tests.
- Use `continue-on-error: true` on the test step — hides failures from
  PR checks.
- Skip trace upload for failing tests — undebuggable failures are useless.
- Deploy to GitHub Pages only on success — report must publish on
  `if: always()` so failures are visible too.
- Hardcode any secret, URL, or credential in the workflow YAML.
- Block merge based on staging failures — staging is post-merge only.
- Use `test.only` or `test.skip` in committed spec files to make CI pass.
- Run all browsers in CI by default — use Chromium only unless
  cross-browser testing is explicitly required for a ticket.