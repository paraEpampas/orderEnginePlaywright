const { BasePage } = require('../../base.page');

class CostsSourcingTabPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.costsSourcingTab = page.locator("div[data-name='Costs & Sourcing']");
    this.costsSourcingComponent = page.locator('app-cost-sourcing');
    this.costsSourcingTable = page.locator("app-cost-sourcing table.p-datatable-table");
    this.downloadOrderLinesButton = page.locator("button:has(mat-icon:has-text('cloud_download'))");
    this.copyOrderIconButton = page.locator("button:has(mat-icon:has-text('file_copy'))");
    this.deliveryTypeDDRadio = page.locator("input[value='DD'], [data-name='deliveryType-DD'], oe-radio-button:has-text('DD') input, label:has-text('DD') input").first();
    this.deliveryTypeBBRadio = page.locator("input[value='BB'], [data-name='deliveryType-BB'], oe-radio-button:has-text('BB') input, label:has-text('BB') input").first();
    this.columnHeaders = page.locator("app-cost-sourcing thead th");
  }
}

module.exports = { CostsSourcingTabPage };
