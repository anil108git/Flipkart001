---
description: >
  Creates structured test plans from ANY requirement source — Jira issue
  key, Epic key, JQL filter, local Markdown file, or URL. Follows
  requirements-only-planning, jira-to-test-plan, test-categorization, and
  coding-standards skills. Invoke with /create-testplan and provide the
  source when prompted.
agent: planner
model: opencode/nemotron-3-ultra-free
---

# Create Test Plan from Requirement Source

You are acting as the **Planner agent**. Your only job is to read a
requirement from ANY source and produce a structured test plan file.
You are NOT generating any spec code — that happens
separately via `/generate-specs-from-plan`.

Follow every phase in order. Do not skip phases. Do not proceed to the
next phase without completing the current one.

---

## Input

**Requirement source:** $ARGUMENTS

If $ARGUMENTS was not provided, ask:
> "Please provide the requirement source:
> - Jira issue key (e.g. `KAN-101`) or Epic key (e.g. `KAN-45`)
> - Local file path (e.g. `requirements/flipkart-foryou-tab.md`)
> - URL (e.g. `https://kanilme.atlassian.net/browse/KAN-101`)"

---

## Phase 0 — Detect Source Type

Auto-detect the input type:

| Pattern | Source Type | Action |
|---------|-------------|--------|
| Matches `<KEY>-<NUM>` e.g. `KAN-101` | Jira issue key | Go to Phase 1A |
| Ends with `.md` or `.markdown` | Local Markdown file | Go to Phase 1B |
| Starts with `http://` or `https://` | URL | Go to Phase 1C |
| Anything else | Unknown | Ask user to clarify |

Display detection:
```
Detected source type: [Jira issue key | Local file | URL]
Source: $ARGUMENTS
```

---

## Phase 1A — Fetch from Jira

Using the `jira-to-test-plan` and `epic-story-traceability` skills and
Jira MCP:

1. Resolve **$ARGUMENTS** to a Story (and its parent Epic) via Jira MCP
   (`jira_get_issue`, `jira_search`).
2. Extract and display:
   - Issue summary (title)
   - Story key + parent Epic key
   - Description / user story
   - All acceptance criteria lines — numbered exactly as they appear
   - Priority (High / Medium / Low)
   - Labels (if any)
   - Linked subtasks or child issues (if any)
   - fixVersions (release version)
3. Confirm with the user:
   > "Fetched **$ARGUMENTS: [summary]** (Story, Epic: [KEY]).
   > Found [N] acceptance criteria lines.
   > Shall I proceed with generating the test plan? Reply 'yes' or correct me."

**Do not proceed to Phase 2 without confirmation.**

---

## Phase 1B — Read Local Markdown File

1. Read the file at **$ARGUMENTS** from the filesystem.
2. If the file does not exist, stop and tell the user:
   > "File not found at `$ARGUMENTS`. Please check the path and try again."
3. Parse the file and extract the following sections.
   Use flexible matching — requirement files vary in structure:

   | What to find | Common headings to look for |
   |---|---|
   | Feature name | `# Title`, `## Feature`, first H1 heading |
   | User story | `## Story`, `## Overview`, `As a...` paragraph |
   | Acceptance criteria | `## AC`, `## Acceptance Criteria`, `## Done when`, numbered/bulleted list, table rows |
   | Out of scope | `## Out of scope`, `## Exclusions` |
   | Notes / assumptions | `## Notes`, `## Assumptions`, `## Open questions` |
   | Priority | `Priority:`, `**Priority**` inline label |
   | Selectors (optional) | `## Appendix`, `## Selectors`, `## Element Reference` |

4. Display what was extracted to the user:
   ```
   Parsed: [Feature name]
   Story: [first line of user story]
   AC lines found: [N]
   Out of scope items: [N]
   Notes/assumptions: [N]
   Priority: [High / Medium / Low / Not specified]
   Selectors found: [Yes/No]
   ```
5. Ask the user to confirm:
   > "I've parsed `$ARGUMENTS` and found [N] acceptance criteria lines.
   > Does this look correct? Reply 'yes' to proceed or tell me what I missed."

**Do not proceed to Phase 2 without confirmation.**

---

## Phase 1C — Fetch from URL

1. Fetch the content at **$ARGUMENTS** using the playwright-mcp or web fetch tool.
2. If the URL is inaccessible, stop and tell the user:
   > "Could not access `$ARGUMENTS`. Please check the URL or provide the content directly."
3. Parse the fetched content the same way as Phase 1B (extract ACs, story, etc.)
4. Confirm with the user.

---

## Phase 2 — Check Existing Coverage (Jira only)

**Skip this phase for local files and URLs.**

If source is a Jira issue:

1. Ask Jira MCP: fetch **$ARGUMENTS** with comments and check for linked
   subtasks/child issues that describe test scenarios.
2. If existing scenarios are found:
   - Use them as the baseline scenario list.
   - Mark each as `SOURCE: Jira issue [KEY]`.
   - Only write NEW scenarios for AC lines not already covered.
   - Inform the user: "Found [N] existing scenarios — reusing as baseline,
     writing [N] new scenarios for uncovered AC lines."
3. If none exist:
   - Inform the user: "No existing scenarios found — writing all scenarios
     fresh from AC lines."

For local files and URLs:
- No existing test cases to check — write all scenarios fresh.

---

## Phase 3 — Identify Gaps Before Writing

Before writing any scenario, scan every AC line for missing information.
Flag anything that would force a guess during test plan writing:

Common gaps to check:
- AC line describes an outcome but not the trigger (e.g. "error is shown" — shown when?)
- AC mentions a field or element without naming it (e.g. "the required field")
- AC references another system or API without specifying expected behavior
- AC is ambiguous about positive vs negative path (e.g. "user can submit" — what if they can't?)
- Priority is missing — default to Medium if not specified

List all gaps to the user:
> "Before writing, I found [N] gaps in the requirement:
> 1. AC-3: Does not specify what triggers the error state
> 2. AC-5: 'Required field' — which fields are required?
> Do you want to clarify these now, or shall I tag them as
> OPEN QUESTION / TBD in the plan and proceed?"

Wait for user reply before proceeding.

---

## Phase 4 — Check Feature Availability

Ask the user:
> "Is the feature described in this requirement available in a dev or staging
> environment right now? Reply 'yes — [env URL]' or 'no'."

- **If yes** → set plan `Status: DRAFT — pending live Planner verification`
  and note: `Live app available at [URL] — run /generate-specs-from-plan
  to generate page objects and spec code.`
- **If no** → set plan `Status: DRAFT — requirements-only, feature not yet built`
  and apply full shift-left rules from `requirements-only-planning` skill.

---

## Phase 5 — Write Test Plan Scenarios

Using the [requirements-only-planning](.opencode/skills/requirements-only-planning/SKILL.md) skill and (if Jira source) [jira-to-test-plan](.opencode/skills/jira-to-test-plan/SKILL.md) skill:

### Rules (from skills)
- One or more scenarios per AC line, Given/When/Then format, no selectors
- Mandatory coverage: 5 categories — Positive, Negative, Edge Case,
  Non-Functional, and Performance (minimum rule + `na`-with-rationale per
  [test-categorization](.opencode/skills/test-categorization/SKILL.md))
- Classify by Category, Subtype, and Complexity per [coding-standards](.opencode/skills/coding-standards/SKILL.md#test-categorization)
- Tag gaps as TBD, ASSUMPTION, SUGGESTED, or OPEN QUESTION
- For Jira sources, post OPEN QUESTION comments via Jira MCP
- For local files/URLs, add a `## Notes` section summarising gaps

---

## Phase 6 — Save Plan to Release Folder

1. Determine the release folder. For a Jira source, scaffold it if needed:
   ```
   node scripts/init-release.mjs <version> <EPIC_KEY>
   ```
   (see the `release-artifacts` skill). For a local file/URL with no Jira
   keys, use the last scaffolded folder or prompt the user.
2. Save one plan per story to:
   `artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md`
   and (for epic scope) the aggregate to:
   `artifacts/release-<version>-<NN>/test-plan-<EPIC>-<version>.md`

3. Save with this exact header:

```markdown
# Test Plan: [Feature Name]
Story: [STORY-ID]
Epic: [EPIC-ID]
Release: [version]
Source: $ARGUMENTS ([source type])
Status: DRAFT — requirements-only, feature not yet built
       | DRAFT — pending live Planner verification (delete one)
Created: YYYY-MM-DD
Grounding: [Source description] | Live app available at [URL] (delete one)
Categories: positive [n] | negative [n] | edge [n] | non-functional [n] | performance [n]
NA rationale: [excluded categories + why]
Spec file (to be generated): tests/[feature-name].spec.ts
Next step: QA/BA review → /generate-specs-from-plan artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md for spec generation

---
```

4. Append the story's scenario rows to `coverage-matrix.json` with
   `status: "planned"` (see `release-artifacts` skill).

5. Confirm to the user:
   > "Test plan saved to `artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md`.
   > Summary:
   > - [N] scenarios written
   > - [N] TBD items (resolve during live verification)
   > - [N] ASSUMPTION items (need BA/Dev confirmation)
   > - [N] OPEN QUESTION items (need clarification)
   > - [N] SUGGESTED items (need QA lead approval)
   >
   > Categorization:
   > - Positive: [N] | Negative: [N] | Edge Case: [N]
   > - Non-Functional: [N] | Performance: [N]
   > - Simple: [N] | Medium: [N] | Complex: [N]
   >
   > Next: review the plan, resolve open items, then run
   > `/generate-specs-from-plan` with the plan path to generate
   > page objects and spec files."

---

## Phase 7 — Validate Coverage Completeness

Before finalizing the plan, validate that all required coverage exists:

### Coverage checklist
```
✓ Positive scenarios exist for every AC line
✓ Negative scenarios exist for every input/action
✓ Edge cases exist for every input field (empty, boundary, special chars)
✓ Non-Functional scenarios exist or are 'na' with rationale
✓ Performance scenarios exist or are 'na' with rationale
✓ Complexity distribution is reasonable (not all simple, not all complex)
```

### If coverage is incomplete
If any mandatory category has 0 scenarios and no `na` rationale, ask:
> "The plan has [N] positive but 0 negative scenarios for [section].
> Should I add negative test cases? Reply 'yes' or 'skip'."

### Display final coverage summary
```
Coverage Summary:
┌─────────────────┬───────┬─────────────────────────────┐
│ Category        │ Count │ Percentage                  │
├─────────────────┼───────┼─────────────────────────────┤
│ Positive        │ [N]   │ [N]% of total               │
│ Negative        │ [N]   │ [N]% of total               │
│ Edge Case       │ [N]   │ [N]% of total               │
│ Non-Functional  │ [N]   │ [N]% of total               │
│ Performance     │ [N]   │ [N]% of total               │
├─────────────────┼───────┼─────────────────────────────┤
│ Simple          │ [N]   │ Quick to execute             │
│ Medium          │ [N]   │ Standard flow tests          │
│ Complex         │ [N]   │ End-to-end validation        │
└─────────────────┴───────┴─────────────────────────────┘
Total scenarios: [N]
```
If a category is `na`, show it as `na (reason)` instead of a count.

---

## Phase 8 — Sync to Jira (Jira source only, optional)

**Skip this phase for local files and URLs.**

If the user replies 'yes' to syncing:

Add a comment to the Jira issue linking the plan for review:
```
jira_add_comment: issue_key="$ARGUMENTS",
  body="Test plan created — see artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md. Review before generating specs."
```

---

## Hard Rules

- Never produce a spec file (`.spec.ts`) — this prompt generates plans only.
- Never mark Status as READY — only a live Planner pass can do that.
- Never invent or skip scenarios — every AC line must be addressed.
- Never guess missing detail — tag as TBD, ASSUMPTION, or OPEN QUESTION.
- Always include the 5 categories — positive, negative, edge case,
  non-functional, performance — no exceptions (`na` requires a rationale).
- Always classify each scenario by Category, Subtype, and Complexity.
- Always display coverage summary before saving.
