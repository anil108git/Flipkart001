#!/usr/bin/env node
/**
 * init-release.mjs — Scaffold a new release artifact folder.
 *
 * Usage:
 *   node scripts/init-release.mjs <releaseVersion> [baseSpec]
 *
 * Examples:
 *   node scripts/init-release.mjs v1.2
 *   node scripts/init-release.mjs v1.2 KAN-45
 *
 * Behavior:
 *   - Determines the next suffix by scanning artifacts/ for existing
 *     release-<version>-<NN> folders and auto-incrementing NN.
 *   - Creates artifacts/release-<version>-<NN>/ with:
 *       agent-decision-log.json   (empty array)
 *       coverage-matrix.json      (release-scoped skeleton)
 *       stories/                  (per-story test plans land here)
 *   - Writes a releaseInfo entry into coverage-matrix.json.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ARTIFACTS_DIR = 'artifacts';
const [releaseVersion, epicKey = ''] = process.argv.slice(2);

function fail(msg) {
  console.error(`[init-release] FAIL: ${msg}`);
  process.exit(1);
}

if (!releaseVersion) {
  fail('Missing release version. Usage: node scripts/init-release.mjs <releaseVersion> [epicKey]');
}

// ─── Determine next suffix (auto-increment) ───────────────────────────────
const prefix = `release-${releaseVersion}-`;
let nextSuffix = 1;
if (existsSync(ARTIFACTS_DIR)) {
  const existing = readdirSync(ARTIFACTS_DIR).filter((name) =>
    new RegExp(`^release-${escapeRegExp(releaseVersion)}-\\d+$`).test(name)
  );
  const suffixes = existing
    .map((name) => parseInt(name.slice(prefix.length), 10))
    .filter((n) => Number.isInteger(n));
  if (suffixes.length > 0) nextSuffix = Math.max(...suffixes) + 1;
}

const releaseDir = join(ARTIFACTS_DIR, `${prefix}${String(nextSuffix).padStart(2, '0')}`);

// ─── Skeleton: agent-decision-log.json ────────────────────────────────────
const decisionLog = [];

// ─── Skeleton: coverage-matrix.json ───────────────────────────────────────
const coverageMatrix = {
  release: releaseVersion,
  releaseFolder: releaseDir,
  epicKey: epicKey || null,
  generatedAt: new Date().toISOString(),
  epics: [],
  summary: {
    epics: 0,
    stories: 0,
    scenarios: 0,
    planned: 0,
    generated: 0,
    passed: 0,
    failed: 0,
    escalated: 0,
    na: 0,
  },
};

// ─── Write ────────────────────────────────────────────────────────────────
mkdirSync(join(releaseDir, 'stories'), { recursive: true });
writeFileSync(
  join(releaseDir, 'agent-decision-log.json'),
  JSON.stringify(decisionLog, null, 2) + '\n',
  'utf-8'
);
writeFileSync(
  join(releaseDir, 'coverage-matrix.json'),
  JSON.stringify(coverageMatrix, null, 2) + '\n',
  'utf-8'
);

console.log(`[init-release] Created ${releaseDir}`);
console.log(`[init-release]   agent-decision-log.json`);
console.log(`[init-release]   coverage-matrix.json`);
console.log(`[init-release]   stories/`);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
