---
name: test-data-setup
description: >
  Use this skill whenever setting up test environments, authentication state,
  base URLs, or seed data for Playwright tests. Triggers when a user asks to
  "set up test data", "configure environments", "handle auth in tests",
  "add a fixture", or "seed data before tests". Covers two environments
  (dev and staging), mixed auth strategy (storageState for most tests,
  UI login for auth-specific tests), and mixed test data (static JSON for
  happy path, Faker for edge cases). Every agent-generated fixture, global
  setup file, or env config must follow these rules.
---

# Test Data & Environment Setup

## Core Principles

1. **Environment is always explicit** — No test hardcodes a URL. All env-specific values come from environment variables resolved at runtime.
2. **Auth state is reused, not repeated** — storageState is the default. Full UI login is reserved for tests that explicitly test the auth flow.
3. **Tests are isolated** — No test depends on state left by another. Each test sets up and tears down its own data.
4. **No secrets in code** — Credentials, API keys, and tokens live in `.env` files or CI secrets — never committed to the repo.

---

## Environment Configuration

### Two environments: `dev` and `staging`

| Variable | Dev | Staging |
|----------|-----|---------|
| `BASE_URL` | `https://dev.yourapp.com` | `https://staging.yourapp.com` |
| `API_URL` | `https://api.dev.yourapp.com` | `https://api.staging.yourapp.com` |
| `TEST_USER_EMAIL` | dev test user email | staging test user email |
| `TEST_USER_PASSWORD` | dev test user password | staging test user password |

### `.env.dev` and `.env.staging` files
```bash
# .env.dev
BASE_URL=https://dev.yourapp.com
API_URL=https://api.dev.yourapp.com
TEST_USER_EMAIL=testuser@dev.yourapp.com
TEST_USER_PASSWORD=Dev@Test1234

# .env.staging
BASE_URL=https://staging.yourapp.com
API_URL=https://api.staging.yourapp.com
TEST_USER_EMAIL=testuser@staging.yourapp.com
TEST_USER_PASSWORD=Staging@Test1234
```

Both files must be listed in `.gitignore`. Never commit them.

### `playwright.config.ts` — env resolution
```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

const env = process.env.TEST_ENV ?? 'dev';
dotenv.config({ path: `.env.${env}` });

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Setup project runs first — saves auth state
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'fixtures/auth/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

### Running against each environment
```bash
# Dev (default)
npx playwright test

# Staging
TEST_ENV=staging npx playwright test
```

---

## Authentication Strategy

### Default — storageState (all non-auth tests)

Auth state is captured once in global setup and reused across all tests
that don't explicitly test the login flow.

**File: `fixtures/auth/global.setup.ts`**
```typescript
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';

const authFile = 'fixtures/auth/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env.TEST_USER_EMAIL!,
    process.env.TEST_USER_PASSWORD!
  );
  await expect(page).toHaveURL('/dashboard');

  // Save auth state — reused by all dependent tests
  await page.context().storageState({ path: authFile });
});
```

**Folder structure for auth state:**
```
fixtures/
└── auth/
    ├── global.setup.ts      # Captures auth state once
    └── .auth/
        └── user.json        # Saved storageState (gitignored)
```

Add to `.gitignore`:
```
fixtures/auth/.auth/
```

### Exception — UI login (auth-specific tests only)

Tests that explicitly cover the login/logout flow must NOT use storageState.
They need a clean, unauthenticated browser context.

```typescript
// login.spec.ts — auth-specific, no storageState dependency
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

// Override project storageState for this spec only
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login — AUTH-42', () => {
  test('should log in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Auth strategy rules
- **Never call `loginPage.login()` in `beforeEach` of non-auth specs** — storageState handles it.
- **Never hardcode credentials** — always use `process.env.TEST_USER_EMAIL` and `process.env.TEST_USER_PASSWORD`.
- **Always add `test.use({ storageState: { cookies: [], origins: [] } })`** at the top of any spec that tests the auth flow itself.
- **Re-run global setup if auth state expires** — add `--project=setup` flag to refresh.

---

## Test Data Setup

### Static data — happy path
Location: `fixtures/data/*.json`

```
fixtures/
└── data/
    ├── users.json       # Login credentials, user profiles
    ├── products.json    # Product/item data for e-commerce flows
    └── orders.json      # Pre-seeded order data for order management flows
```

Rules:
- One JSON file per data domain — do not mix unrelated data in one file.
- Keys must be descriptive: `valid`, `locked`, `expired`, `admin` etc.
- No environment-specific values in JSON files — those live in `.env.*` files.

### Dynamic data — edge cases
Location: `fixtures/data/generators.ts`

```typescript
import { faker } from '@faker-js/faker';

// Fix seed in CI for reproducibility — set in global setup
export function seedFaker(seed = 12345) {
  faker.seed(seed);
}

export function generateUser(overrides?: {
  emailPrefix?: string;
  role?: 'admin' | 'viewer';
}) {
  return {
    email: `${overrides?.emailPrefix ?? faker.internet.userName()}@example.com`,
    password: faker.internet.password({ length: 12, memorable: false }),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: overrides?.role ?? 'viewer',
  };
}

export function generateProduct(overrides?: { price?: number }) {
  return {
    name: faker.commerce.productName(),
    price: overrides?.price ?? faker.number.float({ min: 1, max: 999, fractionDigits: 2 }),
    sku: faker.string.alphanumeric(8).toUpperCase(),
  };
}
```

### API-based data seeding (when needed)
For tests that require backend state (e.g. a pre-existing order), use
API calls in `beforeEach` — never rely on UI flows to seed data:

```typescript
test.beforeEach(async ({ request }) => {
  // Seed an order directly via API before the test
  await request.post(`${process.env.API_URL}/test/orders`, {
    data: { userId: 'test-user-id', status: 'pending' }
  });
});

test.afterEach(async ({ request }) => {
  // Clean up seeded data after each test
  await request.delete(`${process.env.API_URL}/test/orders/cleanup`);
});
```

---

## What the Generator Must Never Do

- Hardcode any URL — always use `process.env.BASE_URL` or `baseURL` from config.
- Hardcode credentials or tokens in any file.
- Call `loginPage.login()` in `beforeEach` of non-auth spec files.
- Skip `test.use({ storageState: ... })` override in auth-specific specs.
- Commit `.env.*` files or `fixtures/auth/.auth/` folder.
- Use `page.waitForTimeout()` to wait for data to load — use API seeding + locator auto-waiting instead.
- Share mutable data objects between tests — each test gets its own data instance.