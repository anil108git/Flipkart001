import { Page, Locator } from '@playwright/test';

export class FlipkartPage {
  readonly page: Page;
  readonly forYouTab: Locator;
  readonly fashionTab: Locator;
  readonly mobilesTab: Locator;
  readonly electronicsTab: Locator;
  readonly beautyTab: Locator;
  readonly homeTab: Locator;
  readonly appliancesTab: Locator;
  readonly toysBabyTab: Locator;
  readonly foodHealthTab: Locator;
  readonly autoAccessoriesTab: Locator;
  readonly sportsFitnessTab: Locator;
  readonly furnitureTab: Locator;
  readonly booksMediaTab: Locator;
  readonly twoWheelersTab: Locator;
  readonly allTabs: Locator;
  readonly navigationContainer: Locator;
  readonly loginPopupCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.forYouTab = page.getByRole('link', { name: 'For You' });
    this.fashionTab = page.getByRole('link', { name: 'Fashion' });
    this.mobilesTab = page.getByRole('link', { name: 'Mobiles' });
    this.electronicsTab = page.getByRole('link', { name: 'Electronics' });
    this.beautyTab = page.getByRole('link', { name: 'Beauty' });
    this.homeTab = page.getByRole('link', { name: 'Home' });
    this.appliancesTab = page.getByRole('link', { name: 'Appliances' });
    this.toysBabyTab = page.getByRole('link', { name: 'Toys, baby..' });
    this.foodHealthTab = page.getByRole('link', { name: 'Food & Health' });
    this.autoAccessoriesTab = page.getByRole('link', { name: 'Auto Accessories' });
    this.sportsFitnessTab = page.getByRole('link', { name: 'Sports & Fitness' });
    this.furnitureTab = page.getByRole('link', { name: 'Furniture' });
    this.booksMediaTab = page.getByRole('link', { name: 'Books & Media' });
    this.twoWheelersTab = page.getByRole('link', { name: '2 Wheelers' });
    this.navigationContainer = page.locator('div.r-150rngu').filter({ has: page.getByRole('link', { name: 'For You' }) });
    this.allTabs = this.navigationContainer.getByRole('link').filter({ hasText: /For You|Fashion|Mobiles|Electronics|Beauty|Home|Appliances|Toys, baby\.\.|Food & Health|Auto Accessories|Sports & Fitness|Furniture|Books & Media|2 Wheelers/ });
    this.loginPopupCloseButton = page
      .getByRole('button', { name: /close|✕|×/i })
      .or(page.locator('button[aria-label="Close"]'))
      .or(page.locator('button[title="Close"]'))
      .or(page.locator('button[class*="popup"] [class*="close"]'))
      .first();
  }

  async goto() {
    await this.page.goto('https://www.flipkart.com/');
    await this.dismissLoginPopupIfVisible();
  }

  async dismissLoginPopupIfVisible() {
    const closeButton = this.loginPopupCloseButton;
    const isVisible = await closeButton.isVisible().catch(() => false);
    if (isVisible) {
      await closeButton.click({ timeout: 5000 }).catch(() => {});
    }
  }

  async clickTab(tabName: string) {
    const tabMap: Record<string, Locator> = {
      'For You': this.forYouTab,
      'Fashion': this.fashionTab,
      'Mobiles': this.mobilesTab,
      'Electronics': this.electronicsTab,
      'Beauty': this.beautyTab,
      'Home': this.homeTab,
      'Appliances': this.appliancesTab,
      'Toys, baby..': this.toysBabyTab,
      'Food & Health': this.foodHealthTab,
      'Auto Accessories': this.autoAccessoriesTab,
      'Sports & Fitness': this.sportsFitnessTab,
      'Furniture': this.furnitureTab,
      'Books & Media': this.booksMediaTab,
      '2 Wheelers': this.twoWheelersTab,
    };
    await tabMap[tabName].click();
    // Dismiss login popup if it appears after clicking
    await this.dismissLoginPopupIfVisible();
  }

  async isTabVisible(tabName: string): Promise<boolean> {
    const tabMap: Record<string, Locator> = {
      'For You': this.forYouTab,
      'Fashion': this.fashionTab,
      'Mobiles': this.mobilesTab,
      'Electronics': this.electronicsTab,
      'Beauty': this.beautyTab,
      'Home': this.homeTab,
      'Appliances': this.appliancesTab,
      'Toys, baby..': this.toysBabyTab,
      'Food & Health': this.foodHealthTab,
      'Auto Accessories': this.autoAccessoriesTab,
      'Sports & Fitness': this.sportsFitnessTab,
      'Furniture': this.furnitureTab,
      'Books & Media': this.booksMediaTab,
      '2 Wheelers': this.twoWheelersTab,
    };
    return tabMap[tabName].isVisible();
  }

  async getTabCount(): Promise<number> {
    return this.allTabs.count();
  }
  
  async waitForNavTabs() {
    await this.navigationContainer.waitFor({ state: 'visible' });
    await this.allTabs.first().waitFor({ state: 'visible' });
  }
  
  async isTabActive(tabName: string): Promise<boolean> {
    const tabMap: Record<string, Locator> = {
      'For You': this.forYouTab,
      'Fashion': this.fashionTab,
      'Mobiles': this.mobilesTab,
      'Electronics': this.electronicsTab,
      'Beauty': this.beautyTab,
      'Home': this.homeTab,
      'Appliances': this.appliancesTab,
      'Toys, baby..': this.toysBabyTab,
      'Food & Health': this.foodHealthTab,
      'Auto Accessories': this.autoAccessoriesTab,
      'Sports & Fitness': this.sportsFitnessTab,
      'Furniture': this.furnitureTab,
      'Books & Media': this.booksMediaTab,
      '2 Wheelers': this.twoWheelersTab,
    };
    const tab = tabMap[tabName];
    // Check for aria-current="page" or active class
    const ariaCurrent = await tab.getAttribute('aria-current');
    const className = await tab.getAttribute('class');
    if (ariaCurrent === 'page' || (className?.includes('active') ?? false)) {
      return true;
    }
    // Check for bold font family (Flipkart uses inter_bold for active tabs)
    const textDiv = tab.locator('[class*="css-146c3p1"]').first();
    const style = await textDiv.getAttribute('style');
    return style?.includes('font-family:inter_bold') ?? false;
  }
  
  async getTabLabel(tabName: string): Promise<string | null> {
    const tabMap: Record<string, Locator> = {
      'For You': this.forYouTab,
      'Fashion': this.fashionTab,
      'Mobiles': this.mobilesTab,
      'Electronics': this.electronicsTab,
      'Beauty': this.beautyTab,
      'Home': this.homeTab,
      'Appliances': this.appliancesTab,
      'Toys, baby..': this.toysBabyTab,
      'Food & Health': this.foodHealthTab,
      'Auto Accessories': this.autoAccessoriesTab,
      'Sports & Fitness': this.sportsFitnessTab,
      'Furniture': this.furnitureTab,
      'Books & Media': this.booksMediaTab,
      '2 Wheelers': this.twoWheelersTab,
    };
    return tabMap[tabName].textContent();
  }
  
  async getAllTabLabels(): Promise<string[]> {
    return this.allTabs.allTextContents();
  }
}
