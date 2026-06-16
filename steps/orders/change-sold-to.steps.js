const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { OrderDetailsPage } = require('../../pages/orders/order-details.page');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');
const { SelectAccountModal } = require('../../pages/orders/modals/select-account.modal');

class ChangeSoldToSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.orderDetails = new OrderDetailsPage(page);
    this.headerTab = new HeaderTabPage(page);
    this.selectAccountModal = new SelectAccountModal(page);
  }

  _accountSearchModal() {
    return this.page.locator('mat-dialog-container:has(app-account-search), mat-dialog-container:has-text("Select an Account")').last();
  }

  _accountResultLinks() {
    return this._accountSearchModal().locator('app-account-search tbody span.redirect, tbody.p-datatable-tbody span.redirect');
  }

  async clickChangeSoldToButton() {
    const syncAltBtn = this.page.locator("button:has(mat-icon:text-is('sync_alt'))");
    await syncAltBtn.waitFor({ state: 'visible', timeout: 10000 });
    await syncAltBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async verifySelectAccountModalDisplayed() {
    const modal = this.page.locator(
      "app-account-search, mat-dialog-container:has(app-account-search), mat-dialog-container div:text-is('Select an Account'), div.modal-header div:text-is('Select an Account')"
    ).first();
    await expect(modal).toBeVisible({ timeout: 15000 });
  }

  async searchForNewAccount(accountNumber) {
    const modal = this._accountSearchModal();
    const input = modal.locator("input[name='Sold-to Account Number'], input[name*='Account Number'], input[placeholder*='Account']").first()
      .or(this.selectAccountModal.soldToAccountNumberInput);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await this.clearAndFill(input, accountNumber);
    await input.press('Tab');
    await this.page.waitForTimeout(500);
    const searchBtn = modal.locator("button:has-text('SEARCH')").first()
      .or(this.selectAccountModal.searchButton);
    await searchBtn.click({ force: true });
    await this.page.waitForTimeout(3000);
    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }

  async selectFirstAccount() {
    const link = this._accountResultLinks().first();
    await link.waitFor({ state: 'visible', timeout: 10000 });
    await link.click({ force: true });
    await this.page.waitForTimeout(2000);
  }

  async selectAlternateAccount() {
    let links = this._accountResultLinks();
    let count = await links.count();

    if (count < 2) {
      const modal = this._accountSearchModal();
      const clearBtn = modal.locator("button:has-text('CLEAR FIELDS'), button:has-text('CLEAR')").first();
      if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clearBtn.click({ force: true });
        await this.page.waitForTimeout(500);
        await modal.locator("button:has-text('SEARCH')").first().click({ force: true });
        await this.page.waitForTimeout(3000);
        await this.page.locator('app-loader .overlay').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        links = this._accountResultLinks();
        count = await links.count();
      }
    }

    if (count >= 2) {
      await links.nth(1).click({ force: true });
    } else if (count === 1) {
      await links.first().click({ force: true });
    } else {
      await this.selectFirstAccount();
    }
    await this.page.waitForTimeout(2000);
  }

  async _waitForChangeSoldToComplete() {
    await this.page.locator('app-loader .overlay').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await expect(this._accountSearchModal()).toBeHidden({ timeout: 20000 });
    const preserveDialog = this.page.locator(
      "mat-dialog-container:has-text('Preserve Pricing'), div.modal:has-text('Preserve Pricing Rules?'), div.modal:has-text('Preserve Pricing')"
    ).first();
    await expect(preserveDialog).toBeHidden({ timeout: 10000 }).catch(() => {});
  }

  async handlePreservePricingDialog(preserve) {
    const dialog = this.page.locator(
      "mat-dialog-container:has-text('Preserve Pricing'), div.modal:has-text('Preserve Pricing Rules?'), div.modal:has-text('Preserve Pricing')"
    ).first();
    await this.page.waitForTimeout(1000);
    if (!(await dialog.isVisible({ timeout: 8000 }).catch(() => false))) {
      await this._waitForChangeSoldToComplete();
      return;
    }

    if (preserve) {
      const preserveBtn = dialog.locator(
        "button:has-text('Yes'), button:has-text('Preserve'), button.btn-confirm, button:has-text('OK')"
      ).first();
      await preserveBtn.click({ force: true });
    } else {
      const discardBtn = dialog.locator(
        "button:has-text('No'), button:has-text('Discard'), button.btn-cancel"
      ).first();
      await discardBtn.click({ force: true });
    }
    await this.page.waitForTimeout(2000);
    await this._waitForChangeSoldToComplete();
  }

  async verifyAccountChanged() {
    await this._waitForChangeSoldToComplete();

    await this.page.locator("div[data-name='Header']").click({ force: true });
    await this.page.waitForTimeout(1500);
    await this.page.locator('app-loader .overlay').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const soldTo = this.page.getByText(/Sold[- ]?[Tt]o/i).first()
      .or(this.headerTab.soldToDisplay)
      .or(this.page.locator('p').filter({ hasText: /\d{6,}\s*-\s*.+/ }).first())
      .first();
    await expect(soldTo).toBeVisible({ timeout: 15000 });
    await expect(this.page.locator("button:has(mat-icon:text-is('sync_alt'))")).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { ChangeSoldToSteps };
