const { BasePage } = require('../../base.page');

class ChangeSoldToModal extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.changeSoldToButton = page.locator("button:has(mat-icon:has-text('sync_alt'))");
    this.syncAltIcon = page.locator("mat-icon:has-text('sync_alt')");
    this.modalBody = page.locator("div.modal-body");
    this.selectAccountTitle = page.locator("div.modal-header div:has-text('Select an Account')");
    this.soldToAccountNumberInput = page.locator("app-account-search input[name='Sold-to Account Number']");
    this.searchButton = page.locator("app-account-search button:has-text('SEARCH')");
    this.firstSoldToLink = page.locator("(tbody.p-datatable-tbody span.redirect.ng-star-inserted)[1]");
    this.preservePricingTitle = page.locator("div.modal-header div:has-text('Preserve Pricing Rules?')");
    this.yesButton = page.locator("div.modal button:has-text('Yes'), div.modal .btn-confirm");
    this.noButton = page.locator("div.modal button:has-text('No'), div.modal .btn-cancel");
  }
}

module.exports = { ChangeSoldToModal };
