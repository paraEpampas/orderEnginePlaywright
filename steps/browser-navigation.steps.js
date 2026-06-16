const { expect } = require('@playwright/test');
const { BaseSteps } = require('./base.steps');

class BrowserNavigationSteps extends BaseSteps {
  constructor(page) {
    super(page);
  }

  async verifyBrowserOpens() {
    expect(this.page).toBeDefined();
    await expect(this.page).not.toBeNull();
  }

  async verifyPageLoads() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }
}

module.exports = { BrowserNavigationSteps };
