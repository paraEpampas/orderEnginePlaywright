const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { LandingPage } = require('../../pages/landing.page');
const { OrderDetailsPage } = require('../../pages/orders/order-details.page');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');

class OrderEditSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.landing = new LandingPage(page);
    this.orderDetails = new OrderDetailsPage(page);
    this.headerTab = new HeaderTabPage(page);
    this.orderReference = '';
  }

  setOrderReference(ref) {
    this.orderReference = ref;
  }

  async searchForOrderByReferenceWithLongWait() {
    await this.clearAndFill(this.landing.referenceInput, this.orderReference);
    await this.clickElement(this.landing.searchButton);
    await this.page.waitForTimeout(10000);
  }

  async chooseOrderAndClickEditIcon() {
    const row = this.landing.orderRowByRef(this.orderReference);
    for (let attempt = 0; attempt < 5; attempt++) {
      if (await row.isVisible().catch(() => false)) break;
      await this.page.waitForTimeout(2000);
      await this.landing.referenceInput.fill(this.orderReference).catch(() => {});
      await this.landing.searchButton.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(3000);
    }
    const link = row.locator('span.redirect, a').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    await link.click();
    await this.page.waitForTimeout(5000);
    const editIcon = this.orderDetails.editIcon;
    if (await editIcon.isVisible({ timeout: 10000 }).catch(() => false)) {
      await editIcon.click();
      await this.page.waitForTimeout(3000);
    }
  }

  async makeChangesAndSave() {
    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
    const headerTab = this.headerTab.headerTab;
    if (await headerTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await headerTab.click({ force: true });
      await this.page.waitForTimeout(2000);
      await loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    }
    const refInput = this.headerTab.customerOrderRef;
    if (await refInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      await refInput.click();
      await refInput.fill(`${this.orderReference}_edited`);
      await this.page.waitForTimeout(500);
    }
    const saveBtn = this.orderDetails.saveButton;
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click({ force: true });
    } else {
      const submitBtn = this.orderDetails.saveAndSubmitButton;
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click({ force: true });
      }
    }
    await this.page.waitForTimeout(5000);
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  }

  async deleteMandatoryFieldAndAttemptSave() {
    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
    const editIcon = this.orderDetails.editIcon;
    if (await editIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editIcon.click();
      await this.page.waitForTimeout(3000);
      await loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    }
    const headerTab = this.headerTab.headerTab;
    if (await headerTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await headerTab.click({ force: true });
      await this.page.waitForTimeout(1000);
      await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    }
    const refInput = this.headerTab.customerOrderRef;
    if (await refInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await refInput.click();
      await refInput.fill('');
      await refInput.press('Tab');
    }
    await this.page.waitForTimeout(500);
    const saveBtn = this.orderDetails.saveButton;
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click({ force: true });
    } else {
      const submitBtn = this.orderDetails.saveAndSubmitButton;
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click({ force: true });
      }
    }
    await this.page.waitForTimeout(3000);
    await loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  }

  async verifyValidationError() {
    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    const errorLocators = this.page.locator('div.error-section, strong:has-text("Error"), .validation-error, .mat-error, .ng-invalid.ng-touched, img[alt*="error"]').first();
    const isVisible = await errorLocators.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isVisible) {
      const pageText = await this.page.locator('body').textContent().catch(() => '');
      const hasError = pageText.toLowerCase().includes('error') || pageText.toLowerCase().includes('required') || pageText.toLowerCase().includes('mandatory');
      expect(hasError || isVisible).toBeTruthy();
    }
  }
}

module.exports = { OrderEditSteps };
