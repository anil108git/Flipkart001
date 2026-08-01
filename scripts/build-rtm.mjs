#!/usr/bin/env node
/**
 * build-rtm.mjs — Generate a human-readable Requirements Traceability Matrix.
 *
 * Usage:
 *   node scripts/build-rtm.mjs <releaseFolder>
 *
 * Example:
 *   node scripts/build-rtm.mjs artifacts/release-v1.2-01
 *
 * Behavior:
 *   - Reads coverage-matrix.json from the release folder.
 *   - Emits rtm.md (next to coverage-matrix.json) with one row per scenario:
 *     Story | AC | AC Text | Scenario | Category | Priority | Tags | Spec | Test | Status
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const releaseFolder = process.argv[2];

function fail(msg) {
  console.error(`[build-rtm] FAIL: ${msg}`);
  process.exit(1);
}

if (!releaseFolder) {
  fail('Missing release folder. Usage: node scripts/build-rtm.mjs <releaseFolder>');
}

const matrixPath = join(releaseFolder, 'coverage-matrix.json');
if (!existsSync(matrixPath)) {
  fail(`No coverage-matrix.json found at ${matrixPath}. Run init-release.mjs first.`);
}

const matrix = JSON.parse(readFileSync(matrixPath, 'utf-8'));

function esc(cell) {
  if (cell === null || cell === undefined) return '—';
  return String(cell).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

const rows = [];
const byPriority = { p0: 0, p1: 0, p2: 0 };
let blockedStories = [];

for (const epic of matrix.epics ?? []) {
  for (const story of epic.stories ?? []) {
    if (story.blockedReason) {
      blockedStories.push(`${story.key} (${story.blockedReason})`);
    }
    for (const scenario of story.scenarios ?? []) {
      const priority = scenario.priority || 'p1';
      byPriority[priority] = (byPriority[priority] ?? 0) + 1;
      rows.push(
        [
          story.key,
          scenario.source || '—',
          scenario.acText || '—',
          scenario.title || '—',
          scenario.category || '—',
          priority,
          (scenario.tags ?? []).join(' '),
          scenario.specFile || '—',
          scenario.testName || '—',
          scenario.status || 'planned',
        ]
          .map(esc)
          .join(' | ')
      );
    }
  }
}

const total = rows.length;
const statusCounts = {};
for (const r of rows) {
  const status = r.split(' | ').at(-1);
  statusCounts[status] = (statusCounts[status] ?? 0) + 1;
}
const statusSummary = Object.entries(statusCounts)
  .map(([k, v]) => `${k}: ${v}`)
  .join(' · ');

const out = [
  `# Requirements Traceability Matrix — Release ${esc(matrix.release)}`,
  '',
  `**Epic:** ${esc(matrix.epicKey)} · **Folder:** ${esc(matrix.releaseFolder)}`,
  `**Generated:** ${new Date().toISOString()}`,
  '',
  `Total scenarios: **${total}**`,
  `Status: ${statusSummary || '—'}`,
  `Priority: p0: ${byPriority.p0} · p1: ${byPriority.p1} · p2: ${byPriority.p2}`,
  '',
  ...(blockedStories.length
    ? [`Blocked stories: ${blockedStories.join(', ')}`, '']
    : []),
  '| Story | AC | AC Text | Scenario | Category | Priority | Tags | Spec File | Test | Status |',
  '|-------|----|---------|----------|----------|----------|------|-----------|------|--------|',
  ...rows.map((r) => `| ${r} |`),
  '',
].join('\n');

writeFileSync(join(releaseFolder, 'rtm.md'), out + '\n', 'utf-8');

console.log(`[build-rtm] Wrote ${join(releaseFolder, 'rtm.md')}`);
console.log(`[build-rtm] ${total} scenarios (p0: ${byPriority.p0}, p1: ${byPriority.p1}, p2: ${byPriority.p2})`);
