const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { OrderDetailsPage } = require('../../pages/orders/order-details.page');
const { QuickAddTabPage } = require('../../pages/orders/tabs/quick-add-tab.page');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');

class CopyOrderSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.orderDetails = new OrderDetailsPage(page);
    this.quickAddTab = new QuickAddTabPage(page);
    this.headerTab = new HeaderTabPage(page);
  }

  async verifyCopyOrderButtonVisible() {
    const copyBtn = this.quickAddTab.copyOrderButton.or(this.page.locator("button:has(mat-icon:has-text('file_copy'))"));
    await expect(copyBtn.first()).toBeVisible({ timeout: 10000 });
  }

  async clickCopyOrderButton() {
    const copyBtn = this.quickAddTab.copyOrderButton.or(this.page.locator("button:has(mat-icon:has-text('file_copy'))"));
    await this.clickElement(copyBtn.first());
    await this.page.waitForTimeout(2000);
  }

  async verifyCopyOrderModalDisplayed() {
    const modal = this.page.locator("mat-dialog-container:has-text('Copy Order'), mat-dialog-container:has-text('Copy'), .cdk-overlay-pane:has-text('Copy Order'), .cdk-overlay-pane:has-text('Copy'), div.modal:has-text('Copy')");
    await expect(modal.first()).toBeVisible({ timeout: 15000 });
  }

  async clickCopyOrderContinue() {
    const continueBtn = this.page.locator("mat-dialog-container button:has-text('CONTINUE'), mat-dialog-container button:has-text('Continue'), .cdk-overlay-pane button:has-text('CONTINUE'), .cdk-overlay-pane button:has-text('Continue'), div.modal button:has-text('Continue')");
    await this.clickElement(continueBtn.first());
    await this.page.waitForTimeout(3000);
  }

  async verifyCopiedOrderDisplayed() {
    await expect(this.headerTab.headerTab).toBeVisible({ timeout: 10000 });
    const quickAddTab = this.headerTab.quickAddPricingTab;
    if (await quickAddTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quickAddTab.click({ force: true });
      await this.page.waitForTimeout(2000);
    }
    const table = this.page.locator('tbody tr').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { CopyOrderSteps };
