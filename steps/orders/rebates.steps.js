const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');
const { RebatesTabPage } = require('../../pages/orders/tabs/rebates-tab.page');

class RebatesSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.headerTab = new HeaderTabPage(page);
    this.rebatesTab = new RebatesTabPage(page);
  }

  async verifyRebatesTabDisplayed() {
    await expect(this.rebatesTab.rebatesTab).toBeVisible({ timeout: 10000 });
  }

  async verifyRebatesTableDisplayed() {
    await this.clickElement(this.headerTab.rebatesTab);
    await this.page.waitForTimeout(1000);
    await expect(this.rebatesTab.rebatesTable).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { RebatesSteps };
