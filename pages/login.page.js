const { BasePage } = require('./base.page');

class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.usernameInput = page.locator("input[name='username'], input[type='email'], input[id*='username']").first();
    this.passwordInput = page.locator("input[name='password'], input[type='password'], input[id*='password']").first();
    this.loginButton = page.locator("button:has-text('Login'), button:has-text('Sign in'), input[type='submit']").first();
  }
}

module.exports = { LoginPage };
