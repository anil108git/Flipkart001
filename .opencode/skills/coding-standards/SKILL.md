---
name: coding-standards
description: >
  Use this skill whenever generating, editing, or reviewing Playwright
  TypeScript test code. Triggers when the Generator agent produces spec
  files, when a developer asks to "write a test", "add a spec", "create
  a page object", or "fix a locator". Defines the team's canonical patterns
  for locators, Page Object Model structure, test data, spec file layout,
  and naming conventions. Every line of generated test code must conform
  to these standards before being written to disk.
---

# Coding Standards — Playwright TypeScript Framework

## Core Principles

1. **Roles first, testid as fallback** — Always prefer semantic locators. Only use `data-testid` when no meaningful ARIA role or label exists.
2. **Pages are classes** — Every page or major UI section has a dedicated class in `pages/`. No raw Playwright calls inside spec files.
3. **Specs describe behavior, not implementation** — Spec files read like a test plan, not code. All interaction detail lives in the page object.
4. **Mixed test data** — Static JSON for happy path, Faker for edge cases. No hardcoded strings inside spec files.
5. **One spec file per feature** — Mirror the Jira ticket/plan structure. Do not combine unrelated features into one spec.

---

## Locator Strategy

### Rule 1 — Roles first
Always attempt role-based locators before anything else:

```typescript
// ✅ Preferred
page.getByRole('button', { name: 'Sign in' })
page.getByRole('textbox', { name: 'Email address' })
page.getByRole('link', { name: 'Forgot password?' })
page.getByLabel('Password')
page.getByText('Invalid credentials')
```

### Rule 2 — testid as fallback only
Use `data-testid` only when:
- The element has no meaningful ARIA role
- Multiple elements share the same role/name
- The element is purely decorative but needs to be interacted with

```typescript
// ✅ Acceptable fallback
page.getByTestId('user-avatar-menu')
page.getByTestId('toast-notification')

// ❌ Never use when a role locator works
page.getByTestId('submit-button')   // use getByRole('button') instead
```

### Rule 3 — Never use CSS or XPath
```typescript
// ❌ Banned
page.locator('#submit-btn')
page.locator('.login-form > button')
page.locator('//button[@type="submit"]')
```

### Rule 4 — Avoid positional locators
```typescript
// ❌ Banned — brittle
page.locator('button').nth(2)
page.locator('input').first()
```

### Rule 5 — Chain only when necessary
```typescript
// ✅ Acceptable when scoping to a section
page.getByRole('region', { name: 'Billing' })
    .getByRole('textbox', { name: 'Card number' })
```

---

## Page Object Model Structure

### File location
```
pages/
├── login.page.ts
├── dashboard.page.ts
├── checkout.page.ts
└── components/
    ├── navbar.component.ts
    └── modal.component.ts
```
- Full pages → `pages/<feature>.page.ts`
- Shared UI components used across pages → `pages/components/<name>.component.ts`

### Class template
Every page object must follow this structure:

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  // 1. Page reference
  readonly page: Page;

  // 2. Locators — defined once in constructor, role-first
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput    = page.getByRole('textbox', { name: 'Email address' });
    this.passwordInput = page.getByLabel('Password');
    this.signInButton  = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage  = page.getByRole('alert');
  }

  // 3. Navigation method
  async goto() {
    await this.page.goto('/login');
  }

  // 4. Action methods — one meaningful action per method, no assertions here
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async submitEmpty() {
    await this.signInButton.click();
  }

  // 5. State/getter methods — for reading UI state, used by assertions in spec
  async getErrorText(): Promise<string | null> {
    return this.errorMessage.textContent();
  }
}
```

### Page object rules
- **No assertions inside page objects** — assertions belong in spec files only.
- **No test data inside page objects** — data is passed in as parameters.
- **One method = one action** — do not chain multiple clicks/fills into a single method unless they are inseparable.
- **Methods return `Promise<void>` or a readable value** — never return a Locator from a method.
- **No `page.waitForTimeout()`** — use Playwright's built-in auto-waiting via locator actions.

---

## Spec File Structure

### File location
```
tests/
├── seed.spec.ts           # Context/seed file for agents
├── login.spec.ts
├── dashboard.spec.ts
└── checkout.spec.ts
```
One spec file per Jira feature ticket. Name matches the page object file.

### Spec template

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { users } from '../fixtures/data/users.json';   // static happy path data
import { generateUser } from '../fixtures/data/generators'; // dynamic edge case data

test.describe('Login — KAN-101 (Epic: KAN-45)', () => {

  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // Happy path — static data
  test('should log in with valid credentials', async ({ page }) => {
    await loginPage.login(users.valid.email, users.valid.password);
    await expect(page).toHaveURL('/dashboard');
  });

  // Negative path — static data
  test('should show error for invalid password', async () => {
    await loginPage.login(users.valid.email, 'wrong-password');
    await expect(loginPage.errorMessage).toBeVisible();
  });

  // Edge case — dynamic data
  test('should reject email with special characters', async () => {
    const edgeUser = generateUser({ emailPrefix: '"><script>' });
    await loginPage.login(edgeUser.email, edgeUser.password);
    await expect(loginPage.errorMessage).toBeVisible();
  });

});
```

### Spec file rules
- **`test.describe` block always references the Story key and Epic key** — e.g. `'Login — KAN-101 (Epic: KAN-45)'` (see epic-story-traceability skill).
- **Spec file names carry the Story key prefix** — `tests/kan-101-login.spec.ts`.
- **Test name describes the expected behavior**, not the action — `'should show error for invalid password'` not `'enter wrong password'`.
- **All page interactions via page object** — no raw `page.click()` or `page.fill()` in spec files.
- **All assertions in spec files** — no assertions inside page objects.
- **`beforeEach` initialises page object and navigates** — no navigation inside individual test blocks.
- **No `test.only`** committed to the repo.
- **No `page.waitForTimeout()`** anywhere.
- **Every test must have at least one tag** — see Test Tags section below.

---

## Test Categorization

### Test Case Categories (5-category model)

Every feature MUST be assessed across all five categories. See the
`test-categorization` skill for the full rules, subtypes, and NA handling.

| Category | Description | Example |
|----------|-------------|---------|
| **Positive** | Happy path — valid input, expected behavior | User logs in with correct credentials |
| **Negative** | Error paths — invalid input, error handling | User logs in with wrong password |
| **Edge Case** | Boundary conditions, unusual inputs | Empty fields, max length, special characters |
| **Non-Functional** | Quality attributes — accessibility, security, compatibility, usability, reliability | Screen-reader support, keyboard navigation |
| **Performance** | Load, response time, throughput, resource use | Search responds within 2 seconds |

Mandatory minimum per AC: ≥1 positive + ≥1 negative + ≥1 edge.
Non-functional/performance added when implied, else `na` with a rationale
in `coverage-matrix.json`.

### Complexity Levels

| Complexity | Description | Examples |
|------------|-------------|----------|
| **Simple** | Single action, single assertion | Click button, verify element visible |
| **Medium** | Multi-step flow, multiple assertions | Fill form, submit, verify result |
| **Complex** | Multi-page flow, conditional logic | Login → cart → checkout → verify |

---

## Test Tags

### Tag Definitions

| Tag | Description | When to Apply |
|-----|-------------|---------------|
| `@smoke` | Critical path — must pass before release | Positive + Simple/Medium |
| `@regression` | Full suite — run before major releases | All scenarios |
| `@e2e` | End-to-end flow across multiple pages | Complex scenarios |
| `@ui` | UI element verification | Element visibility, layout |
| `@negative` | Error handling and validation | All Negative scenarios |
| `@edge-case` | Boundary and unusual inputs | All Edge Case scenarios |
| `@a11y` | Accessibility compliance | Non-functional/accessibility |
| `@security` | Security validation | Non-functional/security |
| `@compat` | Cross-browser/viewport compatibility | Non-functional/compatibility |
| `@usability` | UX usability checks | Non-functional/usability |
| `@reliability` | Reliability / recovery | Non-functional/reliability |
| `@performance` | Load time, rendering, throughput | Performance scenarios |

### Tag Assignment Rules

| Scenario Category | Required Tags | Optional Tags |
|-------------------|---------------|---------------|
| Positive + Simple | `@smoke` `@ui` | `@regression` |
| Positive + Medium | `@smoke` `@regression` | `@e2e` |
| Positive + Complex | `@e2e` `@regression` | `@smoke` |
| Negative | `@negative` `@regression` | `@ui` |
| Edge Case | `@edge-case` `@regression` | `@ui` |
| Non-Functional | `@a11y` / `@security` / `@compat` / `@usability` / `@reliability` (matching subtype) `@regression` | `@ui` |
| Performance | `@performance` `@regression` | — |

### Tag Usage in Spec Files

```typescript
test.describe('[Feature Name] — KAN-101 (Epic: KAN-45)', () => {

  // @smoke @ui
  test('should display search input field', async ({ page }) => {
    // ...
  });

  // @negative @regression
  test('should show error for empty search', async ({ page }) => {
    // ...
  });

  // @a11y @regression
  test('should support keyboard navigation of search results', async ({ page }) => {
    // ...
  });

  // @e2e @regression
  test('should complete full checkout flow', async ({ page }) => {
    // ...
  });

});
```

### Running Tests by Tag

See [test-data-setup skill](../test-data-setup/SKILL.md) for data strategy and [list-of-commands.md](../../docs/list-of-commands.md) for grep commands.

---

## Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Page object file | `kebab-case.page.ts` | `login.page.ts` |
| Component file | `kebab-case.component.ts` | `navbar.component.ts` |
| Spec file | `kan-<storynum>-kebab-case.spec.ts` | `kan-101-header.spec.ts` |
| Page object class | `PascalCase + Page` | `LoginPage` |
| Component class | `PascalCase + Component` | `NavbarComponent` |
| Locator properties | `camelCase`, descriptive noun | `signInButton`, `errorMessage` |
| Action methods | `camelCase`, verb-first | `login()`, `submitEmpty()`, `selectPlan()` |
| State/getter methods | `camelCase`, `get`-prefixed | `getErrorText()`, `getSelectedPlan()` |
| Test describe block | `'FeatureName — STORY-ID (Epic: EPIC-ID)'` | `'Login — KAN-101 (Epic: KAN-45)'` |
| Test name | `'should [expected behavior]'` | `'should show error for invalid password'` |
| Static data file | `kebab-case.json` | `users.json`, `products.json` |
| Generator function | `generate`-prefixed | `generateUser()`, `generateOrder()` |

---

## What the Generator Must Never Do

- Write raw `page.locator()`, `page.click()`, or `page.fill()` calls inside spec files.
- Use CSS selectors, XPath, or positional locators (`.nth()`, `.first()`).
- Add assertions inside page object methods.
- Hardcode test data strings inside spec or page object files.
- Use `page.waitForTimeout()` anywhere.
- Create a new page object class without following the constructor locator pattern.
- Combine two unrelated features into one spec file.
- Commit `test.only` or `test.skip` without a comment explaining why.
- Invent a locator for an element not yet confirmed to exist in the live DOM (tag as `TBD` instead).