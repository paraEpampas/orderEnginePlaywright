const { BasePage } = require('../base.page');

class ProductsSearchPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.productsTab = page.locator("div[data-name='header.products']");
    this.productsSearchContainer = page.locator('app-product-search, app-products');
    this.ccCompanyField = page.locator("ng-select[formcontrolname='ccCompany'], oe-select[formcontrolname='ccCompany'], select[formcontrolname='ccCompany'], [formcontrolname='ccCompany']").first()
      .or(page.getByRole('combobox').first());
    this.itemDescriptionField = page.locator("input[formcontrolname='itemDescription'], input[name='Item Description'], input[placeholder*='description']").first()
      .or(page.getByRole('textbox').nth(1));
    this.searchButton = page.locator("button:has-text('SEARCH'), button[type='submit']").first();
    this.clearButton = page.locator("button:has-text('CLEAR'), button:has-text('Clear')").first();
    this.resultsTable = page.locator("table[id$='-table'], p-table table, app-product-search table, table").first();
    this.resultRows = page.locator("tbody tr:not(:has-text('Please enter search criteria'))");
    this.errorMessage = page.locator("div.error-section, div.alert-danger, p.error, td:has-text('Please enter search criteria'), cell:has-text('Please enter search criteria')").first();
    this.productDetailSections = page.locator("app-product-detail, div.product-detail");
  }
}

module.exports = { ProductsSearchPage };
