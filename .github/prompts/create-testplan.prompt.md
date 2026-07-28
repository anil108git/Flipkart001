---
name: create-testplan
description: >
  Creates a structured test plan in specs/ from ANY requirement source.
  Auto-detects input type: Bugasura REQ-ID, local Markdown file, or URL.
  Follows requirements-only-planning, bugasura-to-test-plan, and
  coding-standards skills. Invoke with /create-testplan and provide
  the source when prompted.
mode: agent
tools:
  - bugasura
  - filesystem
  - playwright-mcp
---

# Create Test Plan from Requirement Source

You are acting as the **Planner agent**. Your only job is to read a
requirement from ANY source and produce a structured test plan file
in `specs/`. You are NOT generating any spec code — that happens
separately via `/generate-specs-from-plan`.

Follow every phase in order. Do not skip phases. Do not proceed to the
next phase without completing the current one.

---

## Input

**Requirement source:** {{SOURCE}}

If SOURCE was not provided, ask:
> "Please provide the requirement source:
> - Bugasura REQ-ID (e.g. `REQ-42`)
> - Local file path (e.g. `requirements/flipkart-foryou-tab.md`)
> - URL (e.g. `https://jira.example.com/browse/PROJ-123`)"

---

## Phase 0 — Detect Source Type

Auto-detect the input type:

| Pattern | Source Type | Action |
|---------|-------------|--------|
| Starts with `REQ-` or `req-` | Bugasura REQ-ID | Go to Phase 1A |
| Ends with `.md` or `.markdown` | Local Markdown file | Go to Phase 1B |
| Starts with `http://` or `https://` | URL | Go to Phase 1C |
| Anything else | Unknown | Ask user to clarify |

Display detection:
```
Detected source type: [Bugasura REQ-ID | Local file | URL]
Source: {{SOURCE}}
```

---

## Phase 1A — Fetch from Bugasura

Using the `bugasura-to-test-plan` skill and Bugasura MCP:

1. Fetch the requirement for **{{SOURCE}}** via Bugasura MCP.
2. Extract and display:
   - Requirement title
   - Description / user story
   - All acceptance criteria lines — numbered exactly as they appear
   - Priority (High / Medium / Low)
   - Linked existing test cases in Bugasura (if any)
   - Linked bugs or known issues (if any)
3. Confirm with the user:
   > "Fetched **{{SOURCE}}: [title]**.
   > Found [N] acceptance criteria lines and [N] existing linked test cases.
   > Shall I proceed with generating the test plan? Reply 'yes' or correct me."

**Do not proceed to Phase 2 without confirmation.**

---

## Phase 1B — Read Local Markdown File

1. Read the file at **{{SOURCE}}** from the filesystem.
2. If the file does not exist, stop and tell the user:
   > "File not found at `{{SOURCE}}`. Please check the path and try again."
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
   > "I've parsed `{{SOURCE}}` and found [N] acceptance criteria lines.
   > Does this look correct? Reply 'yes' to proceed or tell me what I missed."

**Do not proceed to Phase 2 without confirmation.**

---

## Phase 1C — Fetch from URL

1. Fetch the content at **{{SOURCE}}** using the playwright-mcp or web fetch tool.
2. If the URL is inaccessible, stop and tell the user:
   > "Could not access `{{SOURCE}}`. Please check the URL or provide the content directly."
3. Parse the fetched content the same way as Phase 1B (extract ACs, story, etc.)
4. Confirm with the user.

---

## Phase 2 — Check Existing Test Cases (Bugasura only)

**Skip this phase for local files and URLs.**

If source is Bugasura:

1. Ask Bugasura MCP: list all test cases linked to **{{SOURCE}}**.
2. If existing test cases are found:
   - Use them as the baseline scenario list.
   - Mark each as `SOURCE: Bugasura test case [ID]`.
   - Only write NEW scenarios for AC lines not already covered.
   - Inform the user: "Found [N] existing test cases — reusing as baseline,
     writing [N] new scenarios for uncovered AC lines."
3. If no test cases exist:
   - Inform the user: "No existing test cases found — writing all scenarios
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

Using `requirements-only-planning` and (if Bugasura source) `bugasura-to-test-plan` skills:

### Rules
- One or more scenarios per AC line — never combine unrelated AC lines.
- Use Given/When/Then format — behavior terms only, no selectors or UI detail.
- Tag every gap using the standard tags below — never guess missing detail.
- Every scenario must cite its AC source line.
- Out-of-scope items → add a clearly labelled `## Out of Scope` section.
- For every happy-path scenario, check for a corresponding negative/error path.
  If implied but not stated, write as `SUGGESTED`.
- **Mandatory coverage**: Every feature MUST have positive, negative, and edge case scenarios.

### Test Case Types (Mandatory Coverage)

Every test plan MUST include all three types:

| Type | Description | Example |
|------|-------------|---------|
| **Positive** | Happy path — valid input, expected behavior | User logs in with correct credentials |
| **Negative** | Error paths — invalid input, error handling | User logs in with wrong password |
| **Edge Cases** | Boundary conditions, unusual inputs | Empty fields, max length, special characters |

**Coverage rules:**
- For every positive scenario, ask: "What happens if this fails?"
- For every input field, include: valid, invalid, empty, boundary cases
- For every action, include: success, failure, and timeout scenarios
- If a negative/edge case is not in the AC, mark as `SUGGESTED`

### Complexity Levels

Each scenario should be classified by complexity:

| Complexity | Description | Examples |
|------------|-------------|----------|
| **Simple** | Single action, single assertion | Click button, verify element visible |
| **Medium** | Multi-step flow, multiple assertions | Fill form, submit, verify result |
| **Complex** | Multi-page flow, conditional logic, API + UI | Login → add to cart → checkout → verify order |

### Scenario template
```
## Scenario [N]: [Short descriptive name]
Source: [AC-ID] from [source reference]
Priority: High | Medium | Low
Type: Positive | Negative | Edge Case
Complexity: Simple | Medium | Complex

Given: [Precondition]
When:  [User action — no selectors]
Then:  [Expected observable outcome]
TBD:   [Missing implementation detail — if any]
ASSUMPTION: [What was inferred — if any]
```

### Gap tags
| Tag | When to use |
|-----|-------------|
| `TBD` | Implementation detail unknown — resolve during live verification |
| `ASSUMPTION` | Inferred from context — must be confirmed |
| `SUGGESTED` | Extra coverage beyond AC — needs team approval |
| `OPEN QUESTION` | Ambiguity in the AC itself — needs clarification |

### For Bugasura sources with OPEN QUESTION items
Post a clarification comment on **{{SOURCE}}** in Bugasura via MCP:
```
"Add comment to Bugasura requirement {{SOURCE}}:
OPEN QUESTION from QA: [your question here]"
```

### For local file/URL sources with OPEN QUESTION items
Add a `## Notes` section at the end of the plan summarising:
- All ASSUMPTION items (for BA/Dev review)
- All OPEN QUESTION items (for requirement author to answer)
- All SUGGESTED items (for QA lead to approve or reject)

---

## Phase 6 — Save Plan to specs/

1. Derive the file name from the feature name:
   `specs/[kebab-case-feature-name].md`
   e.g. "User Login Feature" → `specs/user-login-feature.md`

2. If a file with that name already exists in `specs/`, ask:
   > "`specs/[name].md` already exists. Overwrite, create a new version
   > (`specs/[name]-v2.md`), or cancel?"

3. Save with this exact header:

```markdown
# Test Plan: [Feature Name]
Source: {{SOURCE}} ([source type])
Status: DRAFT — requirements-only, feature not yet built
       | DRAFT — pending live Planner verification (delete one)
Created: YYYY-MM-DD
Grounding: [Source description] | Live app available at [URL] (delete one)
Spec file (to be generated): tests/[feature-name].spec.ts
Next step: QA/BA review → /generate-specs-from-plan specs/[file-name].md for spec generation

---
```

4. Confirm to the user:
   > "Test plan saved to `specs/[file-name].md`.
   > Summary:
   > - [N] scenarios written
   > - [N] TBD items (resolve during live verification)
   > - [N] ASSUMPTION items (need BA/Dev confirmation)
   > - [N] OPEN QUESTION items (need clarification)
   > - [N] SUGGESTED items (need QA lead approval)
   >
   > Categorization:
   > - Positive: [N] | Negative: [N] | Edge Case: [N]
   > - Simple: [N] | Medium: [N] | Complex: [N]
   >
   > Next: review the plan, resolve open items, then run
   > `/generate-specs-from-plan specs/[file-name].md` to generate
   > page objects and spec files."

---

## Phase 7 — Validate Coverage Completeness

Before finalizing the plan, validate that all required coverage exists:

### Coverage checklist
```
✓ Positive scenarios exist for every AC line
✓ Negative scenarios exist for every input/action
✓ Edge cases exist for every input field (empty, boundary, special chars)
✓ Complexity distribution is reasonable (not all simple, not all complex)
```

### If coverage is incomplete
If any category has 0 scenarios, ask:
> "The plan has [N] positive but 0 negative scenarios for [section].
> Should I add negative test cases? Reply 'yes' or 'skip'."

### Display final coverage summary
```
Coverage Summary:
┌─────────────────┬───────┬─────────────────────────────┐
│ Type            │ Count │ Percentage                  │
├─────────────────┼───────┼─────────────────────────────┤
│ Positive        │ [N]   │ [N]% of total               │
│ Negative        │ [N]   │ [N]% of total               │
│ Edge Case       │ [N]   │ [N]% of total               │
├─────────────────┼───────┼─────────────────────────────┤
│ Simple          │ [N]   │ Quick to execute             │
│ Medium          │ [N]   │ Standard flow tests          │
│ Complex         │ [N]   │ End-to-end validation        │
└─────────────────┴───────┴─────────────────────────────┘
Total scenarios: [N]
```

---

## Phase 8 — Sync to Bugasura (Bugasura source only, optional)

**Skip this phase for local files and URLs.**

If the user replies 'yes' to syncing:

For each new scenario (not sourced from an existing Bugasura test case),
create a linked test case in Bugasura under **{{SOURCE}}**:

```
"Create test case in Bugasura under requirement {{SOURCE}}:
- Title: [scenario name]
- Preconditions: [Given clause]
- Steps: [When clause]
- Expected result: [Then clause]
- Status: Draft"
```

---

## Hard Rules

- Never produce a spec file (`.spec.ts`) — this prompt generates plans only.
- Never mark Status as READY — only a live Planner pass can do that.
- Never invent scenarios not traceable to an AC line.
- Never silently skip an AC line — every line produces at least one scenario or an explicit note.
- Never guess missing detail — always tag as TBD, ASSUMPTION, or OPEN QUESTION.
- Always save to `specs/` — never to the same folder as the requirement file.
- Always include the `Next step` line in the plan header.
- Always detect source type before processing — never assume.
- **Always include positive, negative, and edge case scenarios** — no exceptions.
- **Always classify each scenario by Type and Complexity** — never leave blank.
- **Always display coverage summary** before saving the plan.
