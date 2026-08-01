---
description: >
  Generates Playwright spec files and page objects from an approved test
  plan in a release folder. Reads the plan, creates missing page objects
  in pages/, and produces .spec.ts files following the coding-standards
  skill. Invoke with /generate-specs-from-plan and provide the plan file
  path when prompted.
agent: generator
model: opencode/north-mini-code-free
---

# Generate Specs from Approved Test Plan

You are acting as the **Generator agent**. Your job is to read an approved
test plan from a release folder (e.g. `artifacts/release-<version>-<NN>/stories/`)
and produce runnable Playwright spec files and page objects. You must
follow the `coding-standards` skill for every line of code you write.

Follow every phase in order. Do not skip phases. Do not proceed to the next
phase without completing the current one.

---

## Input

**Plan file path:** $ARGUMENTS

If $ARGUMENTS was not provided, ask:
> "Please provide the path to your approved test plan in the release folder
> (e.g. artifacts/release-v1.2-01/stories/test-plan-KAN-101-v1.2.md)."

---

## Phase 1 — Read and Validate the Plan

1. Read the file at **$ARGUMENTS** from the filesystem.
2. If the file does not exist, stop and tell the user:
   > "File not found at `$ARGUMENTS`. Please check the path and try again."
3. Parse the plan header and extract:
   - Feature name (from the H1 heading)
   - Story key + Epic key (e.g. `KAN-101` / `KAN-45`) if present
   - Status — must be `READY` or approved by the user
   - Spec file target (from the header)
4. Parse all scenarios from the plan body:
   - Extract scenario name, Given/When/Then steps, Source AC reference
   - Extract Category (positive/negative/edge/non-functional/performance)
   - Extract Priority (p0/p1/p2 from the plan header field)
   - Count total scenarios
5. Display what was parsed:
   ```
   Parsed: [Feature name]
   Story:  [KAN-101 or N/A]
   Epic:   [KAN-45 or N/A]
   Status: [DRAFT | READY | Approved]
   Scenarios found: [N]
   Spec target: tests/kan-[storynum]-[feature].spec.ts
   ```
6. If Status is `DRAFT`, warn the user:
   > "The plan status is DRAFT — it has not been verified against the live
   > app. Proceeding anyway, but selectors may need adjustment after the
   > first test run. Reply 'yes' to continue or 'no' to cancel."
7. Ask the user to confirm:
   > "Ready to generate specs from this plan. Reply 'yes' to proceed."

**Do not proceed to Phase 2 without confirmation.**

---

## Phase 2 — Determine Page Objects Needed

1. Scan the plan for all distinct page sections or UI areas referenced:
   - Header, navigation, hero banner, footer, etc.
   - Each distinct section = one page object class
2. Check which page objects already exist in `pages/`:
   ```
   ls pages/
   ```
3. List what exists and what needs to be created:
   ```
   Existing:  login.page.ts (LoginPage)
   To create: flipkart.page.ts (FlipkartPage — header, tabs, banner, sections, footer)
   ```
4. Confirm with the user:
   > "I need to create [N] page object(s). Proceed?"

---

## Phase 3 — Create Page Objects

For each missing page object, create the file following the `coding-standards` skill:

### File location
`pages/[feature-name].page.ts`

Follow the [coding-standards skill](.opencode/skills/coding-standards/SKILL.md#page-object-model-structure) for:
- Class structure (role-first locators, constructor pattern)
- Method conventions (one action, no assertions, no test data)
- Navigation method `async goto()`
- **No `page.waitForTimeout()`** anywhere

### Use live app selectors
If the requirement file has an Appendix with real selectors (like
`requirements/flipkart-foryou-tab.md` Appendix A), use those exact
locators in the page object. For example:
```
Search Input: textbox "Search for Products, Brands and More"
Login Button: link "Login"
For You Tab:  link "For You"
```

---

## Phase 4 — Generate Spec Files

For each scenario group in the plan (grouped by section/topic), generate
a spec file following the `coding-standards` skill.

### File location
`tests/kan-[storynum]-[feature].spec.ts`
e.g. Story `KAN-101`, feature "user login" → `tests/kan-101-user-login.spec.ts`
(No story key? Use `tests/[feature-name].spec.ts`.)

One spec file per feature. If the plan is very large (50+ scenarios),
split into multiple files by section:
```
tests/
├── flipkart-header.spec.ts
├── flipkart-tabs.spec.ts
├── flipkart-banner.spec.ts
└── flipkart-sections.spec.ts
```

### Spec file rules (from coding-standards skill)

1. **`test.describe` block references the Story and Epic keys:**
   ```typescript
   test.describe('[Feature Name] — KAN-101 (Epic: KAN-45)', () => { ... });
   ```
   If no Jira keys are present, use the feature name only:
   ```typescript
   test.describe('Flipkart For You Tab', () => { ... });
   ```

2. **Test name = scenario name in `should` format:**
   ```
   Plan: "Verify search input field is displayed"
   Test: test('should display search input field', async () => { ... })
   ```

3. **All interactions via page object** — no raw `page.click()` in specs.

4. **All assertions in spec files** — no assertions in page objects.

5. **`beforeEach` initializes page object and navigates:**
   ```typescript
   let flipkartPage: FlipkartPage;

   test.beforeEach(async ({ page }) => {
     flipkartPage = new FlipkartPage(page);
     await flipkartPage.goto();
   });
   ```

6. **Import test data from fixtures:**
   ```typescript
   import { searchTerms } from '../fixtures/data/search-terms.json';
   ```

7. **No hardcoded strings** — use imported data or parameters.

8. **No `page.waitForTimeout()`** anywhere.

9. **No `test.only`** committed.

### Test Tags (Mandatory)

Every test MUST have at least one tag. Tags are assigned based on the scenario's Category and Complexity from the plan.
Apply tags per the [coding-standards skill](.opencode/skills/coding-standards/SKILL.md#test-tags), including the 5-category tags
`@negative`, `@edge-case`, `@a11y`, `@security`, `@compat`, `@usability`, `@reliability`, `@performance`.
Each test must ALSO carry its `@priority-p0` / `@priority-p1` / `@priority-p2` tag matching the scenario's `Priority`
field in the plan.

### AC Annotations (Mandatory)

Every generated `test()` MUST begin with a `test.info().annotations.push(...)`
call carrying `story`, `epic`, `AC`, and `priority` entries, using the
scenario's `Source`/AC line text and `Priority` from the plan. Follow the
[AC annotations rule](.opencode/skills/coding-standards/SKILL.md#ac-annotations-mandatory)
in the coding-standards skill exactly.

### Spec template

```typescript
// spec: artifacts/release-<version>-<NN>/stories/test-plan-<STORY>-<version>.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { [Feature]Page } from '../pages/[feature].page';

test.describe('[Feature Name] — [STORY] (Epic: [EPIC])', () => {

  let [feature]Page: [Feature]Page;

  test.beforeEach(async ({ page }) => {
    [feature]Page = new [Feature]Page(page);
    await [feature]Page.goto();
  });

  // @smoke @ui @priority-p1
  test('should [expected behavior from scenario]', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: '[STORY]' },
      { type: 'epic', description: '[EPIC]' },
      { type: 'AC', description: '[AC-n] — [verbatim AC text]' },
      { type: 'priority', description: '[p0|p1|p2]' }
    );
    // Given — setup state via page object methods
    // When — perform action via page object method
    // Then — assert using Playwright matchers
  });

});
```

### For each scenario in the plan:
1. Map Given → page object state setup or precondition
2. Map When → page object action method call
3. Map Then → `expect()` assertion in the spec
4. If a scenario has TBD/ASSUMPTION tags, add a comment:
   ```typescript
   // TODO: [TBD description] — needs resolution before CI
   test.skip('should [scenario name]', async () => {
   ```
   Use `test.skip` with a comment explaining why — never leave it
   without explanation.

---

## Phase 5 — Write Files to Disk

1. Write all page object files to `pages/`.
2. Write all spec files to `tests/`.
3. Display a summary:
   ```
   Generated files:
   ✅ pages/flipkart.page.ts     — FlipkartPage (12 locators, 8 methods)
   ✅ tests/flipkart-header.spec.ts  — 27 tests (23 positive, 4 negative)
   ✅ tests/flipkart-tabs.spec.ts    — 24 tests
   ✅ tests/flipkart-banner.spec.ts  — 13 tests
   ✅ tests/flipkart-sections.spec.ts — 122 tests

   Total: [N] tests across [N] spec files

   Tags applied:
   @smoke: [N] | @regression: [N] | @e2e: [N]
   @ui: [N] | @negative: [N] | @edge-case: [N]
   @a11y: [N] | @security: [N] | @performance: [N]
   @priority-p0: [N] | @priority-p1: [N] | @priority-p2: [N]
   ```

---

## Phase 6 — Validate with TypeScript

Run type-checking to catch errors before the user runs tests:
```bash
npx tsc --noEmit
```

If there are type errors:
1. Display the errors
2. Fix them automatically
3. Re-run type-check until clean
4. Report: "TypeScript check passed ✅"

---

## Phase 7 — Final Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spec generation complete — [feature name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plan:     $ARGUMENTS
Story:    [STORY or N/A]
Epic:     [EPIC or N/A]
Status:   [plan status]

Page objects created:
  ✅ pages/[file].page.ts — [ClassName]

Spec files created:
  ✅ tests/[file].spec.ts — [N] tests

TypeScript check: ✅ passed

Next steps:
1. Run tests:  npx playwright test tests/[feature].spec.ts
2. Fix issues: /heal-failed-run tests/[feature].spec.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

Follow the [What the Generator Must Never Do](.opencode/skills/coding-standards/SKILL.md#what-the-generator-must-never-do) rules from `coding-standards` skill.

Additional rules:
- Always run `npx tsc --noEmit` before reporting success.
- Never create a test without at least one tag — every test must be tagged.
- Never create a test without the `test.info().annotations` AC/story/epic/priority block.
