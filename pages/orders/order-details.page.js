const { BasePage } = require('../base.page');

class OrderDetailsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.orderDetailsContainer = page.locator('app-order-details, app-order');
    this.validateButton = page.locator("button:has(mat-icon:has-text('fact_check'))");
    this.saveAndSubmitButton = page.locator("button:has(mat-icon:has-text('save_alt'))");
    this.submitButtonBySpan = page.locator("button:has(mat-icon:has-text('save_alt'))");
    this.saveButton = page.locator("button:has(mat-icon:text-is('save'))");
    this.syncButton = page.locator("button:has(mat-icon:text-is('sync_alt'))");
    this.backButton = page.locator("button:has(mat-icon:has-text('keyboard_backspace'))");
    this.editIcon = page.locator("button:has(mat-icon:has-text('edit'))");
    this.moreOptionsButton = page.locator("button:has(mat-icon:has-text('more_vert'))");
    this.orderStatus = page.locator('h2.order, h2:has-text("Saved"), h2:has-text("Submitted")');
    this.orderRef = page.locator('.order-ref, app-order h2');
    this.orderTitle = page.locator('h2').filter({ hasText: 'Order:' });
    this.actionButtonsContainer = page.locator("div.action-buttons-container");
    this.validationErrorBanner = page.locator('div:has(> strong:has-text("Error"))').first();
    this.validationFieldErrors = page.locator('div:has-text("The following field(s) need to be corrected")');
  }
}

module.exports = { OrderDetailsPage };
