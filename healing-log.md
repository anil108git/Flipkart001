# Healing Log

## [2026-08-02] kan-12-homepage-navigation.spec.ts — "should display all 14 category tabs on initial load" (and 21 other tests)

**Environment:** dev
**Failure type:** AUTH_FAILURE
**Error:** Error reading storage state from fixtures/auth/.auth/user.json: ENOENT: no such file or directory, open 'fixtures/auth/.auth/user.json'

**Action taken:** ESCALATED
**Jira issue:** KAN-18
**Reason:** AUTH_FAILURE — Storage state file missing. Global setup misconfigured: `global.setup.ts` is located at `fixtures/auth/global.setup.ts` but Playwright config's `testDir` is `./tests`, so the setup project never discovers or runs the global setup file. This is an infrastructure issue, not a locator/timeout problem.
**Files changed:** None

**Tests affected (all 22 tests in the spec):**
1. should display all 14 category tabs on initial load
2. should display all 14 category tabs after page refresh
3. should verify no tabs are missing on page load
4. should verify tab labels match exactly (case, punctuation, spacing)
5. should verify special characters in tab names render correctly
6. should verify tab bar loads within performance budget (1.5s)
7. should verify First Contentful Paint of tab bar < 1.5s
8. should verify "For You" tab is active on initial load
9. should verify "For You" tab remains active after page refresh
10. should verify active tab has distinct visual indicator
11. should verify no other tab shows active indicator on load
12. should verify active indicator persists across rapid refreshes
13. should verify clicking "Fashion" tab navigates to Fashion category page
14. should verify clicking "Mobiles" tab navigates to Mobiles category page
15. should verify clicking "Electronics" tab navigates to Electronics category page
16. should verify clicking all 14 tabs sequentially routes correctly
17. should verify network failure during navigation shows error state
18. should verify server returns 404/500 shows appropriate error handling
19. should verify rapid successive tab clicks handled gracefully
20. should verify click tab then browser back button returns to homepage with correct tab active
21. should verify navigation completes within 3s (page load)
22. should verify Category page TTFB < 500ms

---

## [2026-08-02] kan-12-homepage-navigation.spec.ts — "should verify clicking 'Fashion' tab navigates to Fashion category page"

**Environment:** staging
**Failure type:** ROUTE_CHANGE
**Error:** page.waitForURL: Test timeout of 120000ms exceeded. waiting for navigation to "**/fashion**" until "load"

**Action taken:** ESCALATED
**Jira issue:** KAN-19
**Reason:** URL pattern mismatch — test expects URL containing "/fashion" but actual URL is "/ss-26-base-inline-at-store". This is a semantic change requiring QA judgment.
**Files changed:** None

---

## [2026-08-02] kan-12-homepage-navigation.spec.ts — "should verify clicking 'Mobiles' tab navigates to Mobiles category page"

**Environment:** staging
**Failure type:** ROUTE_CHANGE
**Error:** page.waitForURL: Test timeout of 120000ms exceeded. waiting for navigation to "**/mobiles**" until "load"

**Action taken:** ESCALATED
**Jira issue:** KAN-20
**Reason:** URL pattern mismatch — test expects URL containing "/mobiles" but actual URL is "/mobile-phones-store". This is a semantic change requiring QA judgment.
**Files changed:** None

---

## [2026-08-02] kan-12-homepage-navigation.spec.ts — "should verify clicking 'Electronics' tab navigates to Electronics category page"

**Environment:** staging
**Failure type:** ROUTE_CHANGE
**Error:** page.waitForURL: Target page, context or browser has been closed. waiting for navigation to "**/electronics**" until "load"

**Action taken:** ESCALATED
**Jira issue:** KAN-21
**Reason:** URL pattern mismatch — test expects URL containing "/electronics" but actual URL is "/new-elec-clp-march-at-store". This is a semantic change requiring QA judgment.
**Files changed:** None

---

## [2026-08-02] global.setup.ts — "authenticate"

**Environment:** staging
**Failure type:** AUTH_FAILURE
**Error:** locator.fill: Test timeout of 30000ms exceeded. waiting for getByRole('textbox', { name: /email|mobile/i })

**Action taken:** ESCALATED
**Jira issue:** KAN-22
**Reason:** Login popup overlay intercepts pointer events, preventing authentication. This is an infrastructure issue in global.setup.ts.
**Files changed:** None

---

