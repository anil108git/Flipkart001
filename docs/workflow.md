# Project Execution Workflow — Step by Step

This document explains how the release-driven Playwright E2E automation pipeline works, in simple terms.

---

## One-Shot Entry Point

You start with **one command** inside opencode:

```bash
/plan-release KAN-45
```

- `KAN-45` can be an **Epic**, a **Story** (e.g. `KAN-101`), or a **JQL filter**.
- This single command runs the **entire pipeline** from scope resolution through code generation and cross-review.

---

## Step 1 — Scope Resolution (Release Planner)

**Agent:** `release-planner` (model `opencode/deepseek-v4-flash-free`)

1. Queries Jira via MCP to expand the Epic → all its Stories.
2. Reads the Jira **fixVersion** field to derive the release version (e.g. `v1.2`).
3. Runs `node scripts/init-release.mjs v1.2 KAN-45` which creates:

   ```
   artifacts/release-v1.2-01/
   ├── agent-decision-log.json   # audit trail
   ├── coverage-matrix.json      # coverage tracker
   └── stories/                  # per-story plans will land here
   ```

4. Logs the decision, prints the scope table, and **waits for your approval** before proceeding.

---

## Step 2 — Test Planning (Planner)

**Agent:** `planner` (model `opencode/nemotron-3-ultra-free`)

For each Story in the scope:

1. Fetches the Story + acceptance criteria from Jira.
2. **Grooming gate** — if a Story has **zero** acceptance criteria, it is
   NOT planned. The Planner raises a `Question:` bug in Jira
   (`jira_create_issue`), links it to the Story and Epic
   (`jira_link_issues`), and blocks the Story in `coverage-matrix.json` +
   `grooming-queue.json`. When the PM replies, `/recheck-grooming`
   unblocks and re-plans it.
3. Maps every AC line to test scenarios across the **5 mandatory categories**:
   - Positive (happy path)
   - Negative (invalid input / error cases)
   - Edge (boundary, empty, special chars)
   - Non-Functional (accessibility, security, compatibility, usability, reliability)
   - Performance (load, response time)
4. Any category not applicable is marked `na` **with a rationale**.
5. Records `acText` (verbatim AC) + `priority` (`p0`/`p1`/`p2` from Jira
   priority) on every scenario.
6. Writes the plan to `artifacts/release-v1.2-01/stories/test-plan-KAN-101-v1.2.md`
7. Adds each scenario row to `coverage-matrix.json` with `status: "planned"`.

---

## Step 3 — Code Generation (Generator)

**Agent:** `generator` (model `opencode/north-mini-code-free`)

Reads the approved plans and produces real Playwright code:

- **Page objects** → `pages/kan-<story>-<feature>.page.ts`
- **Test specs** → `tests/kan-<story>-<feature>.spec.ts`

Every spec file embeds traceability:

```typescript
test.describe('[Feature Name] — KAN-101 (Epic: KAN-45)', () => { ... })
```

And every `test()` begins with traceability annotations:

```typescript
test('should show search box', async ({ page }) => {
  test.info().annotations.push(
    { type: 'story', description: 'KAN-101' },
    { type: 'epic', description: 'KAN-45' },
    { type: 'AC', description: 'AC-1 — Search box is visible' },
    { type: 'priority', description: 'p1' }
  );
  ...
});
```

These annotations appear in the Playwright HTML report and feed the
coverage matrix. Every test also carries a `@priority-p0/p1/p2` tag
matching its scenario priority.

Runs `npx tsc --noEmit` to verify TypeScript compiles cleanly.

---

## Step 4 — Cross-Review (Reviewer)

**Agent:** reviewer (model `opencode/big-pickle`)

**Hard rule:** the reviewer model **must differ** from the generator model.

- Reviews every generated file against `coding-standards` skill.
- Outputs **PASS or FAIL per file** with line-level issues.
- Pipeline **stops here** until all files PASS. No generated code reaches you without passing this gate.

---

## Step 5 — You Run the Tests

```bash
npx playwright test
```

- Runs against the environment in `TEST_ENV` (`dev` or `staging` from `.env.*`).
- Results saved to `test-results/results.json` (JSON reporter).
- Screenshots + traces for failures stored in `test-results/`.

---

## Step 6 — Coverage Reconciliation

```bash
/generate-coverage-matrix
```

**Agent:** `coverage-analyst` (model `opencode/big-pickle`)

Runs `scripts/build-coverage-matrix.mjs` which:

1. Reads `test-results/results.json`.
2. Updates each scenario in `coverage-matrix.json` to `passed` / `failed` / `skipped` / `escalated`.
3. Recomputes summary counters from scratch.
4. Prints a **gap report** (e.g. "Story KAN-102 missing negative test for AC-3").

Then runs `scripts/build-rtm.mjs` to generate `rtm.md` — a human-readable
Requirements Traceability Matrix (Story | AC | AC Text | Scenario |
Category | Priority | Tags | Spec | Test | Status).

---

## Step 7 — Healing Failures

If tests failed:

```bash
/heal-failed-run
```

**Agent:** `healer` (model `opencode/mimo-v2.5-free`)

Follows `healing-policy` decision tree per failure:

| Failure type | Action |
|--------------|--------|
| Locator missing / ambiguous | Auto-fix in page object, re-run |
| Timeout (slow load) | Auto-fix (increase wait in page object) |
| Copy mismatch (text changed) | **Escalate** — semantic change, needs QA |
| Route change (URL moved) | **Escalate** — semantic change, needs QA |
| Flaky / assertion logic / API error / auth / unknown | **Escalate** → create Bug in Jira (e.g. `KAN-304`) |

The Healer **never edits spec files** — auto-fixes are locator/timeout
changes in `pages/*.page.ts` only. Every escalation bug is **linked to its
Story and Epic** (`jira_link_issues`) and the **trace + screenshot are
attached** (`jira_update_issue` with `attachments`).

Every Jira escalation bug is written in **human-readable plain language**
(what the user did, expected vs actual, steps to reproduce, impact) — raw
Playwright errors and stack traces are never pasted into the description;
they travel as attached evidence files (trace.zip + screenshot).

Every action appends to `agent-decision-log.json` and updates `coverage-matrix.json`.

---

## Step 8 — Jira Write-Back (CI / optional)

After a run, `jira-write-back` (model `opencode/ling-3.0-flash-free`) posts:

- A comment on each **Story** with pass/fail summary + report link.
- A roll-up comment on the parent **Epic**.

---

## Step 9 — Artifacts You Get

Each release folder is a complete, auditable record:

```
artifacts/release-v1.2-01/
├── agent-decision-log.json    # every AI decision + rationale
├── coverage-matrix.json       # scenario-by-scenario status + category + priority
├── grooming-queue.json        # open grooming questions (if any)
├── rtm.md                     # Requirements Traceability Matrix (human-readable)
├── test-plan-KAN-45-v1.2.md   # epic aggregate plan
└── stories/
    ├── test-plan-KAN-101-v1.2.md
    └── test-plan-KAN-102-v1.2.md
```

---

## Summary (One Line)

> Jira scope → plans → generated tests → human-reviewed → run → coverage reported → failures auto-healed or escalated to Jira — all traceable to Epic/Story and recorded per release.

---

## Quick Command Reference

| Goal | Command |
|------|---------|
| Full pipeline (scope + plan + generate + review) | `/plan-release KAN-45` |
| Create plan from any source (manual) | `/create-testplan KAN-101` |
| Generate specs from an existing plan | `/generate-specs-from-plan <plan-path>` |
| Update plan when requirements change | `/update-requirement old.md new.md <plan-path>` |
| Check grooming answers + re-plan blocked stories | `/recheck-grooming [release-folder]` |
| Fix failing tests | `/heal-failed-run [spec.ts \| last]` |
| Reconcile coverage after a run | `/generate-coverage-matrix [release-folder]` |
| Run tests | `npx playwright test` |

---

## Key Principles

1. **Release-driven** — every Epic/Story scope gets a versioned `artifacts/release-<v>-<NN>/` folder.
2. **Traceability** — every spec carries `STORY (Epic: EPIC)` in its `test.describe` and AC/story/epic/priority annotations per test.
3. **5-category coverage** — positive, negative, edge, non-functional, performance (mandatory minimums + `na` with rationale).
4. **Grooming gate** — no-AC stories are blocked with a linked Question bug, never silently planned or dropped.
5. **No duplicate model** — generator (`north-mini-code-free`) ≠ reviewer (`big-pickle`).
6. **Append-only audit** — `agent-decision-log.json` and `coverage-matrix.json` are never rewritten, only appended/recomputed.
7. **Gitignored** — `artifacts/`, `.env*`, `.opencode/node_modules/`, `.opencode/package*.json` are not committed.