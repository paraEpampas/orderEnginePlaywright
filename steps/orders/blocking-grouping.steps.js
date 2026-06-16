const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');
const { BlockingGroupingTabPage } = require('../../pages/orders/tabs/blocking-grouping-tab.page');

class BlockingGroupingSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.headerTab = new HeaderTabPage(page);
    this.blockingGroupingTab = new BlockingGroupingTabPage(page);
  }

  async verifyBlockingGroupingTabDisplayed() {
    await expect(this.blockingGroupingTab.blockingGroupingTab).toBeVisible({ timeout: 10000 });
  }

  async verifyBlockingGroupingTableDisplayed() {
    await this.clickElement(this.headerTab.blockingGroupingTab);
    await this.page.waitForTimeout(1000);
    await expect(this.blockingGroupingTab.blockingGroupingTable).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { BlockingGroupingSteps };
