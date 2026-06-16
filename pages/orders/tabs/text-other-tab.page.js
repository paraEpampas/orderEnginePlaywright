const { BasePage } = require('../../base.page');

class TextOtherTabPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.textOtherTab = page.locator("div[data-name='Text/Other']");
    this.textOtherComponent = page.locator('app-text-other');
    this.textOtherTable = page.locator("app-text-other table");
  }
}

module.exports = { TextOtherTabPage };
