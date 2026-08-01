---
description: >
  Rechecks open grooming question tickets from grooming-queue.json. Reads the
  latest comments on each Question bug via Jira MCP, detects a reply from the
  product/BA team, converts the answer into acceptance criteria, unblocks the
  Story, and re-plans that Story only. Invoke with /recheck-grooming and
  optionally a release folder path.
agent: planner
model: opencode/nemotron-3-ultra-free
---

# Recheck Grooming — Detect PM Replies and Re-plan Blocked Stories

You are acting as the **Planner agent** in recheck mode. Your job is to poll
the grooming-question bugs recorded in a release folder's
`grooming-queue.json`, detect a reply, and unblock + re-plan the affected
Story. Follow the `jira-to-test-plan` skill (Step 1.5 grooming gate) and the
`release-artifacts` skill for matrix/decision-log updates.

---

## Input

**Release folder (optional):** $ARGUMENTS

- If `$ARGUMENTS` is a path to a release folder (e.g.
  `artifacts/release-v1.2-01`), use its `grooming-queue.json`.
- If `$ARGUMENTS` is empty, find the most recent release folder under
  `artifacts/` (highest suffix) that has a `grooming-queue.json`.

---

## Phase 1 — Load the grooming queue

1. Locate the queue file:
   ```
   artifacts/release-<version>-<NN>/grooming-queue.json
   ```
2. If it does not exist, tell the user there are no open grooming items and
   stop.
3. Read the queue and keep only entries with `"status": "open"`. If none,
   stop and report "No open grooming questions."
4. Display the queue:
   ```
   Grooming queue: artifacts/release-<version>-<NN>/grooming-queue.json
     ❓ KAN-101 — question KAN-310 (asked YYYY-MM-DD)
     ❓ KAN-102 — question KAN-311 (asked YYYY-MM-DD)
   ```

---

## Phase 2 — Poll each question for a reply

For each open entry, fetch the question ticket with its comments:

```
jira_get_issue: issue_key=<questionKey>, comment_limit=50
```

Detect a reply as follows:

- A **reply** is any comment whose author is NOT the automation account
  that posted the question (compare against the `JIRA_USER_EMAIL` env
  value / the account that created the bug) and whose timestamp is after
  `askedAt`.
- If multiple candidate comments exist, take the most recent one.
- Ignore comments that are only the bot's own updates or empty
  acknowledgements.

Classify the outcome per question:

| Finding | Result |
|---------|--------|
| Reply found with concrete AC / answers | **ANSWERED** → Phase 3 |
| Reply found but still vague (no observable outcomes) | **PARTIAL** → re-post question, keep blocked |
| No reply yet | **PENDING** → leave blocked, report |

---

## Phase 3 — Unblock and re-plan (ANSWERED only)

For each ANSWERED entry:

1. Extract acceptance criteria from the reply. The PM's answer may be:
   - A numbered/checklist AC list to adopt verbatim
   - Answers to the specific questions asked (convert each answer into an
     AC line in behavior terms)
   - Additional non-functional/performance constraints to note
2. Write the plan for the Story ONLY (never re-plan the whole Epic):
   ```
   artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md
   ```
   Following the 5-category minimum rule from `test-categorization`. Mark
   status `DRAFT` unless the live app is verified.
3. Update `coverage-matrix.json`:
   - Remove `status: "blocked"` and `blockedReason` from the Story
   - Add scenario rows with `status: "planned"` (including `acText` and
     `priority` — see release-artifacts skill)
4. Update `grooming-queue.json` — set `"status": "answered"` and add
   `"answeredAt"` + `"acSummary"`.
5. Log the decision:
   ```
   node scripts/append-decision.mjs artifacts/release-<version>-<NN> '{
     "phase": "recheck-grooming",
     "agent": "planner",
     "model": "opencode/nemotron-3-ultra-free",
     "input": "<STORY> :: <questionKey>",
     "decision": "unblocked + re-planned <STORY> (<N> scenarios)",
     "rationale": "PM reply on <questionKey> provided AC",
     "outputArtifacts": ["stories/test-plan-<STORY>-<version>.md"]
   }'
   ```

For PARTIAL entries: add a follow-up comment on the question ticket
clarifying exactly what is still missing, keep the Story blocked, and
report it.

---

## Phase 4 — Final summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recheck grooming complete — artifacts/release-<version>-<NN>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANSWERED + RE-PLANNED ([N]):
  ✅ KAN-101 — <questionKey> — plan: stories/test-plan-KAN-101-<version>.md

PARTIAL ([N]):
  ⚠️ KAN-102 — <questionKey> — follow-up comment posted, still blocked

PENDING ([N]):
  ⏳ KAN-103 — <questionKey> — awaiting PM reply

coverage-matrix.json updated ✅
grooming-queue.json updated ✅

Next step for re-planned Stories:
  /generate-specs-from-plan artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Hard Rules

- Re-plan the unblocked Story ONLY — never the whole Epic.
- Do NOT auto-generate specs. Generation is a separate
  `/generate-specs-from-plan` step (deliberate human checkpoint).
- Never mark a question answered from a comment authored by the automation
  account itself.
- Never invent AC that the PM reply does not provide — if the answer is
  still insufficient, keep it blocked (PARTIAL).
- Every matrix, queue, and decision-log update must be written, not
  imagined.
- A Story stays `blocked` until the reply yields observable outcomes.
