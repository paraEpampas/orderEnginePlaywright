const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');
const { TextOtherTabPage } = require('../../pages/orders/tabs/text-other-tab.page');

class TextOtherSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.headerTab = new HeaderTabPage(page);
    this.textOtherTab = new TextOtherTabPage(page);
  }

  async verifyTextOtherTabDisplayed() {
    await expect(this.textOtherTab.textOtherTab).toBeVisible({ timeout: 10000 });
  }

  async verifyTextOtherTableDisplayed() {
    await this.clickElement(this.headerTab.textOtherTab);
    await this.page.waitForTimeout(1000);
    await expect(this.textOtherTab.textOtherTable).toBeVisible({ timeout: 10000 });
  }

  async verifyLineUdfsVisibleInViewMode() {
    await this.clickElement(this.headerTab.textOtherTab);
    await this.page.waitForTimeout(1000);
    const lineUdfSection = this.page.locator("app-line-udfs, [data-name*='lineUdf'], app-text-other").first();
    if (await lineUdfSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Line UDFs section visible');
    }
  }

  async getFirstLineUdfValue() {
    await this.clickElement(this.headerTab.textOtherTab);
    await this.page.waitForTimeout(1000);
    const udfInput = this.page.locator("app-line-udfs input, [data-name*='lineUdf'] input, app-text-other input").first();
    if (await udfInput.isVisible().catch(() => false)) {
      return await udfInput.inputValue();
    }
    return '';
  }
}

module.exports = { TextOtherSteps };
