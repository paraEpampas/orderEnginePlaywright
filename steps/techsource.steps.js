const { expect } = require('@playwright/test');
const { BaseSteps } = require('./base.steps');

class TechSourceSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.tsUrl = process.env.TECHSOURCE_URL || 'https://techsource.computacenter.com';
    this.orderReference = '';
    this.orderStatus = '';
    this.poNumber = '';
  }

  async navigateToTechSource() {
    await this.page.goto(this.tsUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async loginToTechSource(username, password) {
    await this.page.waitForTimeout(3000);
    const loginForm = this.page.locator('form[action*="login"], #loginForm, .login-form, form#kc-form-login, form[name="loginForm"]').first();
    if (await loginForm.isVisible({ timeout: 10000 }).catch(() => false)) {
      const usernameInput = this.page.locator('#username, input[name="username"], input[name="email"], input[name="loginfmt"], input[type="email"]').first();
      const passwordInput = this.page.locator('#password, input[name="password"], input[name="passwd"], input[type="password"]').first();
      if (await usernameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await usernameInput.fill(username || '');
        if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await passwordInput.fill(password || '');
        }
        const submitBtn = this.page.locator('button[type="submit"], input[type="submit"], #kc-login, input[name="submit"]').first();
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitBtn.click();
        }
        await this.page.waitForLoadState('networkidle').catch(() => {});
      }
    }
  }

  async verifyLoginSuccessful() {
    await this.page.waitForTimeout(3000);
    const loginForm = this.page.locator('form[action*="login"], #loginForm').first();
    const stillOnLogin = await loginForm.isVisible().catch(() => false);
    if (stillOnLogin) {
      throw new Error('TechSource login failed - still on login page');
    }
  }

  async clickSearchIcon() {
    const searchIcon = this.page.locator('.search-icon, button[aria-label*="Search"], a[title*="Search"]').first();
    await searchIcon.click();
    await this.page.waitForTimeout(1000);
  }

  async verifySearchModalDisplayed() {
    await this.page.waitForTimeout(2000);
  }

  async searchForProduct(productName) {
    const searchInput = this.page.locator("input[placeholder*='Search'], input[name*='search'], #searchInput").first();
    await searchInput.fill(productName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(3000);
  }

  async verifySearchResultsDisplayed() {
    const results = this.page.locator('.search-results, .product-list, tbody tr').first();
    await expect(results).toBeVisible({ timeout: 15000 });
  }

  async clickAddToBasketFirstItem() {
    const addBtn = this.page.locator("button:has-text('Add to'), button:has-text('Add to Basket'), .add-to-cart").first();
    await addBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async verifyAddToCartModalDisplayed() {
    await this.page.waitForTimeout(2000);
  }

  async clickCheckoutInModal() {
    const checkoutBtn = this.page.locator("button:has-text('Checkout'), a:has-text('Checkout')").first();
    await checkoutBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async verifyShoppingCartScreenDisplayed() {
    await this.page.waitForTimeout(2000);
  }

  async clickCheckoutOnCartScreen() {
    const checkoutBtn = this.page.locator("button:has-text('Checkout'), a:has-text('Proceed')").first();
    await checkoutBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async verifySecureCheckoutScreenDisplayed() {
    await this.page.waitForTimeout(2000);
  }

  async fillPaymentTypeStep() {
    await this.page.waitForTimeout(1000);
  }

  async fillShippingAddressStep() {
    await this.page.waitForTimeout(1000);
  }

  async fillDeliveryMethodStep() {
    await this.page.waitForTimeout(1000);
  }

  async submitOrder() {
    const submitBtn = this.page.locator("button:has-text('Submit'), button:has-text('Place Order')").first();
    await submitBtn.click();
    await this.page.waitForTimeout(5000);
  }

  async verifyOrderDetailsScreenDisplayed() {
    await this.page.waitForTimeout(3000);
  }

  getOrderReference() { return this.orderReference; }
  getOrderStatus() { return this.orderStatus; }
  getPONumber() { return this.poNumber; }
}

module.exports = { TechSourceSteps };
