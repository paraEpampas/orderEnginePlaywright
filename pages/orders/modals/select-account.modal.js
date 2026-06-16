const { BasePage } = require('../../base.page');

class SelectAccountModal extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.modalBody = page.locator("div.modal-body");
    this.selectAccountTitle = page.locator("div.modal-header div:has-text('Select an Account')");
    this.soldToAccountNumberInput = page.locator("app-account-search input[name='Sold-to Account Number']");
    this.searchButton = page.locator("app-account-search button:has-text('SEARCH')");
    this.clearFieldsButton = page.locator("app-account-search button:has-text('CLEAR FIELDS')");
    this.resultsTable = page.locator("p-table.scroll-height-flex, p-table");
    this.tableBody = page.locator("tbody.p-datatable-tbody");
    this.firstSoldToLink = page.locator("tbody.p-datatable-tbody span.redirect.ng-star-inserted").first();
    this.allSoldToLinks = page.locator("tbody.p-datatable-tbody span.redirect.ng-star-inserted");
  }
}

module.exports = { SelectAccountModal };
