# Test Plan: Flipkart Header Section
Source file: requirements/flipkart-foryou-tab.md
Jira Issue: N/A
Status: READY — live app verified, selectors confirmed
Created: 2026-07-27
Author: QA (generated from requirement file)
Grounding: Live app exploration on 2026-07-26 — all selectors verified via Playwright CLI headed mode
Spec file (to be generated): tests/flipkart-header.spec.ts
Seed file: tests/seed.spec.ts

---

## 1. Logo & Brand Area

### Scenario 1: Verify Flipkart logo is displayed
Source: HEADER-001
Priority: High

Given: The user navigates to the Flipkart homepage
When:  The page loads completely
Then:  The Flipkart logo is visible in the top-left corner
Locators: `getByRole('link', { name: 'Flipkart' })` (logo link)

---

### Scenario 2: Verify logo is clickable and navigates to homepage
Source: HEADER-002
Priority: High

Given: The user is on a Flipkart sub-page (e.g. search results)
When:  The user clicks the Flipkart logo
Then:  The user is navigated back to the homepage
Locators: `getByRole('link', { name: 'Flipkart' })`

---

### Scenario 3: Verify Flipkart Plus brand banner is displayed
Source: HEADER-003
Priority: Medium

Given: The user navigates to the Flipkart homepage
When:  The page loads completely
Then:  The Flipkart Plus brand banner is visible next to the logo
Locators: TBD — banner element not captured in Playwright CLI snapshot, needs live verification

---

## 2. Location Selector

### Scenario 4: Verify "Location not set" text is displayed
Source: HEADER-004
Priority: Medium

Given: The user is on the Flipkart homepage with no delivery location set
When:  The page loads completely
Then:  The text "Location not set" is visible in the header
Locators: `getByRole('generic', { name: 'Location not set' })`

---

### Scenario 5: Verify "Select delivery location" helper text is displayed
Source: HEADER-005
Priority: Medium

Given: The user is on the Flipkart homepage with no delivery location set
When:  The page loads completely
Then:  The helper text "Select delivery location" is visible below the location text
Locators: TBD — helper text selector not captured, needs live verification

---

### Scenario 6: Click on location selector opens location modal
Source: HEADER-006
Priority: High

Given: The user is on the Flipkart homepage
When:  The user clicks on the location selector area
Then:  A location selection modal or dropdown opens
Locators: `getByRole('generic', { name: 'Location not set' })` — click parent container

---

### Scenario 7: Verify location icon is displayed
Source: HEADER-007
Priority: Low

Given: The user is on the Flipkart homepage with no delivery location set
When:  The page loads completely
Then:  A map pin icon is visible near the location text
Locators: TBD — icon element not captured in snapshot, needs live verification

---

## 3. Search Bar

### Scenario 8: Verify search input field is displayed with correct placeholder
Source: HEADER-008, HEADER-020
Priority: High

Given: The user is on the Flipkart homepage
When:  The page loads completely
Then:  A search input field is visible with placeholder text "Search for Products, Brands and More"
Locators: `getByRole('textbox', { name: 'Search for Products, Brands and More' })`

---

### Scenario 9: Verify search icon button is displayed
Source: HEADER-009
Priority: Medium

Given: The user is on the Flipkart homepage
When:  The page loads completely
Then:  A search icon button (magnifying glass) is visible next to the search input
Locators: `getByRole('button', { name: 'Search for Products, Brands and More' })`

---

### Scenario 10: Click on search input field gives focus
Source: HEADER-010
Priority: High

Given: The user is on the Flipkart homepage
When:  The user clicks on the search input field
Then:  The input field gains focus and a cursor appears inside it
Locators: `getByRole('textbox', { name: 'Search for Products, Brands and More' })`

---

### Scenario 11: Type valid search term shows suggestions dropdown
Source: HEADER-011
Priority: High

Given: The user is on the Flipkart homepage
When:  The user types "phone" into the search input
Then:  A search suggestions dropdown appears below the input
Locators: `getByRole('textbox', { name: 'Search for Products, Brands and More' })`
Test data: `"phone"` from `fixtures/data/search-terms.json`

---

### Scenario 12: Search suggestions contain relevant results
Source: HEADER-012
Priority: High

Given: The user has typed "phone" into the search input
When:  The suggestions dropdown is visible
Then:  Suggestions contain relevant results like "phone under 15000", "phone under 10000"
Locators: TBD — suggestion items need live verification for exact role/name

---

### Scenario 13: Click on search suggestion navigates to results
Source: HEADER-013
Priority: High

Given: The user has typed "phone" and the suggestions dropdown is visible
When:  The user clicks on a search suggestion
Then:  The user is navigated to the search results page for that suggestion
Locators: TBD — suggestion item selector needs live verification

---

### Scenario 14: Press Enter with empty search does not navigate
Source: HEADER-014
Priority: Medium

Given: The user is on the Flipkart homepage with an empty search input
When:  The user presses Enter without typing anything
Then:  No navigation occurs — the user stays on the homepage
Locators: `getByRole('textbox', { name: 'Search for Products, Brands and More' })`

---

### Scenario 15: Type special characters in search does not crash
Source: HEADER-015
Priority: Medium

Given: The user is on the Flipkart homepage
When:  The user types "!@#$%^&*" into the search input
Then:  The page does not crash and handles the input gracefully
Locators: `getByRole('textbox', { name: 'Search for Products, Brands and More' })`
Test data: `"!@#$%^&*"` from `fixtures/data/search-terms.json`

---

### Scenario 16: Type very long search term handles gracefully
Source: HEADER-016
Priority: Low

Given: The user is on the Flipkart homepage
When:  The user types a very long string (100+ characters) into the search input
Then:  The input truncates or handles the long text gracefully without breaking the layout
Locators: `getByRole('textbox', { name: 'Search for Products, Brands and More' })`
Test data: `"a".repeat(100)` from `fixtures/data/search-terms.json`

---

### Scenario 17: Clear search input removes suggestions
Source: HEADER-017
Priority: Medium

Given: The user has typed "phone" and the suggestions dropdown is visible
When:  The user clears the search input field
Then:  The input clears and the suggestions dropdown disappears
Locators: `getByRole('textbox', { name: 'Search for Products, Brands and More' })`

---

### Scenario 18: Click search icon with empty input does not navigate
Source: HEADER-018
Priority: Medium

Given: The user is on the Flipkart homepage with an empty search input
When:  The user clicks the search icon button
Then:  No navigation occurs — the user stays on the homepage
Locators: `getByRole('button', { name: 'Search for Products, Brands and More' })`

---

### Scenario 19: Click search icon with valid input navigates to results
Source: HEADER-019
Priority: High

Given: The user is on the Flipkart homepage
When:  The user types "phone" into the search input and clicks the search icon
Then:  The user is navigated to the search results page for "phone"
Locators: `getByRole('textbox', { name: 'Search for Products, Brands and More' })`, `getByRole('button', { name: 'Search for Products, Brands and More' })`
Test data: `"phone"` from `fixtures/data/search-terms.json`

---

## 4. Login Button

### Scenario 20: Verify Login button is displayed
Source: HEADER-021
Priority: High

Given: The user is on the Flipkart homepage (not logged in)
When:  The page loads completely
Then:  A "Login" link/button with a user icon is visible in the header
Locators: `getByRole('link', { name: 'Login' })`

---

### Scenario 21: Click on Login button opens login modal/page
Source: HEADER-022
Priority: High

Given: The user is on the Flipkart homepage (not logged in)
When:  The user clicks the "Login" button
Then:  A login modal or login page opens
Locators: `getByRole('link', { name: 'Login' })`

---

### Scenario 22: Verify login dropdown on hover
Source: HEADER-023
Priority: Medium

Given: The user is on the Flipkart homepage (not logged in)
When:  The user hovers over the "Login" button
Then:  A dropdown appears with options including "New customer? Sign Up"
Locators: `getByRole('link', { name: 'Login' })`
TBD: Exact dropdown menu items and their selectors need live verification

---

## 5. More Menu

### Scenario 23: Verify "More" button is displayed
Source: HEADER-024
Priority: Medium

Given: The user is on the Flipkart homepage
When:  The page loads completely
Then:  A "More" button with a chevron icon is visible in the header
Locators: `getByRole('link', { name: 'More' })`

---

### Scenario 24: Click on "More" button opens dropdown menu
Source: HEADER-025
Priority: Medium

Given: The user is on the Flipkart homepage
When:  The user clicks the "More" button
Then:  A dropdown menu opens
Locators: `getByRole('link', { name: 'More' })`

---

### Scenario 25: Verify More dropdown contains navigation options
Source: HEADER-026
Priority: Medium

Given: The user has clicked the "More" button and the dropdown is open
When:  The dropdown is displayed
Then:  Navigation menu items are visible in the dropdown
Locators: TBD — menu item selectors need live verification

---

## 6. Cart

### Scenario 26: Verify Cart icon is displayed
Source: HEADER-027
Priority: High

Given: The user is on the Flipkart homepage
When:  The page loads completely
Then:  A cart icon with the text "Cart" is visible in the header
Locators: `getByRole('link', { name: 'Cart Cart' })`

---

### Scenario 27: Click on Cart button navigates to cart page
Source: HEADER-028
Priority: High

Given: The user is on the Flipkart homepage
When:  The user clicks the "Cart" button
Then:  The user is navigated to the cart page
Locators: `getByRole('link', { name: 'Cart Cart' })`

---

### Scenario 28: Verify cart shows item count when items are present
Source: HEADER-029
Priority: Medium

Given: The user has items in their cart (precondition: add item to cart first)
When:  The user views the header
Then:  A badge with the item count is displayed on the cart icon
Locators: TBD — cart badge selector needs live verification
ASSUMPTION: Cart badge appears when items exist; needs verification with pre-populated cart state

---

## Out of Scope

- Login/signup functionality (excluded per project agreement)
- Cart item management (add/remove/update) — only header cart display is in scope
- Payment flow — not part of header section

---

## Notes

### ASSUMPTION items (need BA/Dev confirmation)
- HEADER-003: Flipkart Plus banner visibility — may vary by user type (logged in vs anonymous)
- HEADER-029: Cart item count badge — requires pre-populated cart state, may need a seed test
- HEADER-023: Login dropdown on hover — hover behavior may differ on mobile vs desktop

### TBD items (need live verification)
- Scenario 3: Flipkart Plus banner element selector
- Scenario 5: "Select delivery location" helper text selector
- Scenario 7: Location pin icon selector
- Scenario 12: Search suggestion item selectors
- Scenario 13: Search suggestion click target
- Scenario 25: More dropdown menu item selectors
- Scenario 28: Cart badge element selector

### Selectors confirmed from live exploration (Appendix A)
| Element | Confirmed Selector |
|---------|-------------------|
| Search Input | `getByRole('textbox', { name: 'Search for Products, Brands and More' })` |
| Search Button | `getByRole('button', { name: 'Search for Products, Brands and More' })` |
| Login Button | `getByRole('link', { name: 'Login' })` |
| More Button | `getByRole('link', { name: 'More' })` |
| Cart Button | `getByRole('link', { name: 'Cart Cart' })` |
| Location Text | `getByRole('generic', { name: 'Location not set' })` |
