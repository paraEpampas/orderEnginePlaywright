const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { LandingPage } = require('../../pages/landing.page');
const { OrderDetailsPage } = require('../../pages/orders/order-details.page');
const { RejectOrderModal } = require('../../pages/orders/modals/reject-order.modal');

class RejectOrderSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.landing = new LandingPage(page);
    this.orderDetails = new OrderDetailsPage(page);
    this.rejectModal = new RejectOrderModal(page);
    this.currentOrderNumber = null;
    this.savedOrderActionCount = 0;
  }

  // ========== Navigation & Search ==========

  async navigateToOrderEngine() {
    const baseUrl = process.env.BASE_URL;
    const searchTitle = this.landing.searchTitle;
    const isVisible = await searchTitle.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
    await expect(searchTitle).toBeVisible({ timeout: 60000 });
    return this;
  }

  async selectOriginFilter(origin) {
    const dropdown = this.page.locator("oe-select[formcontrolname='orderOrigin'] select").first();
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await dropdown.selectOption({ label: origin });
    await this.page.waitForTimeout(500);
    return this;
  }

  async clickSearchButton() {
    const searchBtn = this.page.locator("button.btn-confirm:has-text('SEARCH')").first();
    await expect(searchBtn).toBeVisible({ timeout: 5000 });
    await searchBtn.click();
    await this.page.waitForTimeout(3000);
    return this;
  }

  async _tryOpenSavedOrderWithRejectIcon() {
    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();
    if (count === 0) return false;

    const orderLinks = this.page.locator("tbody tr td:nth-child(2) span.redirect");
    const linkCount = await orderLinks.count();

    for (let i = 0; i < count && i < linkCount; i++) {
      const rowText = await rows.nth(i).textContent().catch(() => '');
      if (rowText.includes('Saved')) {
        const link = orderLinks.nth(i);
        this.currentOrderNumber = (await link.textContent().catch(() => '')).trim();
        console.log(`[Reject] Trying Saved order: ${this.currentOrderNumber}`);
        await link.click({ force: true });
        await this.page.waitForTimeout(3000);

        if (await this.rejectModal.rejectOrderIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log(`[Reject] Found order ${this.currentOrderNumber} with reject icon`);
          return true;
        }

        console.log(`[Reject] Order ${this.currentOrderNumber} has no reject icon, trying next origin`);
        return false;
      }
    }
    return false;
  }

  async searchAndOpenSavedOrderByOrigin(origin) {
    await this.navigateToOrderEngine();
    await this.selectOriginFilter(origin);
    await this.clickSearchButton();

    if (await this._tryOpenSavedOrderWithRejectIcon()) return this;

    const fallbackOrigins = ['B2B', 'ServiceNow'];
    for (const fallback of fallbackOrigins) {
      if (fallback === origin) continue;
      console.log(`[Reject] Trying fallback origin: ${fallback}`);
      await this.navigateToOrderEngine();
      await this.selectOriginFilter(fallback);
      await this.clickSearchButton();
      if (await this._tryOpenSavedOrderWithRejectIcon()) return this;
    }

    console.log('[Reject] Trying search without origin filter as last resort');
    await this.navigateToOrderEngine();
    await this.clickSearchButton();
    if (await this._tryOpenSavedOrderWithRejectIcon()) return this;

    const err = new Error(`No Saved order eligible for rejection found (tried: ${origin} and fallbacks)`);
    err.noTestData = true;
    throw err;
  }

  async searchAndOpenAnySavedOrder() {
    return this.searchAndOpenSavedOrderByOrigin('B2B');
  }

  async searchAndOpenOrderByStatus(status) {
    await this.navigateToOrderEngine();
    await this.selectOriginFilter('B2B');
    await this.clickSearchButton();

    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();
    if (count === 0) {
      const err = new Error(`No order found with status: ${status}`);
      err.noTestData = true;
      throw err;
    }

    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent().catch(() => '');
      if (rowText.includes(status)) {
        const orderCell = rows.nth(i).locator('td:nth-child(2)');
        this.currentOrderNumber = (await orderCell.textContent().catch(() => '')).trim();
        console.log(`[Reject] Found ${status} order: ${this.currentOrderNumber}`);
        const link = orderCell.locator('span.redirect').first();
        if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
          await link.click({ force: true });
        } else {
          await orderCell.click({ force: true });
        }
        await this.page.waitForTimeout(3000);
        return this;
      }
    }
    const err = new Error(`No order found with status: ${status}`);
    err.noTestData = true;
    throw err;
  }

  async searchAndOpenSavedOrderWithNonEligibleOrigin() {
    await this.navigateToOrderEngine();
    await this.selectOriginFilter('Order Engine');
    await this.clickSearchButton();
    await this._openFirstSavedOrderFromResults();
    return this;
  }

  async _openFirstSavedOrderFromResults() {
    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();
    if (count === 0) {
      const err = new Error('No Saved order found in search results');
      err.noTestData = true;
      throw err;
    }

    const orderLinks = this.page.locator("tbody tr td:nth-child(2) span.redirect");
    const linkCount = await orderLinks.count();

    for (let i = 0; i < count && i < linkCount; i++) {
      const rowText = await rows.nth(i).textContent().catch(() => '');
      if (rowText.includes('Saved')) {
        const link = orderLinks.nth(i);
        this.currentOrderNumber = (await link.textContent().catch(() => '')).trim();
        await link.click({ force: true });
        await this.page.waitForTimeout(3000);
        return this;
      }
    }
    throw new Error('No Saved order found in search results');
  }

  // ========== State Storage ==========

  async storeCurrentOrderNumber() {
    const url = this.page.url();
    const parts = url.split('/orders/');
    if (parts.length > 1) {
      this.currentOrderNumber = parts[1].split('/')[0].trim();
    }
    console.log(`[Reject] Stored order number: ${this.currentOrderNumber}`);
    return this;
  }

  getCurrentOrderNumber() {
    return this.currentOrderNumber;
  }

  async storeSavedOrderActionCount() {
    this.savedOrderActionCount = await this.rejectModal.actionButtons.count();
    console.log(`[Reject] Saved order action count: ${this.savedOrderActionCount}`);
    return this;
  }

  // ========== Reject Order Icon ==========

  async verifyRejectOrderIconVisible() {
    await expect(this.rejectModal.rejectOrderIcon).toBeVisible({ timeout: 10000 });
    return this;
  }

  async verifyRejectOrderIconNotVisible() {
    await expect(this.rejectModal.rejectOrderIcon).not.toBeVisible({ timeout: 5000 });
    return this;
  }

  async clickRejectOrderIcon() {
    await this.rejectModal.rejectOrderIcon.scrollIntoViewIfNeeded().catch(() => {});
    await expect(this.rejectModal.rejectOrderIcon).toBeVisible({ timeout: 10000 });
    await expect(this.rejectModal.rejectOrderIcon).toBeEnabled({ timeout: 5000 });
    await this.rejectModal.rejectOrderIcon.click();
    await this.page.waitForTimeout(1500);
    return this;
  }

  // ========== Reject Order Modal ==========

  async verifyRejectOrderPopupDisplayed() {
    await expect(this.rejectModal.rejectOrderModal).toBeVisible({ timeout: 15000 });
    return this;
  }

  async verifyRejectOrderPopupElements() {
    await expect(this.rejectModal.rejectOrderModal).toBeVisible({ timeout: 5000 });
    const reasonField = this.rejectModal.rejectionReasonTextarea.or(this.rejectModal.rejectionReasonInput);
    await expect(reasonField).toBeVisible({ timeout: 3000 });
    await expect(this.rejectModal.okButton).toBeVisible({ timeout: 3000 });
    await expect(this.rejectModal.cancelButton).toBeVisible({ timeout: 3000 });
    return this;
  }

  async verifyRejectOrderPopupClosed() {
    await expect(this.rejectModal.rejectOrderModal).not.toBeVisible({ timeout: 5000 });
    return this;
  }

  // ========== OK Button State ==========

  async verifyOkButtonDisabled() {
    await expect(this.rejectModal.okButton).toBeVisible({ timeout: 3000 });
    await expect(this.rejectModal.okButton).toBeDisabled({ timeout: 5000 });
    return this;
  }

  async verifyOkButtonEnabled() {
    await expect(this.rejectModal.okButton).toBeVisible({ timeout: 3000 });
    await expect(this.rejectModal.okButton).toBeEnabled({ timeout: 3000 });
    return this;
  }

  // ========== Reason Text Field ==========

  async _getReasonField() {
    const textarea = this.rejectModal.rejectionReasonTextarea;
    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) return textarea;
    return this.rejectModal.rejectionReasonInput;
  }

  async enterRejectionReason(reason) {
    const field = await this._getReasonField();
    await expect(field).toBeVisible({ timeout: 5000 });
    await field.click();
    await field.press('Meta+a');
    await field.fill(reason);
    await this.page.waitForTimeout(500);
    return this;
  }

  async clearRejectionReason() {
    const field = await this._getReasonField();
    await expect(field).toBeVisible({ timeout: 3000 });
    await field.click();
    await field.press('Meta+a');
    await field.press('Backspace');
    await this.page.waitForTimeout(500);
    return this;
  }

  async enterWhitespaceOnlyReason() {
    const field = await this._getReasonField();
    await expect(field).toBeVisible({ timeout: 5000 });
    await field.click();
    await field.fill('');
    await field.pressSequentially('   ', { delay: 50 });
    await this.page.waitForTimeout(500);
    return this;
  }

  async isOkButtonDisabled() {
    return this.rejectModal.okButton.isDisabled().catch(() => false);
  }

  async enterLongRejectionReason(length) {
    const longText = 'A'.repeat(length);
    const field = await this._getReasonField();
    await expect(field).toBeVisible({ timeout: 5000 });
    await field.click();
    await field.fill('');
    await field.fill(longText);
    await this.page.waitForTimeout(500);
    return this;
  }

  async getRejectionReasonValue() {
    const field = await this._getReasonField();
    let value = await field.inputValue().catch(() => '');
    if (!value) value = await field.textContent().catch(() => '');
    return value;
  }

  // ========== Modal Action Buttons ==========

  async clickOkButton() {
    await expect(this.rejectModal.okButton).toBeVisible({ timeout: 5000 });
    await expect(this.rejectModal.okButton).toBeEnabled({ timeout: 3000 });
    await this.rejectModal.okButton.click();
    await this.page.waitForTimeout(3000);
    return this;
  }

  async clickCancelButton() {
    await expect(this.rejectModal.cancelButton).toBeVisible({ timeout: 5000 });
    await this.rejectModal.cancelButton.click();
    await this.page.waitForTimeout(1000);
    return this;
  }

  async pressEscKey() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(1000);
    return this;
  }

  // ========== Post-Rejection Verifications ==========

  async verifyOrderStatusRejected() {
    await expect(this.rejectModal.rejectedStatus).toBeVisible({ timeout: 20000 });
    return this;
  }

  async verifyOrderStatusSaved() {
    await expect(this.rejectModal.savedStatus).toBeVisible({ timeout: 10000 });
    return this;
  }

  async verifyRejectionReasonDisplayed(expectedReason) {
    const banner = this.rejectModal.rejectionReasonBanner.first();
    await expect(banner).toBeVisible({ timeout: 10000 });
    const bannerText = await banner.textContent();
    expect(bannerText.toLowerCase()).toContain(expectedReason.toLowerCase());
    return this;
  }

  async verifyRejectionReasonBannerVisible() {
    await expect(this.rejectModal.rejectionReasonBanner.first()).toBeVisible({ timeout: 10000 });
    return this;
  }

  async verifyOrderActionsReduced() {
    const currentActionCount = await this.rejectModal.actionButtons.count();
    console.log(`[Reject] Action buttons after rejection: ${currentActionCount}`);
    if (this.savedOrderActionCount > 0) {
      expect(currentActionCount).toBeLessThan(this.savedOrderActionCount);
      console.log(`[Reject] Actions reduced from ${this.savedOrderActionCount} to ${currentActionCount}`);
    } else {
      await this.verifyRejectOrderIconNotVisible();
    }
    return this;
  }

  async verifyStillOnViewOrderScreen() {
    const currentUrl = this.page.url();
    expect(currentUrl.toLowerCase()).toContain('order');
    return this;
  }

  async verifyOrderNumberUnchanged() {
    if (this.currentOrderNumber) {
      const url = this.page.url();
      expect(url).toContain(`/orders/${this.currentOrderNumber}`);
    }
    return this;
  }

  async verifyPageStillResponsive() {
    const body = this.page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    return this;
  }

  // ========== Search Results Verification ==========

  async verifyRejectedOrderInSearchResults() {
    await this.navigateToOrderEngine();
    await this.clickSearchButton();

    expect(this.currentOrderNumber).toBeTruthy();
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent().catch(() => '');
      if (rowText.includes(this.currentOrderNumber) && rowText.includes('Rejected')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
    return this;
  }

  async reopenRejectedOrderFromSearchResults() {
    const orderLinks = this.page.locator("tbody tr td:nth-child(2) span.redirect");
    const count = await orderLinks.count();
    for (let i = 0; i < count; i++) {
      const text = (await orderLinks.nth(i).textContent().catch(() => '')).trim();
      if (text === this.currentOrderNumber) {
        await orderLinks.nth(i).click();
        await this.page.waitForTimeout(3000);
        return this;
      }
    }
    await orderLinks.first().click();
    await this.page.waitForTimeout(3000);
    return this;
  }

  // ========== Composite Actions ==========

  async rejectOrderWithReason(reason) {
    await this.clickRejectOrderIcon();
    await this.verifyRejectOrderPopupDisplayed();
    await this.enterRejectionReason(reason);
    await this.verifyOkButtonEnabled();
    await this.clickOkButton();
    await this.verifyRejectOrderPopupClosed();
    return this;
  }

  async openRejectPopupEnterReasonAndCancel(reason) {
    await this.clickRejectOrderIcon();
    await this.verifyRejectOrderPopupDisplayed();
    await this.enterRejectionReason(reason);
    await this.verifyOkButtonEnabled();
    await this.clickCancelButton();
    await this.verifyRejectOrderPopupClosed();
    return this;
  }

  // ========== Exit Order Modal ==========

  async handleExitOrderModalIfPresent() {
    try {
      if (await this.rejectModal.exitOrderPopup.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(this.rejectModal.exitWithoutSavingButton).toBeVisible({ timeout: 5000 });
        await this.rejectModal.exitWithoutSavingButton.click();
        await this.page.waitForTimeout(2000);
      }
    } catch {
      // No exit order modal present
    }
    return this;
  }
}

module.exports = { RejectOrderSteps };
