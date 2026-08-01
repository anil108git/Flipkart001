#!/usr/bin/env node
/**
 * append-decision.mjs — Append an entry to agent-decision-log.json.
 *
 * Usage:
 *   node scripts/append-decision.mjs <releaseFolder> '<json>'
 *
 * Example:
 *   node scripts/append-decision.mjs artifacts/release-v1.2-01 '{
 *     "phase": "planning",
 *     "agent": "planner",
 *     "model": "opencode/nemotron-3-ultra-free",
 *     "input": "KAN-45 -> stories [KAN-101, KAN-102]",
 *     "decision": "added 12 scenarios across 5 categories",
 *     "rationale": "AC lines 1-6 mapped; perf na (no perf requirement)"
 *   }'
 *
 * The entry is timestamped and appended. Requires an existing
 * agent-decision-log.json created by init-release.mjs.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const [releaseFolder, entryJson] = process.argv.slice(2);

function fail(msg) {
  console.error(`[append-decision] FAIL: ${msg}`);
  process.exit(1);
}

if (!releaseFolder || !entryJson) {
  fail('Missing args. Usage: node scripts/append-decision.mjs <releaseFolder> \'<json>\'');
}

const logPath = join(releaseFolder, 'agent-decision-log.json');
if (!existsSync(logPath)) {
  fail(`No agent-decision-log.json found at ${logPath}. Run init-release.mjs first.`);
}

let entry;
try {
  entry = JSON.parse(entryJson);
} catch (e) {
  fail(`Invalid JSON entry: ${e.message}`);
}

const log = JSON.parse(readFileSync(logPath, 'utf-8'));
log.push({ timestamp: new Date().toISOString(), ...entry });

writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n', 'utf-8');
console.log(`[append-decision] Appended entry #${log.length} to ${logPath}`);
