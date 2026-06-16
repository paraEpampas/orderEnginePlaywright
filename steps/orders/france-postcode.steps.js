const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');

class FrancePostcodeSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.headerTab = new HeaderTabPage(page);
    this.modalRoot = page.locator('.cdk-overlay-pane, mat-dialog-container').last();
  }

  async ensureHeaderTab() {
    const headerTabBtn = this.page.locator("div:text-is('HEADER')").first();
    if (await headerTabBtn.isVisible().catch(() => false)) {
      await headerTabBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async verifyFindAddressButtonVisible() {
    const findBtn = this.page.locator("button:has-text('FIND AN ADDRESS'), button:has-text('Find an Address'), button:has-text('Find address')").first();
    await expect(findBtn).toBeVisible({ timeout: 10000 });
  }

  async clickFindAnAddress() {
    const findBtn = this.page.locator("button:has-text('FIND AN ADDRESS'), button:has-text('Find an Address'), button:has-text('Find address')").first();
    await findBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async verifyFindAddressModalOpen() {
    const title = this.modalRoot.locator(':text("Find an Address"), :text("Find An Address")').first();
    await expect(title).toBeVisible({ timeout: 10000 });
  }

  async fillPostcodeAndTownInModal(postcode, town) {
    const postcodeLabel = this.modalRoot.locator(':text-is("Post Code")');
    const postcodeInput = postcodeLabel.locator('..').locator('input').first()
      .or(this.modalRoot.locator('input').first());
    if (postcode) {
      await postcodeInput.waitFor({ state: 'visible', timeout: 5000 });
      await postcodeInput.clear();
      await postcodeInput.fill(postcode);
    }

    const townLabel = this.modalRoot.locator(':text-is("Town")');
    const townInput = townLabel.locator('..').locator('input').first()
      .or(this.modalRoot.locator('input').nth(1));
    if (town !== undefined && town !== null) {
      await townInput.waitFor({ state: 'visible', timeout: 5000 });
      await townInput.clear();
      await townInput.fill(town);
    }
  }

  async clickSearchInModal() {
    const searchBtn = this.modalRoot.locator('button:has-text("SEARCH"), button:has-text("Search")').first();
    await searchBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async selectFirstAddressInModal() {
    const combobox = this.modalRoot.locator('select, combobox').first()
      .or(this.modalRoot.locator('[role="combobox"]').first());
    const option = this.modalRoot.locator('option').first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      const select = this.modalRoot.locator('select').first();
      if (await select.isVisible().catch(() => false)) {
        await select.selectOption({ index: 0 });
      }
    }
    await this.page.waitForTimeout(500);
  }

  async clickUseSelectedAddressInModal() {
    const useBtn = this.modalRoot.locator("button:has-text('USE SELECTED ADDRESS'), button:has-text('Use Selected Address'), button:has-text('Use Selected')").first();
    await useBtn.waitFor({ state: 'visible', timeout: 5000 });
    await useBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async clickCancelInModal() {
    const cancelBtn = this.modalRoot.locator("button:has-text('CANCEL'), button:has-text('Cancel')").first();
    await cancelBtn.click();
    await this.page.waitForTimeout(500);
  }

  async clickCloseInModal() {
    const closeBtn = this.modalRoot.locator("button:has(mat-icon:has-text('close'))").first();
    await closeBtn.click();
    await this.page.waitForTimeout(500);
  }

  async verifyNoResultsInModal() {
    await this.page.waitForTimeout(2000);
    const useBtn = this.modalRoot.locator("button:has-text('USE SELECTED ADDRESS'), button:has-text('Use Selected Address')").first();
    await expect(useBtn).toBeDisabled({ timeout: 5000 });
  }

  async fillShipToPostcodeAndTown(postcode, town) {
    const postcodeInput = this.page.locator("input[formcontrolname*='shipToPostcode'], input[placeholder*='Postcode']").first();
    const townInput = this.page.locator("input[formcontrolname*='shipToTown'], input[placeholder*='Town']").first();
    if (postcode) await this.clearAndFill(postcodeInput, postcode);
    if (town) await this.clearAndFill(townInput, town);
  }

  async verifyPostcodeTownValidationErrorVisible() {
    const error = this.page.locator('.error-message, .validation-error, .mat-error').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  }

  async getPostcodeTownValidationErrorText() {
    const error = this.page.locator('.error-message, .validation-error, .mat-error').first();
    return (await error.textContent()) || '';
  }
}

module.exports = { FrancePostcodeSteps };
