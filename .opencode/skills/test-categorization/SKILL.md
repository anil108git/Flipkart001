---
name: test-categorization
description: >
  Use this skill whenever classifying test scenarios during planning,
  generation, or coverage-matrix maintenance. Triggers when a user says
  "classify this scenario", "add non-functional coverage", "what category",
  "coverage matrix", or whenever the Planner assigns categories/tags to
  scenarios. Defines the mandatory 5-category coverage model
  (positive, negative, edge, non-functional, performance), the subtype
  table, and the minimum-coverage rule with NA handling.
---

# Test Categorization — 5-Category Coverage Model

## Core Principles

1. **Five mandatory categories** — every Story is assessed against
   positive, negative, edge, non-functional, and performance. A category
   that does not apply is recorded as `na` with a rationale — never just
   omitted.
2. **Minimum per AC** — at least 1 positive + 1 negative + 1 edge scenario
   per acceptance-criteria line. Non-functional/performance are added when
   the AC implies them (otherwise `na`).
3. **Category + subtype are machine-readable** — they map 1:1 to the
   `coverage-matrix.json` scenario fields and to test tags.
4. **A category is `na` only with justification** — excluding a category
   without a rationale is treated as a coverage gap.

---

## The Five Categories

| Category | Scope | Subtypes |
|----------|-------|----------|
| `positive` | Happy path — valid input, expected behavior | null |
| `negative` | Error paths — invalid input, error handling, auth failures | null |
| `edge` | Boundary conditions, empty, max-length, special chars, unicode | null |
| `non-functional` | Quality attributes, not feature behavior | `accessibility`, `security`, `compatibility`, `usability`, `reliability` |
| `performance` | Timing, load, throughput, resource use | `performance-load`, `performance-response`, `performance-throughput`, `performance-resource` |

---

## Minimum Coverage Rule

For every Story (applied per AC line, aggregated at Story level):

1. **Positive** — at least one per AC. Non-negotiable.
2. **Negative** — at least one per AC where an incorrect input/action is
   possible. If an AC has no plausible negative, mark `na`.
3. **Edge** — at least one per AC where boundary inputs exist (empty,
   max length, special chars, list boundaries). If none apply, mark `na`.
4. **Non-functional** — assess each subtype:
   - `accessibility`: keyboard nav / screen reader / ARIA implied by AC or
     the feature type → else `na`.
   - `security`: authz, injection, XSS, sensitive data implied → else `na`.
   - `compatibility`: multiple browsers/viewports implied → else `na`.
   - `usability` / `reliability`: only when AC implies → else `na`.
5. **Performance** — response-time / load / throughput implied (e.g. AC
   says "under 2 seconds") → else `na`.

`na` entries carry `rationale` explaining why the category does not apply.
`SUGGESTED` coverage beyond the AC is allowed but must be tagged as
optional (see requirements-only-planning skill).

---

## Category → Tag Mapping

| Category | Subtype | Required tag |
|----------|---------|--------------|
| `positive` | — | existing positive-path tags (`@smoke`, `@regression`) |
| `negative` | — | `@negative` |
| `edge` | — | `@edge-case` |
| `non-functional` | `accessibility` | `@a11y` |
| `non-functional` | `security` | `@security` |
| `non-functional` | `compatibility` | `@compat` |
| `non-functional` | `usability` | `@usability` |
| `non-functional` | `reliability` | `@reliability` |
| `performance` | any | `@performance` |

### Priority tags

Every scenario also carries exactly ONE priority tag, inherited from the
Story's Jira priority:

| Jira priority | Matrix `priority` | Required tag |
|---------------|-------------------|--------------|
| Highest, High | `p0` | `@priority-p0` |
| Medium | `p1` | `@priority-p1` |
| Low, Lowest | `p2` | `@priority-p2` |

The Planner records `priority` on each matrix scenario; the Generator adds
the matching `@priority-*` tag to the test. `@priority-p1` is the default
when Jira priority is unset.

Every test carries at least one tag (existing coding-standards rule).

---

## Scenario → Matrix Mapping

When the Planner writes scenarios and the Generator writes specs, each
scenario records in `coverage-matrix.json`:

```json
{
  "id": "KAN-101-001",
  "source": "AC-1",
  "acText": "Search box is visible on the header",
  "priority": "p1",
  "title": "Search box is visible",
  "category": "positive",
  "subtype": null,
  "complexity": "Simple",
  "tags": ["@smoke", "@ui", "@priority-p1"],
  "status": "planned",
  "na": false,
  "rationale": null,
  "specFile": "tests/kan-101-header.spec.ts",
  "testName": "should show search box"
}
```

The matrix `summary` is recomputed by
`scripts/build-coverage-matrix.mjs` after each run.

---

## NA Decision Flow

```
For each of the 5 categories on a Story:
  ├─ Does the AC (or the feature itself) imply this category?
  │       Yes → plan scenarios (record category + subtype)
  │       No ↓
  ├─ Can I justify exclusion in one sentence?
  │       Yes → record status:"na", na:true, rationale:"<why>"
  │       No ↓
  └─ Flag as a coverage gap → open question / SUGGESTED, ask reviewer
```

---

## What This Skill Must Never Do

- Skip a category because "there wasn't time" — record `na` with rationale.
- Invent a performance requirement the AC never implies.
- Give a scenario more than one `category` — use `subtype` for nuance.
- Mark `na` without a `rationale` in the coverage matrix.
- Tag a scenario `@performance` without a `performance` category.
- Omit the `priority` field or the `@priority-*` tag on a scenario — default `p1` when unset.
