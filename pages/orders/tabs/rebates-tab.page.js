const { BasePage } = require('../../base.page');

class RebatesTabPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.rebatesTab = page.locator("div[data-name='Rebates']");
    this.rebatesComponent = page.locator('app-rebates');
    this.rebatesTable = page.locator("app-rebates table");
  }
}

module.exports = { RebatesTabPage };
