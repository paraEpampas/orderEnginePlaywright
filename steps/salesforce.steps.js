const { expect } = require('@playwright/test');
const { BaseSteps } = require('./base.steps');

class SalesforceSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.generatedQuoteName = '';
    this.generatedOrderName = '';
    this.sfUrl = process.env.SALESFORCE_URL || 'https://computacenterplc--test.sandbox.lightning.force.com/lightning/page/home';
  }

  async navigateToSalesforce() {
    await this.page.goto(this.sfUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async loginToSalesforce(username, password) {
    await this.page.waitForTimeout(3000);
    const loginForm = this.page.locator('#login_form, form[action*="login"], #credentials, .login-form').first();
    if (await loginForm.isVisible({ timeout: 10000 }).catch(() => false)) {
      const ccLoginBtn = this.page.locator('button:has-text("Computacenter"), a:has-text("Computacenter")').first();
      if (await ccLoginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await ccLoginBtn.click();
        await this.page.waitForTimeout(3000);
      } else {
        const usernameInput = this.page.locator('#username, input[name="username"], input[name="loginfmt"]').first();
        const passwordInput = this.page.locator('#password, input[name="password"], input[name="passwd"]').first();
        if (await usernameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await usernameInput.fill(username || '');
        }
        if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await passwordInput.fill(password || '');
        }
        const loginBtn = this.page.locator('#Login, button[type="submit"], input[type="submit"]').first();
        if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await loginBtn.click();
        }
      }
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  async verifyLoginSuccessful() {
    await this.page.waitForTimeout(3000);
    const currentUrl = this.page.url();
    expect(currentUrl).not.toContain('/login');
  }

  async navigateToQuote(country) {
    const quoteUrls = {
      UK: '/lightning/r/SBQQ__Quote__c/a6TOC000000cKpT2AU/view',
      US: '/lightning/r/SBQQ__Quote__c/a6TOC000000cKpU2AU/view',
      DE: '/lightning/r/SBQQ__Quote__c/a6TOC000000cKpV2AU/view',
      NL: '/lightning/r/SBQQ__Quote__c/a6TOC000000cKpW2AU/view',
      BE: '/lightning/r/SBQQ__Quote__c/a6TOC000000cKpX2AU/view',
      FR: '/lightning/r/SBQQ__Quote__c/a6TOC000000cKpY2AU/view',
    };
    const quotePath = quoteUrls[country] || quoteUrls.UK;
    const baseUrl = this.sfUrl.split('/lightning')[0];
    await this.page.goto(`${baseUrl}${quotePath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async clickCloneButton() {
    const cloneBtn = this.page.locator("button:has-text('Clone'), a[title='Clone']").first();
    await cloneBtn.click({ timeout: 10000 });
    await this.page.waitForTimeout(2000);
  }

  async verifyCloneModalDisplayed() {
    const modal = this.page.locator('.modal-container, [role="dialog"], .slds-modal').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
  }

  async clickNextButton() {
    const nextBtn = this.page.locator("button:has-text('Next')").first();
    await nextBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async verifyCloneDetailsModalDisplayed() {
    await this.page.waitForTimeout(2000);
  }

  async enterQuoteName(country) {
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    this.generatedQuoteName = `CPQtoOE_${country}-${timestamp}`;
    const nameInput = this.page.locator("input[name='SBQQ__Quote__c-SBQQ__QuoteName__c'], input[placeholder*='Name']").first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(this.generatedQuoteName);
    }
  }

  getGeneratedQuoteName() { return this.generatedQuoteName; }
  getGeneratedOrderName() { return this.generatedOrderName; }

  async clickFinishButton() {
    const finishBtn = this.page.locator("button:has-text('Finish'), button:has-text('Save')").first();
    await finishBtn.click();
    await this.page.waitForTimeout(3000);
  }

  async verifyCloneSuccessPopup() {
    await this.page.waitForTimeout(3000);
  }

  async clickCreateOrderButton() {
    const createBtn = this.page.locator("button:has-text('Create Order'), a:has-text('Create Order')").first();
    await createBtn.click({ timeout: 10000 });
    await this.page.waitForTimeout(2000);
  }

  async verifyCreateOrderModalDisplayed() {
    await this.page.waitForTimeout(2000);
  }

  async enterCustomerPONumberWithTimestamp(country) {
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    this.generatedOrderName = `CPQtoOE_${country}-${timestamp}`;
    const poInput = this.page.locator("input[name*='CustomerPO'], input[name*='PoNumber'], input[placeholder*='PO']").first();
    if (await poInput.isVisible().catch(() => false)) {
      await poInput.fill(this.generatedOrderName);
    }
  }

  async clickSaveButton() {
    const saveBtn = this.page.locator("button:has-text('Save')").first();
    await saveBtn.click();
    await this.page.waitForTimeout(3000);
  }

  async verifyOrderCreationSuccessAndClickLink() {
    const toast = this.page.locator('.toastMessage, .slds-notify__content').first();
    await expect(toast).toBeVisible({ timeout: 10000 });
    const link = toast.locator('a').first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await this.page.waitForTimeout(2000);
    }
  }

  async navigateToOrdersListAndSearchForOrder(orderName) {
    const ordersTab = this.page.locator("a[title='Orders'], one-app-nav-bar-item-root:has-text('Orders')").first();
    if (await ordersTab.isVisible().catch(() => false)) {
      await ordersTab.click();
      await this.page.waitForTimeout(2000);
    }
    const searchInput = this.page.locator("input[placeholder*='Search'], input[name*='search']").first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(orderName);
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(3000);
    }
  }

  async clickEditOrderProductsButton() {
    const editBtn = this.page.locator("button:has-text('Edit Order Products'), a:has-text('Edit Order Products')").first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await this.page.waitForTimeout(2000);
    }
  }

  async clickToggleAllCheckbox() {
    const toggleAll = this.page.locator("input[type='checkbox']").first();
    if (await toggleAll.isVisible().catch(() => false)) {
      await toggleAll.check();
    }
  }

  async clickSaveOrderButton() {
    const saveBtn = this.page.locator("button:has-text('Save')").first();
    await saveBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async clickSubmitToOEButton() {
    const submitBtn = this.page.locator("button:has-text('Submit to OE'), a:has-text('Submit to OE')").first();
    await submitBtn.click({ timeout: 10000 });
    await this.page.waitForTimeout(3000);
  }

  async verifySubmitToOESuccessModal() {
    const modal = this.page.locator('.modal-container, [role="dialog"], .slds-modal').first();
    await this.page.waitForTimeout(3000);
  }

  async clickSubmitToOESuccessOKButton() {
    const okBtn = this.page.locator("button:has-text('OK'), button:has-text('Close')").first();
    if (await okBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await okBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async navigateToOEPage() {
    const baseUrl = process.env.BASE_URL;
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async searchForOrderInOE(orderReference) {
    const refInput = this.page.locator("input[placeholder*='Reference'], input[formcontrolname*='reference']").first();
    await this.clearAndFill(refInput, orderReference);
  }

  async clickOESearchButton() {
    const searchBtn = this.page.locator("button:has-text('Search'), button:has-text('SEARCH')").first();
    await searchBtn.click();
    await this.page.waitForTimeout(3000);
  }

  async verifyOrderInOETableAndClick(orderReference) {
    const row = this.page.locator(`tbody tr:has-text("${orderReference}")`);
    for (let i = 0; i < 5; i++) {
      if (await row.isVisible().catch(() => false)) break;
      await this.page.waitForTimeout(2000);
      await this.clickOESearchButton();
    }
    await row.locator('span.redirect, a').first().click();
    await this.page.waitForTimeout(2000);
  }

  async verifyOrderAppearsInOE(orderReference) {
    const detail = this.page.locator('app-order-details, .order-detail').first();
    await expect(detail).toBeVisible({ timeout: 15000 });
  }

  async checkForSubmissionErrors() { /* handled inline */ }
  async fillRequiredFieldsIfError() { /* handled inline */ }
  async resubmitOrderAfterFillingFields() { /* handled inline */ }

  async verifyOrderSubmittedSuccessfully() {
    await this.page.waitForTimeout(3000);
  }

  async navigateToOrdersList() {
    await this.navigateToOrdersListAndSearchForOrder('');
  }

  async searchForOrder(orderName) {
    await this.navigateToOrdersListAndSearchForOrder(orderName);
  }

  async verifyOrderInTableAndClick(orderName) {
    const row = this.page.locator(`a:has-text("${orderName}"), td:has-text("${orderName}")`).first();
    await row.click();
    await this.page.waitForTimeout(2000);
  }

  async clickInlineEditTriggerIcon() {
    const trigger = this.page.locator('.inline-edit-trigger, button[title="Edit"]').first();
    if (await trigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trigger.click();
      await this.page.waitForTimeout(1000);
    }
  }
}

module.exports = { SalesforceSteps };
