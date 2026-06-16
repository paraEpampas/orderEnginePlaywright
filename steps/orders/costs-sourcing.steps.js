const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');
const { CostsSourcingTabPage } = require('../../pages/orders/tabs/costs-sourcing-tab.page');

class CostsSourcingSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.headerTab = new HeaderTabPage(page);
    this.costsSourcingTab = new CostsSourcingTabPage(page);
  }

  async verifyCostsSourcingTabDisplayed() {
    await expect(this.costsSourcingTab.costsSourcingTab).toBeVisible({ timeout: 10000 });
  }

  async verifyCostsSourcingTableDisplayed() {
    await this.clickElement(this.headerTab.costsSourcingTab);
    await this.page.waitForTimeout(1000);
    await expect(this.costsSourcingTab.costsSourcingTable).toBeVisible({ timeout: 10000 });
  }

  async verifyColumnsDisplayed() {
    const columns = this.costsSourcingTab.columnHeaders;
    await expect(columns.first()).toBeVisible();
    expect(await columns.count()).toBeGreaterThan(0);
  }

  async verifyDeliveryTypeOptions() {
    const ddVisible = await this.costsSourcingTab.deliveryTypeDDRadio.isVisible({ timeout: 5000 }).catch(() => false);
    const bbVisible = await this.costsSourcingTab.deliveryTypeBBRadio.isVisible({ timeout: 3000 }).catch(() => false);
    if (!ddVisible && !bbVisible) {
      const noRecords = await this.page.locator('app-cost-sourcing').textContent().catch(() => '');
      if (noRecords.toLowerCase().includes('no records')) {
        console.log('Delivery type options not visible - no records in Costs & Sourcing tab (view mode)');
        return;
      }
    }
    expect(ddVisible || bbVisible, 'At least one delivery type option should be visible').toBeTruthy();
  }

  async clickDownloadOrderLines() {
    await this.clickElement(this.costsSourcingTab.downloadOrderLinesButton);
  }

  async verifyCopyOrderButton() {
    await expect(this.costsSourcingTab.copyOrderIconButton).toBeVisible();
  }

  async navigateToCostsSourcingTab() {
    await this.waitForLoader();
    const tab = this.headerTab.costsSourcingTab;
    await tab.waitFor({ state: 'visible', timeout: 15000 });
    await tab.scrollIntoViewIfNeeded().catch(() => {});
    await tab.click({ force: true });
    await this.page.waitForTimeout(1000);
    await this.waitForLoader();
  }

  async selectDeliveryType(type) {
    const radio = type === 'DD' ? this.costsSourcingTab.deliveryTypeDDRadio : this.costsSourcingTab.deliveryTypeBBRadio;
    if (await radio.isVisible({ timeout: 5000 }).catch(() => false)) {
      await radio.click();
      await this.page.waitForTimeout(500);
    }
  }

  async verifyDeliveryTypeInViewMode(expectedType) {
    const radio = expectedType === 'DD' ? this.costsSourcingTab.deliveryTypeDDRadio : this.costsSourcingTab.deliveryTypeBBRadio;
    const isVisible = await radio.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      const isChecked = await radio.isChecked().catch(() => false);
      const { expect } = require('@playwright/test');
      expect(isChecked, `Delivery type ${expectedType} radio should be checked`).toBeTruthy();
    } else {
      const text = await this.page.locator('app-cost-sourcing').textContent().catch(() => '');
      const hasType = text.toUpperCase().includes(expectedType.toUpperCase());
      const { expect } = require('@playwright/test');
      expect(hasType, `Delivery type ${expectedType} should be visible in view mode`).toBeTruthy();
    }
  }
}

module.exports = { CostsSourcingSteps };
