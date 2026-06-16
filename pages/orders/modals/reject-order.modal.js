const { BasePage } = require('../../base.page');

class RejectOrderModal extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // Reject Order Icon (Toolbar)
    this.rejectOrderIcon = page.locator("div.action-buttons-container button:has(mat-icon:has-text('thumb_down_alt'))");

    // Reject Order Modal/Popup
    this.rejectOrderModal = page.locator('mat-dialog-container app-reject-order-reason');
    this.rejectOrderModalTitle = page.locator("mat-dialog-container div.modal-header div:has-text('Reject Order')");

    // Reason Text Field
    this.rejectionReasonTextarea = page.locator("mat-dialog-container oe-textarea[formcontrolname='reason'] textarea");
    this.rejectionReasonInput = page.locator("mat-dialog-container textarea[placeholder='Add New Text']");

    // Modal Buttons
    this.okButton = page.locator("mat-dialog-container app-reject-order-reason button[type='submit'].btn-confirm");
    this.cancelButton = page.locator("mat-dialog-container app-reject-order-reason button[type='button'].btn-cancel");
    this.closeButton = page.locator('mat-dialog-container div.modal-header button.close');

    // Post-Rejection: Rejection Reason Banner
    this.rejectionReasonBanner = page.locator('div.error-section');
    this.rejectionReasonText = page.locator('div.error-section p');

    // Order Status (Header Bar)
    this.rejectedStatus = page.locator("h2:has-text('Rejected')");
    this.savedStatus = page.locator("h2:has-text('Saved')");

    // Action Buttons Container
    this.actionButtonsContainer = page.locator('div.action-buttons-container');
    this.actionButtons = page.locator("div.action-buttons-container div.buttons button, div.action-buttons-container button");

    // Exit Order Modal
    this.exitOrderPopup = page.locator("mat-dialog-container:has-text('working on an order')");
    this.exitWithoutSavingButton = page.locator("button:has-text('Exit without')");
  }
}

module.exports = { RejectOrderModal };
