const { BasePage } = require('../../base.page');

class QuickAddTabPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.quickAddPricingTab = page.locator("div[data-name='Quick add / pricing']");
    this.appBasicPricing = page.locator('app-basic-pricing');
    this.quickAddReferenceTextarea = page.locator("textarea[placeholder='Quick Add Reference']");
    this.ccPartButton = page.locator("button:has-text('CC PART')");
    this.suppPartButton = page.locator("button:has-text('SUPP PART')");
    this.mfrPartButton = page.locator("button:has-text('MFR PART')");
    this.descButton = page.locator("button:has-text('DESC')");
    this.includeZormsCheckbox = page.locator("oe-checkbox[formcontrolname='includeZorms']");
    this.pricingTable = page.locator('app-basic-pricing p-table').first();
    this.tableElement = page.locator("table[id$='-table']");
    this.factCheckButton = page.locator("button:has(mat-icon:has-text('fact_check'))");
    this.saveAltButton = page.locator("button:has(mat-icon:has-text('save_alt'))");
    this.recalcButton = page.locator("button:has-text('RECALC')");
    this.copyOrderButton = page.locator("button:has(mat-icon:has-text('file_copy'))");
    this.successMessage = page.locator("div.success-section:has-text('The order is valid')");
    this.unitSellPriceInputs = page.locator("tbody tr[formarrayname='basicPrice'] td:nth-child(12) input, input[data-name*='unitSalesPrice'], input[formcontrolname*='unitSalesPrice']");
    this.tableRows = page.locator("tbody tr[formarrayname='basicPrice']");

    this.addTextLineButton = page.locator("button:has-text('ADD TEXT LINE')");
    this.textLineColumn = page.locator("th:has-text('Text Line'), td[data-name*='textLine']");
    this.deleteButton = page.locator("button:has-text('DELETE LINES'), button:has(mat-icon:has-text('delete'))");
    this.columnHeaders = page.locator("thead th");
  }
}

module.exports = { QuickAddTabPage };
