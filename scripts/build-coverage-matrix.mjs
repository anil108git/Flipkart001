#!/usr/bin/env node
/**
 * build-coverage-matrix.mjs — Update coverage-matrix.json from a Playwright run.
 *
 * Usage:
 *   node scripts/build-coverage-matrix.mjs <releaseFolder> [resultsJson]
 *
 * Examples:
 *   node scripts/build-coverage-matrix.mjs artifacts/release-v1.2-01
 *   node scripts/build-coverage-matrix.mjs artifacts/release-v1.2-01 test-results/results.json
 *
 * Behavior:
 *   - Reads test-results/results.json (default) and coverage-matrix.json.
 *   - Matches Playwright tests to matrix scenarios via specFile + testName.
 *   - Sets scenario status to passed / failed / skipped.
 *   - Recomputes the release-level summary counts.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const [releaseFolder, resultsPath = 'test-results/results.json'] = process.argv.slice(2);

function fail(msg) {
  console.error(`[build-coverage-matrix] FAIL: ${msg}`);
  process.exit(1);
}

if (!releaseFolder) {
  fail('Missing release folder. Usage: node scripts/build-coverage-matrix.mjs <releaseFolder>');
}

const matrixPath = join(releaseFolder, 'coverage-matrix.json');
if (!existsSync(matrixPath)) {
  fail(`No coverage-matrix.json found at ${matrixPath}. Run init-release.mjs first.`);
}
if (!existsSync(resultsPath)) {
  fail(`No Playwright results found at ${resultsPath}. Run npx playwright test first.`);
}

const matrix = JSON.parse(readFileSync(matrixPath, 'utf-8'));
const results = JSON.parse(readFileSync(resultsPath, 'utf-8'));

// ─── Index test outcomes ──────────────────────────────────────────────────
const outcomeByTest = new Map(); // `${specFile}::${title}` -> status
function walkSuite(suite) {
  for (const spec of suite.specs ?? []) {
    const specFile = spec.file ?? suite.file ?? 'unknown';
    for (const test of spec.tests ?? []) {
      const last = test.results?.at(-1);
      const status = last?.status ?? (test.status ?? 'unknown');
      outcomeByTest.set(`${specFile}::${spec.title}`, normalize(status));
    }
  }
  for (const child of suite.suites ?? []) walkSuite(child);
}
for (const suite of results.suites ?? []) walkSuite(suite);

function normalize(s) {
  if (s === 'passed') return 'passed';
  if (s === 'failed' || s === 'timedOut') return 'failed';
  if (s === 'skipped' || s === 'pending') return 'skipped';
  return 'unknown';
}

// ─── Update scenario statuses ─────────────────────────────────────────────
const summary = {
  epics: (matrix.epics ?? []).length,
  stories: 0,
  scenarios: 0,
  planned: 0,
  generated: 0,
  passed: 0,
  failed: 0,
  escalated: 0,
  skipped: 0,
  na: 0,
  unknown: 0,
};

function bump(key, delta = 1) {
  summary[key] = (summary[key] ?? 0) + delta;
}

for (const epic of matrix.epics ?? []) {
  for (const story of epic.stories ?? []) {
    summary.stories += 1;
    for (const scenario of story.scenarios ?? []) {
      summary.scenarios += 1;
      const { specFile, testName } = scenario;
      if (specFile && testName) {
        const key = `${specFile}::${testName}`;
        const status = outcomeByTest.get(key);
        if (status) {
          scenario.status = status;
          scenario.lastRunAt = results.config?.metadata?.runId ?? new Date().toISOString();
        }
      }
      bump(scenario.status ?? 'planned', +1);
    }
  }
}

matrix.summary = summary;
writeFileSync(matrixPath, JSON.stringify(matrix, null, 2) + '\n', 'utf-8');

console.log('[build-coverage-matrix] Updated coverage-matrix.json');
console.log(JSON.stringify(summary, null, 2));
