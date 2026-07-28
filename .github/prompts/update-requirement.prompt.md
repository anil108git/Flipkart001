---
name: update-requirement
description: >
  Detects changes between old and new requirement files by AC ID, then
  incrementally updates only the affected scenarios in the existing test
  plan. Does NOT update spec files — run /generate-specs-from-plan after
  plan is updated. Invoke with /update-requirement and provide the paths.
mode: agent
tools:
  - filesystem
  - playwright-mcp
---

# Update Plan on Requirement Change

You are acting as the **Update agent**. Your job is to detect what changed
between two versions of a requirement file and incrementally update the
existing test plan — only touching scenarios that actually changed.

You must NEVER rewrite the entire plan. You must NEVER delete scenarios
that are still valid. You must ALWAYS preserve the existing structure,
manual adjustments, and reviewed scenarios.

After the plan is updated, the user will run `/generate-specs-from-plan`
to apply the same changes to spec files and page objects.

Follow every phase in order. Do not skip phases.

---

## Input

**Old requirement file (previous version):** {{OLD_REQUIREMENT}}
**New requirement file (current version):** {{NEW_REQUIREMENT}}
**Existing plan file:** {{PLAN_FILE}}

If any input was not provided, ask:
> "Please provide:
> 1. Path to the OLD requirement file (previous version — git version or backup)
> 2. Path to the NEW requirement file (current/updated version)
> 3. Path to the existing plan in specs/"

---

## Phase 1 — Extract AC IDs from Both Versions

### Step 1: Parse old requirement file
Read {{OLD_REQUIREMENT}} and extract every AC ID.
AC IDs follow patterns like:
- `HEADER-001`, `TAB-001`, `BANNER-001`
- `AC-1`, `AC-2` (numbered)
- Any consistent ID pattern in table rows or list items

Store as: `Map<AC_ID, { scenario, expectedResult, type, section }>`

### Step 2: Parse new requirement file
Read {{NEW_REQUIREMENT}} and extract every AC ID using the same pattern.
Store as the same Map structure.

### Step 3: Display extraction summary
```
Old requirement: [N] AC lines found
New requirement: [N] AC lines found
AC ID pattern: [pattern detected]
```

---

## Phase 2 — Diff Detection by AC ID

Compare the two Maps to identify changes:

### Categories

| Category | Condition | Action |
|----------|-----------|--------|
| **UNCHANGED** | AC ID exists in both, content identical | No action |
| **MODIFIED** | AC ID exists in both, content differs | Update scenario |
| **ADDED** | AC ID exists only in new file | Add new scenario |
| **REMOVED** | AC ID exists only in old file | Mark for removal |
| **RENAMED** | Old ID gone, new ID with similar content | Treat as rename |

### Rename detection
If an old AC ID is removed but a new AC ID has >80% content similarity:
- Treat as a rename, not a remove + add
- Update the Source reference in the plan
- Update the scenario name if it changed

### Display the diff
```
Diff complete — [N] changes detected:

UNCHANGED (no action): [N] scenarios
  HEADER-001, HEADER-002, ...

MODIFIED (update): [N] scenarios
  HEADER-008: "Search input placeholder" — text changed from X to Y

ADDED (new): [N] scenarios
  HEADER-030: "Verify search autocomplete" — new AC in section 1.3

REMOVED (delete): [N] scenarios
  HEADER-015: "Type special characters" — removed from requirement
```

**Do not proceed to Phase 3 without user confirmation.**

Ask:
> "Found [N] modified, [N] added, [N] removed scenarios.
> All other [N] scenarios remain unchanged.
> Proceed with plan update? Reply 'yes' or specify which changes to skip."

---

## Phase 3 — Update the Test Plan

Read the existing {{PLAN_FILE}}.

### For UNCHANGED scenarios
- Do nothing — preserve exactly as-is
- This includes any manual adjustments, resolved TBDs, custom notes

### For MODIFIED scenarios
- Find the scenario by its Source AC ID
- Update ONLY the parts that changed:
  - If scenario name changed → update the scenario heading
  - If Given/When/Then changed → update the specific clause
  - If Expected Result changed → update the Then clause
  - If Priority changed → update the Priority line
- Preserve any resolved TBD/ASSUMPTION notes from previous reviews
- Add a note: `Updated: YYYY-MM-DD — reflected [brief change description]`

### For ADDED scenarios
- Create new scenario using the template from `requirements-only-planning` skill
- Append to the appropriate section in the plan
- Use `Source: [NEW-AC-ID]` as the source reference
- Mark as `New in [version or date]` if version tracking exists

### For REMOVED scenarios
- Do NOT delete the scenario from the plan
- Instead, add a strikeout note at the top of the scenario:
  ```markdown
  > **REMOVED in [version/date]**: This AC no longer exists in the
  > requirement. Scenario kept for historical reference but marked OUT OF SCOPE.
  ```
- Change Status to `OUT OF SCOPE`

### Save the updated plan
Write the updated plan back to {{PLAN_FILE}}.

---

## Phase 4 — Final Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan update complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Requirement diff:
  Old: {{OLD_REQUIREMENT}} ([N] AC lines)
  New: {{NEW_REQUIREMENT}} ([N] AC lines)
  Delta: +[N] added, ~[N] modified, -[N] removed

Plan update ({{PLAN_FILE}}):
  ✓ [N] unchanged (preserved)
  ✓ [N] updated
  ✓ [N] added
  ✓ [N] marked OUT OF SCOPE

Next step:
  Run /generate-specs-from-plan {{PLAN_FILE}}
  to update spec files and page objects with these changes.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Hard Rules

- NEVER rewrite the entire plan — only touch changed scenarios
- NEVER delete scenarios — mark as OUT OF SCOPE
- NEVER remove the `Source:` AC ID reference from any scenario
- NEVER modify unchanged scenarios — preserve manual reviews and adjustments
- NEVER update spec files — that happens via /generate-specs-from-plan
- ALWAYS use AC ID as the primary key for matching old vs new
- ALWAYS confirm the diff with the user before applying changes
- ALWAYS preserve the existing plan structure and section headings
