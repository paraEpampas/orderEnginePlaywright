const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { LandingPage } = require('../../pages/landing.page');
const { OrderDetailsPage } = require('../../pages/orders/order-details.page');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');
const { QuickAddTabPage } = require('../../pages/orders/tabs/quick-add-tab.page');
const { SelectAccountModal } = require('../../pages/orders/modals/select-account.modal');
const { getCountryConfig } = require('../../data/constants/country-config');
const { randomFutureDate } = require('../../data/generators');

class BulkUploadSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.landing = new LandingPage(page);
    this.orderDetails = new OrderDetailsPage(page);
    this.headerTab = new HeaderTabPage(page);
    this.quickAddTab = new QuickAddTabPage(page);
    this.selectAccountModal = new SelectAccountModal(page);
    this.countryConfig = getCountryConfig();
  }

  async verifyOrderEngineLoaded() {
    await expect(this.landing.searchContainer.or(this.landing.ordersSearchContainer).first()).toBeVisible({ timeout: 20000 });
  }

  async clickCreateOrder() {
    await this.clickElement(this.landing.createOrderButton);
  }

  async searchForAccountAndSelect() {
    const accountNumber = this.countryConfig.accounts;
    await this.selectAccountModal.soldToAccountNumberInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.clearAndFill(this.selectAccountModal.soldToAccountNumberInput, accountNumber);
    await this.selectAccountModal.soldToAccountNumberInput.press('Tab');
    await this.page.waitForTimeout(500);
    await this.selectAccountModal.searchButton.click({ force: true });
    await this.waitForLoader(30000);
    await this.page.waitForTimeout(1000);
    const firstLink = this.selectAccountModal.firstSoldToLink;
    if (await firstLink.isVisible().catch(() => false)) {
      await firstLink.click({ force: true });
    }
    await this.waitForLoader();
  }

  async fillCustomerOrderRefForBulkUpload() {
    const orderRef = `BulkUpload-${this.countryConfig.code}-${Date.now().toString().slice(-8)}`;
    await this.clearAndFill(this.headerTab.customerOrderRef, orderRef);
    return orderRef;
  }

  async fillMandatoryHeaderFields() {
    await this.clearAndFill(this.headerTab.requestedDeliveryDate, randomFutureDate());
    await this.headerTab.requestedDeliveryDate.press('Tab').catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async completeMandatoryHeaderSetup() {
    const { CreateOrderSteps } = require('./create-order.steps');
    const createSteps = new CreateOrderSteps(this.page);
    await createSteps.fillMandatoryHeaderFields();
  }

  async navigateToQuickAddTab() {
    await this.clickElement(this.headerTab.quickAddPricingTab);
    await this.page.waitForTimeout(1000);
  }

  async clickUploadButton() {
    const uploadBtn = this.page.locator('app-basic-pricing').locator(
      "button:has-text('UPLOAD'), button:has-text('Upload'), button:has(mat-icon:has-text('upload')), button:has(mat-icon:has-text('file_upload'))",
    );
    await uploadBtn.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.clickElement(uploadBtn.first());
    await this.page.waitForTimeout(1500);
  }

  async uploadExcelFile(filePath) {
    const fileInput = this.page.locator(
      "app-basic-pricing input[type='file'], .cdk-overlay-container input[type='file'], mat-dialog-container input[type='file'], input[type='file'][accept*='sheet'], input[type='file'][accept*='xlsx'], input[type='file']",
    ).last();
    await fileInput.waitFor({ state: 'attached', timeout: 20000 });
    await fileInput.setInputFiles(filePath);
    await this.waitForLoader(60000);

    const confirmBtn = this.page.locator(
      '.cdk-overlay-container button:has-text("UPLOAD"), .cdk-overlay-container button:has-text("Upload"), .cdk-overlay-container button:has-text("IMPORT"), .cdk-overlay-container button:has-text("Import"), .cdk-overlay-container button:has-text("OK"), .cdk-overlay-container button:has-text("CONFIRM")'
    ).first();
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
      await this.waitForLoader(60000);
    }

    await this.page.waitForTimeout(3000);
  }

  async verifyItemsLoadedFromExcel() {
    await expect(this.quickAddTab.pricingTable).toBeVisible({ timeout: 30000 });
    const rows = this.page.locator("tbody tr[formarrayname='basicPrice'], app-basic-pricing tbody tr, tbody tr.ng-star-inserted");
    await expect(rows.first()).toBeVisible({ timeout: 30000 });
    expect(await rows.count()).toBeGreaterThan(0);
  }

  async validateAndSubmitOrder() {
    await this.orderDetails.validateButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.orderDetails.validateButton.click({ force: true });
    await this.page.waitForTimeout(5000);
    await this.orderDetails.submitButtonBySpan.waitFor({ state: 'visible', timeout: 10000 });
    await this.orderDetails.submitButtonBySpan.click({ force: true });
    await this.page.waitForTimeout(5000);
  }
}

module.exports = { BulkUploadSteps };
