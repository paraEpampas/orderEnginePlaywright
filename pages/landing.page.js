const { BasePage } = require('./base.page');
const { COUNTRIES } = require('../data/constants/country-config');

class LandingPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.ordersSearchContainer = page.locator('app-orders-search');
    this.searchContainer = page.locator('app-search-container');
    this.searchTitle = page.locator("div.title div:has-text('Search For Orders')");
    this.hideSearchFieldsToggle = page.locator('oe-slide-toggle');
    this.createOrderButton = page.locator("button.btn-primary.btn-round-corner.btn-header");
    this.soldToAccountInput = page.locator("input[name='Sold-to Account Number']");
    this.referenceInput = page.locator("input[name='Reference'], input[placeholder*='Reference'], input[formcontrolname*='reference' i]").first();
    this.searchButton = page.locator("button:has-text('SEARCH'), input[type='submit']").first();
    this.ordersTable = page.locator("table[id$='-table']");
    this.orderRows = page.locator("tbody tr.ng-star-inserted");
    this.ccCompanyDropdown = page.locator("ng-select[formcontrolname='ccCompany']");
    this.ordersNavItem = page.locator("div[data-name='header.orders']");
    this.productsNavItem = page.locator("div[data-name='header.products']");
    this.clearFieldsButton = page.locator("button:has-text('CLEAR')");

    this.ccCompanyOptions = {
      UK: page.locator(`.ng-option:has-text("${COUNTRIES.UK.countryName}"), .ng-option:has-text("UK")`).first(),
      US: page.locator(`.ng-option:has-text("${COUNTRIES.US.countryName}"), .ng-option:has-text("US")`).first(),
      DE: page.locator(`.ng-option:has-text("${COUNTRIES.DE.countryName}"), .ng-option:has-text("DE")`).first(),
      BE: page.locator(`.ng-option:has-text("${COUNTRIES.BE.countryName}"), .ng-option:has-text("BE")`).first(),
      NL: page.locator(`.ng-option:has-text("${COUNTRIES.NL.countryName}"), .ng-option:has-text("NL")`).first(),
      FR: page.locator(`.ng-option:has-text("${COUNTRIES.FR.countryName}"), .ng-option:has-text("FR")`).first(),
    };
  }

  orderRowByRef(ref) {
    return this.page.locator(`tbody tr:has-text("${ref}")`);
  }

  async getFirstOrderRef() {
    const firstRow = this.orderRows.first();
    const refCell = firstRow.locator('td').first();
    return refCell.textContent();
  }

  async getOrderRowCount() {
    return this.orderRows.count();
  }
}

module.exports = { LandingPage };
