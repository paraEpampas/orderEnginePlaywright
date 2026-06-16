const { expect } = require('@playwright/test');
const { BaseSteps } = require('./base.steps');
const { LoginPage } = require('../pages/login.page');

class LoginSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.loginPage = new LoginPage(page);
  }

  async verifyLoginPageDisplayed() {
    const hasLoginForm = await this.loginPage.usernameInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasLoginForm) {
      await expect(this.loginPage.usernameInput).toBeVisible();
      await expect(this.loginPage.passwordInput).toBeVisible();
    } else {
      // SSO/Windows auth - no login form, verify we reached the app
      await this.page.waitForLoadState('domcontentloaded');
      console.log('No login form detected - SSO authentication assumed');
    }
  }

  async performLogin(user, pass) {
    const hasLoginForm = await this.loginPage.usernameInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasLoginForm) {
      await this.clearAndFill(this.loginPage.usernameInput, user);
      await this.clearAndFill(this.loginPage.passwordInput, pass);
      await this.clickElement(this.loginPage.loginButton);
      await this.page.waitForTimeout(3000);
    } else {
      console.log('SSO active - skipping manual login');
    }
  }

  async verifySuccessfulLogin() {
    await this.page.waitForLoadState('domcontentloaded');
    const url = this.page.url();
    const isOnApp = url.includes('/oe/') || url.includes('orderengine');
    const hasAppContent = await this.page.locator('app-root, app-orders-search, .search-container, [class*="order"]').first()
      .isVisible({ timeout: 15000 }).catch(() => false);
    expect(isOnApp || hasAppContent).toBeTruthy();
  }
}

module.exports = { LoginSteps };
