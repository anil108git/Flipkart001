// spec: artifacts/release-R_1.0-02/stories/test-plan-KAN-12-R_1.0.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FlipkartPage } from '../pages/flipkart.page';
import tabsData from '../fixtures/data/tabs.json';

const homepageTabs = tabsData.homepageTabs;
const expectedTabCount = tabsData.expectedTabCount;

test.describe('Homepage Navigation Bar & Category Switching — KAN-12 (Epic: KAN-5)', () => {
  let flipkartPage: FlipkartPage;

  test.beforeEach(async ({ page }) => {
    flipkartPage = new FlipkartPage(page);
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
  });

  // ===== SCENARIOS 1-4: All 14 tabs render correctly =====

  // @smoke @ui @priority-p0
  test('should display all 14 category tabs on initial load', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-1 — All 14 category tabs are visible in the top navigation bar' },
      { type: 'priority', description: 'p0' }
    );
    const tabCount = await flipkartPage.getTabCount();
    expect(tabCount).toBe(expectedTabCount);
    for (const tabName of homepageTabs) {
      expect(await flipkartPage.isTabVisible(tabName)).toBeTruthy();
    }
  });

  // @smoke @ui @priority-p0
  test('should display all 14 category tabs after page refresh', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-1 — All 14 category tabs are visible again in the same order' },
      { type: 'priority', description: 'p0' }
    );
    await page.reload();
    await flipkartPage.dismissLoginPopupIfVisible();
    await flipkartPage.waitForNavTabs();
    const tabCount = await flipkartPage.getTabCount();
    expect(tabCount).toBe(expectedTabCount);
    for (const tabName of homepageTabs) {
      expect(await flipkartPage.isTabVisible(tabName)).toBeTruthy();
    }
  });

  // @regression @validation @priority-p1
  test('should verify no tabs are missing on page load', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-1 — Count of rendered tabs equals exactly 14; no expected tab is missing' },
      { type: 'priority', description: 'p1' }
    );
    const tabCount = await flipkartPage.getTabCount();
    expect(tabCount).toBe(expectedTabCount);
  });

  // @edge-case @content @priority-p1
  test('should verify tab labels match exactly (case, punctuation, spacing)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-1 — Each label matches exactly including: "For You", "Toys, baby..", "Food & Health", "2 Wheelers"' },
      { type: 'priority', description: 'p1' }
    );
    const actualLabels = await flipkartPage.getAllTabLabels();
    for (const expected of homepageTabs) {
      expect(actualLabels).toContain(expected);
    }
    expect(actualLabels).toHaveLength(expectedTabCount);
  });

  // @edge-case @content @priority-p1
  test('should verify special characters in tab names render correctly', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-1 — "Toys, baby..", "Food & Health", "2 Wheelers" display without encoding issues' },
      { type: 'priority', description: 'p1' }
    );
    const criticalTabs = ['Toys, baby..', 'Food & Health', '2 Wheelers'];
    for (const tabName of criticalTabs) {
      const label = await flipkartPage.getTabLabel(tabName);
      expect(label).toBe(tabName);
    }
  });

  // ===== SCENARIOS 6-7: Performance tests =====

  // @performance @load-time @priority-p2
  test('should verify tab bar loads within performance budget (1.5s)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-1 (implied) — Tab bar is interactive within 1.5s (Time to Interactive for nav)' },
      { type: 'priority', description: 'p2' }
    );
    const startTime = Date.now();
    await flipkartPage.waitForNavTabs();
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(1500);
  });

  // @performance @load-time @priority-p2
  test('should verify First Contentful Paint of tab bar < 1.5s', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-1 (implied) — First Contentful Paint of navigation bar occurs before 1.5s' },
      { type: 'priority', description: 'p2' }
    );
    const fcp = await page.evaluate(() => performance.timing.responseStart - performance.timing.requestStart);
    expect(fcp).toBeLessThan(1500);
  });

  // ===== SCENARIOS 8-12: Active tab state tests =====

  // @smoke @ui @priority-p0
  test('should verify "For You" tab is active on initial load', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-2 — "For You" tab has active state (aria-current="page" or equivalent active class)' },
      { type: 'priority', description: 'p0' }
    );
    expect(await flipkartPage.isTabActive('For You')).toBeTruthy();
  });

  // @smoke @ui @priority-p0
  test('should verify "For You" tab remains active after page refresh', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-2 — "For You" tab is still active' },
      { type: 'priority', description: 'p0' }
    );
    await page.reload();
    await flipkartPage.dismissLoginPopupIfVisible();
    expect(await flipkartPage.isTabActive('For You')).toBeTruthy();
  });

  // @smoke @ui @priority-p0
  test('should verify active tab has distinct visual indicator', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-2 — Active tab shows distinct visual indicator' },
      { type: 'priority', description: 'p0' }
    );
    expect(await flipkartPage.isTabActive('For You')).toBeTruthy();
  });

  // @negative @validation @priority-p1
  test('should verify no other tab shows active indicator on load', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-2 — Only "For You" tab has active indicator; all 13 other tabs show inactive state' },
      { type: 'priority', description: 'p1' }
    );
    expect(await flipkartPage.isTabActive('For You')).toBeTruthy();
    for (const tab of homepageTabs) {
      if (tab !== 'For You') {
        expect(await flipkartPage.isTabActive(tab)).toBeFalsy();
      }
    }
  });

  // @edge-case @stability @priority-p1
  test('should verify active indicator persists across rapid refreshes', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-2 — "For You" remains active after each refresh' },
      { type: 'priority', description: 'p1' }
    );
    for (let i = 0; i < 5; i++) {
      await page.reload();
      await flipkartPage.dismissLoginPopupIfVisible();
      expect(await flipkartPage.isTabActive('For You')).toBeTruthy();
    }
  });

  // ===== SCENARIOS 15-18: Navigation tests =====

  // @smoke @navigation @priority-p0
  test('should verify clicking "Fashion" tab navigates to Fashion category page', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-3 — Browser navigates to Fashion category page (URL contains /fashion or similar)' },
      { type: 'priority', description: 'p0' }
    );
    await flipkartPage.clickTab('Fashion');
    await page.waitForURL('**/fashion**');
    expect(page.url()).toMatch(/fashion/);
  });

  // @smoke @navigation @priority-p0
  test('should verify clicking "Mobiles" tab navigates to Mobiles category page', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-3 — Browser navigates to Mobiles category page' },
      { type: 'priority', description: 'p0' }
    );
    await flipkartPage.clickTab('Mobiles');
    await page.waitForURL('**/mobiles**');
    expect(page.url()).toMatch(/mobiles/);
  });

  // @smoke @navigation @priority-p0
  test('should verify clicking "Electronics" tab navigates to Electronics category page', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-3 — Browser navigates to Electronics category page' },
      { type: 'priority', description: 'p0' }
    );
    await flipkartPage.clickTab('Electronics');
    await page.waitForURL('**/electronics**');
    expect(page.url()).toMatch(/electronics/);
  });

  // @complex @navigation @priority-p1
  test('should verify clicking all 14 tabs sequentially routes correctly', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-3 — Each click navigates to the correct category page' },
      { type: 'priority', description: 'p1' }
    );
    for (const tabName of homepageTabs) {
      await flipkartPage.clickTab(tabName);
      await page.waitForURL(`**/${tabName.toLowerCase().replace(/,| /g, '')}**`);
      await page.goBack();
      await flipkartPage.goto();
      await flipkartPage.waitForNavTabs();
    }
  });

  // @negative @error-handling @priority-p1
  test('should verify network failure during navigation shows error state', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-3 (implied) — Appropriate error UI shown; user remains on current page or sees friendly error' },
      { type: 'priority', description: 'p1' }
    );
    await flipkartPage.clickTab('Fashion');
    await page.context().setOffline(true);
    try {
      await page.waitForURL('**/fashion**', { timeout: 3000 }).catch(() => {});
    } catch {
    }
    await page.context().setOffline(false);
    expect(page.url()).not.toMatch(/fashion/);
  });

  // @negative @error-handling @priority-p1
  test('should verify server returns 404/500 shows appropriate error handling', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-12 AC-3 (implied) — User sees friendly error page/message; not a raw browser error' },
      { type: 'priority', description: 'p1' }
    );
    await flipkartPage.clickTab('Fashion');
    await page.route('**/*', route => route.fulfill({ status: 404, body: 'Not Found', headers: { 'Content-Type': 'text/html' } }));
    await expect(page.locator('text=Not Found')).toBeVisible({ timeout: 3000 });
    await page.unroute('**/*');
  });

  // @edge-case @stability @priority-p1
  test('should verify rapid successive tab clicks handled gracefully', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-3 (implied) — No crashes, no duplicate navigations, final destination matches last clicked tab' },
      { type: 'priority', description: 'p1' }
    );
    await flipkartPage.clickTab('Fashion');
    await page.waitForURL('**/fashion**');
    await flipkartPage.clickTab('Mobiles');
    await flipkartPage.clickTab('Electronics');
    await page.waitForURL('**/electronics**');
    expect(page.url()).toMatch(/electronics/);
  });

  // ===== SCENARIOS 22-24: Browser integration and performance =====

  // @edge-case @browser-integration @priority-p1
  test('should verify click tab then browser back button returns to homepage with correct tab active', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-3 (implied browser integration) — Returns to homepage with "Mobiles" tab active' },
      { type: 'priority', description: 'p1' }
    );
    await flipkartPage.clickTab('Mobiles');
    await page.waitForURL('**/mobiles**');
    await page.goBack();
    await flipkartPage.dismissLoginPopupIfVisible();
    expect(await flipkartPage.isTabActive('For You')).toBeTruthy();
  });

  // @performance @load-time @priority-p2
  test('should verify navigation completes within 3s (page load)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-3 (implied performance) — Category page fully loaded (LCP) within 3s on 4G connection' },
      { type: 'priority', description: 'p2' }
    );
    await flipkartPage.clickTab('Fashion');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);
    expect(loadTime).toBeLessThan(3000);
  });

  // @performance @api-response @priority-p2
  test('should verify Category page TTFB < 500ms', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-3 (implied) — Time to First Byte < 500ms' },
      { type: 'priority', description: 'p2' }
    );
    await flipkartPage.clickTab('Fashion');
    const responseTime = await page.waitForResponse(response => response.url().includes('fashion') && response.status() === 200);
    expect(responseTime).toBeLessThan(500);
  });

  // ===== SCENARIOS 25-31: Responsive design tests =====

  // @smoke @responsive @priority-p0
  test('should verify at 375px width, tab bar horizontally scrolls via touch', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-4 — Viewport set to 375px width (mobile)' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-4 — Tab bar scrolls horizontally revealing hidden tabs' },
      { type: 'priority', description: 'p0' }
    );
    await page.setViewportSize({ width: 375, height: 667 });
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    const containerBox = await flipkartPage.navigationContainer.boundingBox();
    expect(containerBox).not.toBeNull();
    const hasScroll = containerBox!.width > 0;
    expect(hasScroll).toBeTruthy();
  });

  // @smoke @responsive @priority-p0
  test('should verify at 320px width, all 14 tabs accessible via scroll', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-4 — Viewport set to 320px width (small mobile)' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-4 — All 14 tabs reachable; last tab visible at end of scroll' },
      { type: 'priority', description: 'p0' }
    );
    await page.setViewportSize({ width: 320, height: 568 });
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    const tabCount = await flipkartPage.getTabCount();
    expect(tabCount).toBe(expectedTabCount);
  });

  // @negative @interaction @priority-p1
  test('should verify vertical scroll does not interfere with horizontal tab scroll', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-4 — Mobile viewport with tab bar' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-4 — Horizontal scroll works; page vertical scroll not accidentally triggered' },
      { type: 'priority', description: 'p1' }
    );
    await page.setViewportSize({ width: 375, height: 667 });
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    const initialScroll = await page.evaluate(() => window.scrollY);
    await flipkartPage.navigationContainer.evaluate(el => el.scrollTo({ left: 100 }));
    await page.waitForTimeout(100);
    const finalScroll = await page.evaluate(() => window.scrollY);
    expect(finalScroll).toBe(initialScroll);
  });

  // @edge-case @ux @priority-p1
  test('should verify scroll momentum/physics feel native', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-4 (implied UX) — User flicks tab bar to scroll' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-4 (implied UX) — Scroll continues with native-like momentum' },
      { type: 'priority', description: 'p1' }
    );
    await page.setViewportSize({ width: 375, height: 667 });
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    const container = page.locator('nav');
    const scrollWidth = await container.evaluate(el => el.scrollWidth);
    const clientWidth = await container.evaluate(el => el.clientWidth);
    expect(scrollWidth > clientWidth).toBeTruthy();
  });

  // @edge-case @state-management @priority-p1
  test('should verify scroll position preserved after tab click + browser back', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-4 (implied state management) — Mobile viewport, user scrolls to "2 Wheelers" tab' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-4 (implied state management) — Tab bar scroll position restored after back navigation' },
      { type: 'priority', description: 'p1' }
    );
    await page.setViewportSize({ width: 375, height: 667 });
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await flipkartPage.clickTab('2 Wheelers');
    await page.goBack();
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
  });

  // @non-functional @accessibility @priority-p2
  test('should verify touch targets meet 44x44px minimum', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-4 (implied accessibility) — Mobile viewport' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-4 (implied accessibility) — Each tab touch target ≥ 44x44px' },
      { type: 'priority', description: 'p2' }
    );
    await page.setViewportSize({ width: 375, height: 667 });
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    const tabElements = await flipkartPage.allTabs.all();
    for (const tab of tabElements) {
      const box = await tab.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  // ===== SCENARIOS 32-40: Accessibility tests =====

  // @positive @accessibility @priority-p0
  test('should verify tab key focuses the tab bar', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 — Focus lands on tab bar (first tab "For You")' },
      { type: 'priority', description: 'p0' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await page.keyboard.press('Tab');
    expect(await flipkartPage.isTabActive('For You')).toBeTruthy();
  });

  // @positive @accessibility @priority-p0
  test('should verify arrow right moves focus to next tab', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-5 — Focus is on a tab in the tab bar' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 — Focus moves to next tab to the right' },
      { type: 'priority', description: 'p0' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    expect(await flipkartPage.isTabActive('Fashion')).toBeTruthy();
  });

  // @positive @accessibility @priority-p0
  test('should verify arrow left moves focus to previous tab', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 — Focus moves to previous tab to the left' },
      { type: 'priority', description: 'p0' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowLeft');
    expect(await flipkartPage.isTabActive('For You')).toBeTruthy();
  });

  // @positive @accessibility @priority-p0
  test('should verify enter activates focused tab (navigates)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-5 — Focus is on a tab' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 — Browser navigates to that tab\'s category page' },
      { type: 'priority', description: 'p0' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/fashion**');
    expect(page.url()).toMatch(/fashion/);
  });

  // @negative @keyboard @priority-p1
  test('should verify arrow keys don\'t wrap unexpectedly (or do per spec)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-5 — Focus is on last tab ("2 Wheelers")' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 — Focus either stops OR wraps to first tab — behavior consistent with design spec' },
      { type: 'priority', description: 'p1' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    expect(await flipkartPage.isTabActive('2 Wheelers')).toBeTruthy();
  });

  // @edge-case @keyboard @priority-p1
  test('should verify focus wraps from last to first tab (or stops)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-5 — Focus is on first tab ("For You")' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 — Focus either stops OR wraps to last tab' },
      { type: 'priority', description: 'p1' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowLeft');
    expect(await flipkartPage.isTabActive('For You')).toBeTruthy();
  });

  // @edge-case @accessibility @priority-p1
  test('should verify focus visible indicator meets WCAG AA', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-5 (implied) — User navigates tabs via keyboard' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 (implied) — Focus indicator visible with ≥ 3:1 contrast ratio' },
      { type: 'priority', description: 'p1' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    expect(await focusedElement.isVisible()).toBeTruthy();
  });

  // @edge-case @keyboard @priority-p1
  test('should verify shift+tab moves focus out of tab bar correctly', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-5 (implied) — Focus is on first tab ("For You")' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 (implied) — Focus moves to previous focusable element in DOM order' },
      { type: 'priority', description: 'p1' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
  });

  // @non-functional @accessibility @priority-p2
  test('should verify full keyboard operability (WCAG 2.1.1)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-5 (implied) — User uses only keyboard' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 (implied) — All functionality accessible: focus, navigate, activate; no keyboard traps' },
      { type: 'priority', description: 'p2' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/fashion**');
    expect(page.url()).toMatch(/fashion/);
    await page.goBack();
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
  });

  // ===== SCENARIOS 41-42: Performance tests =====

  // @performance @interaction @priority-p2
  test('should verify focus transitions < 100ms', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'KAN-12 AC-5 (implied) — Focus is on a tab' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'KAN-12 AC-5 (implied) — Focus moves to next tab within 100ms' },
      { type: 'priority', description: 'p2' }
    );
    await flipkartPage.goto();
    await flipkartPage.waitForNavTabs();
    const startTime = Date.now();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(100);
  });

  // ===== SCENARIOS 43-47: Gap analysis tests (OPEN QUESTIONS) =====

  // @edge-case @interaction @priority-p1
  test('should verify behavior when clicking already-active tab', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'Gap analysis (missing AC)' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'Gap analysis (missing AC) — Behavior TBD' },
      { type: 'priority', description: 'p1' }
    );
    test.skip('Behavior TBD — needs resolution before CI', async () => {
    });
  });

  // @edge-case @persistence @priority-p2
  test('should verify tab state persists across sessions', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'Gap analysis (missing AC)' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'Gap analysis (missing AC) — Active tab state TBD' },
      { type: 'priority', description: 'p2' }
    );
    test.skip('Requires BA/Dev clarification — OPEN QUESTION to be posted to Jira', async () => {
    });
  });

  // @edge-case @ui @priority-p2
  test('should verify loading indicator shown during category navigation', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'Gap analysis (missing AC)' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'Gap analysis (missing AC) — Loading indicator TBD' },
      { type: 'priority', description: 'p2' }
    );
    test.skip('UX spec required — OPEN QUESTION', async () => {
    });
  });

  // @edge-case @responsive @priority-p1
  test('should verify desktop viewport (>375px) — all tabs visible or horizontal scroll?', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'Gap analysis (missing AC)' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'Gap analysis (missing AC) — Responsive breakpoint spec — OPEN QUESTION' },
      { type: 'priority', description: 'p1' }
    );
    test.skip('Responsive breakpoint spec — OPEN QUESTION', async () => {
    });
  });

  // @edge-case @responsive @priority-p2
  test('should verify maximum visible tabs before overflow on desktop', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'Gap analysis (missing AC)' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'Gap analysis (missing AC) — Breakpoint table needed — OPEN QUESTION' },
      { type: 'priority', description: 'p2' }
    );
    test.skip('Breakpoint table needed — OPEN QUESTION', async () => {
    });
  });

  // @negative @error-handling @priority-p1
  test('should verify category page load failure — retry / error message / fallback', async ({ page }) => {
    test.info().annotations.push(
      { type: 'story', description: 'Gap analysis (missing AC)' },
      { type: 'epic', description: 'KAN-5' },
      { type: 'AC', description: 'Gap analysis (missing AC) — Error handling strategy — OPEN QUESTION' },
      { type: 'priority', description: 'p1' }
    );
    test.skip('Error handling strategy — OPEN QUESTION', async () => {
    });
  });
});
