const { expect } = require('@playwright/test');
const { BaseSteps } = require('./base.steps');
const { LandingPage } = require('../pages/landing.page');
const { OrderDetailsPage } = require('../pages/orders/order-details.page');

class OEOrderVerificationSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.landing = new LandingPage(page);
    this.orderDetails = new OrderDetailsPage(page);
  }

  async navigateToOELandingPage() {
    const baseUrl = process.env.BASE_URL;
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async searchForOrderByAccountNumber(accountNumber) {
    const accountInput = this.landing.accountNumberInput || this.page.locator("input[placeholder*='Account']").first();
    await this.clearAndFill(accountInput, accountNumber);
    await this.clickElement(this.landing.searchButton);
    await this.page.waitForTimeout(3000);
  }

  async searchForOrderByReference(orderReference) {
    await this.clearAndFill(this.landing.referenceInput, orderReference);
    await this.clickElement(this.landing.searchButton);
    await this.page.waitForTimeout(3000);
  }

  async _isOrderVisibleInResults(orderRef) {
    const row = this.landing.orderRowByRef(orderRef);
    for (let poll = 0; poll < 10; poll++) {
      if (await row.isVisible().catch(() => false)) return true;
      await this.page.waitForTimeout(1000);
    }
    return false;
  }

  async waitForApiOrder(orderRef, { initialWaitMs = 15000, maxRetries = 20, retryDelayMs = 3000 } = {}) {
    console.log(`Waiting ${initialWaitMs / 1000}s for backend indexing of ${orderRef}...`);
    await this.page.waitForTimeout(initialWaitMs);

    await this.navigateToOELandingPage();
    await this.searchForOrderByReference(orderRef);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (await this._isOrderVisibleInResults(orderRef)) {
        console.log(`Order ${orderRef} found after ${attempt + 1} search attempt(s)`);
        return true;
      }
      console.log(`Attempt ${attempt + 1}/${maxRetries}: Order ${orderRef} not indexed yet, re-searching...`);
      await this.page.waitForTimeout(retryDelayMs);
      await this.searchForOrderByReference(orderRef);
    }

    if (await this._isOrderVisibleInResults(orderRef)) {
      console.log(`Order ${orderRef} found on final check`);
      return true;
    }

    console.log(`Order ${orderRef} not found after ${maxRetries} retries`);
    return false;
  }

  async verifyOrderDisplayedInOE(orderRef) {
    const found = await this.waitForApiOrder(orderRef, { initialWaitMs: 0, maxRetries: 15, retryDelayMs: 3000 });
    if (!found) {
      console.log(`Order ${orderRef} not found after 15 retries - API order may not yet be indexed`);
    }
    const row = this.landing.orderRowByRef(orderRef);
    await expect(row).toBeVisible({ timeout: 15000 });
  }

  async verifyAnyOrderDisplayedInOE() {
    const rows = this.page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  }

  async clickOnOrderNumber(orderRef) {
    const row = this.landing.orderRowByRef(orderRef);
    await row.locator('span.redirect, a').first().click();
    await this.page.waitForTimeout(2000);
  }

  async clickOnLatestOrder() {
    const firstRow = this.page.locator('tbody tr').first();
    await firstRow.locator('span.redirect, a').first().click();
    await this.page.waitForTimeout(2000);
  }

  async clickValidateOrder() {
    await this.clickElement(this.orderDetails.validateButton);
    await this.page.waitForTimeout(3000);
  }

  async checkValidationMessage() {
    const success = this.page.locator('.toast-success, .alert-success, div:has-text("successfully")').first();
    const error = this.page.locator('.toast-error, .alert-danger, div.error-section').first();
    await this.page.waitForTimeout(2000);
    if (await success.isVisible().catch(() => false)) return true;
    if (await error.isVisible().catch(() => false)) return false;
    return true;
  }

  async clickSaveAndSubmitOrder() {
    await this.clickElement(this.orderDetails.submitButtonBySpan);
    await this.page.waitForTimeout(3000);
  }

  async verifyOrderSubmissionSuccessful() {
    const success = this.page.locator('.toast-success, .alert-success, div:has-text("submitted")').first();
    await expect(success).toBeVisible({ timeout: 15000 });
  }

  async getOrderStatusFromOE(orderRef) {
    const row = this.landing.orderRowByRef(orderRef);
    const statusCell = row.locator('td').nth(3);
    return (await statusCell.textContent()) || '';
  }

  async verifyOrderDetailsLoaded() {
    for (let attempt = 0; attempt < 8; attempt++) {
      const detailSection = this.page.locator('app-order-details, .order-detail, div[class*="order"]').first();
      if (await detailSection.isVisible().catch(() => false)) return;
      await this.page.waitForTimeout(2000);
    }
    const detailSection = this.page.locator('app-order-details, .order-detail, div[class*="order"]').first();
    await expect(detailSection).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { OEOrderVerificationSteps };
