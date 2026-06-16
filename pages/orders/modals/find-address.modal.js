const { BasePage } = require('../../base.page');

class FindAddressModal extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.modalTitle = page.locator("div.modal-header:has-text('Find an address'), div.modal-header:has-text('find an address')");
    this.postCodeInput = page.locator("div.modal oe-input[formcontrolname='postCode'] input, div.modal input[formcontrolname='postCode']");
    this.townInput = page.locator("div.modal oe-input[formcontrolname='town'] input, div.modal input[formcontrolname='town']");
    this.searchButton = page.locator("div.modal button:has-text('SEARCH'), div.modal button[type='submit']").first();
    this.addressDropdown = page.locator("div.modal ng-dropdown-panel");
    this.firstAddressOption = page.locator("div.modal ng-dropdown-panel .ng-option").first();
    this.useSelectedAddressButton = page.locator("div.modal button:has-text('Use selected address'), div.modal button:has-text('use selected address')").first();
    this.cancelButton = page.locator("div.modal button:has-text('Cancel'), div.modal button.btn-cancel");
    this.closeButton = page.locator("div.modal div.modal-header button.close");
    this.noResultsMessage = page.locator("div.modal div:has-text('No results'), div.modal p:has-text('No address')");
  }
}

module.exports = { FindAddressModal };
