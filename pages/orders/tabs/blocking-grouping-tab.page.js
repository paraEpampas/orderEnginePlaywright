const { BasePage } = require('../../base.page');

class BlockingGroupingTabPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.blockingGroupingTab = page.locator("div[data-name='Blocking & Grouping']");
    this.blockingGroupingComponent = page.locator('app-blocking-grouping');
    this.blockingGroupingTable = page.locator("app-blocking-grouping table");
  }
}

module.exports = { BlockingGroupingTabPage };
