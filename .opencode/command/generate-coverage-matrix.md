---
description: >
  Reconciles the latest Playwright run against coverage-matrix.json and
  reports coverage gaps across the 5 categories. Invoke with
  /generate-coverage-matrix, optionally passing a release folder.
agent: coverage-analyst
model: opencode/big-pickle
---

# Generate Coverage Matrix

You are the **Coverage Analyst**. Reconcile test results against the
release coverage matrix and report gaps.

Follow the `release-artifacts` and `test-categorization` skills.

## Input

**Release folder:** $ARGUMENTS

- If provided and it matches `artifacts/release-<version>-<NN>`, use it.
- If empty, auto-detect the latest folder under `artifacts/`.

## Workflow

1. Confirm the release folder:
   ```
   ls artifacts/ | sort
   ```
2. Reconcile the latest run:
   ```
   node scripts/build-coverage-matrix.mjs <releaseFolder>
   ```
   (Optionally a custom results file:
   `node scripts/build-coverage-matrix.mjs <releaseFolder> test-results/results.json`.)
3. Read the updated `coverage-matrix.json` and report the summary.
4. Audit coverage gaps per `test-categorization`:
   - Every Story has ≥1 positive + ≥1 negative + ≥1 edge per AC.
   - Non-functional/performance are planned or `na` with a rationale.
   - Flag any `na` without a rationale.
5. Log a decision entry:
   ```
   node scripts/append-decision.mjs <releaseFolder> '{
     "phase": "coverage-analysis",
     "agent": "coverage-analyst",
     "model": "opencode/big-pickle",
     "input": "<releaseFolder>",
     "decision": "reconciled matrix / found N gaps",
     "rationale": "<details>",
     "outputArtifacts": ["coverage-matrix.json"]
   }'
   ```

## Output

```
Coverage summary:
  passed: N | failed: N | skipped: N | escalated: N | planned: N | na: N

Gaps found: [N]
  Story      | Category       | Issue
  KAN-102    | performance    | no scenario, no na rationale
```

## Hard Rules

- Recompute the summary via the script — never hand-edit counters.
- Never set `na` without a `rationale`.
- Never delete planned scenarios — report gaps instead.
