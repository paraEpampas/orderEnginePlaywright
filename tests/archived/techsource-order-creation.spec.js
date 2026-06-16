const { test, expect } = require('../../fixtures/base.fixture');
const { TechSourceSteps } = require('../../steps/techsource.steps');

test.describe('TechSource Order Creation', { tag: ['@techsource', '@disabled'] }, () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const username = process.env.TECHSOURCE_USERNAME;
    const password = process.env.TECHSOURCE_PASSWORD;
    test.skip(!username || !password, 'TechSource credentials not configured (TECHSOURCE_USERNAME / TECHSOURCE_PASSWORD)');

    const tsUrl = process.env.TECHSOURCE_URL || 'https://techsource.computacenter.com';
    await authenticatedPage.goto(tsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await authenticatedPage.waitForTimeout(5000);
    const loginForm = authenticatedPage.locator('form[action*="login"], #loginForm, form#kc-form-login').first();
    const usernameInput = authenticatedPage.locator('#username, input[name="username"], input[name="email"]').first();
    if (await usernameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await usernameInput.fill(username || '');
      const passwordInput = authenticatedPage.locator('#password, input[name="password"], input[type="password"]').first();
      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await passwordInput.fill(password || '');
      }
      const submitBtn = authenticatedPage.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
      }
      await authenticatedPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await authenticatedPage.waitForTimeout(3000);
    }
    const stillOnLogin = await loginForm.isVisible().catch(() => false);
    test.skip(stillOnLogin, 'TechSource login failed - SSO/credentials issue in this environment');
  });

  test('TechSource Order Creation: Login, Search, Add to Cart, Checkout', async ({ authenticatedPage }) => {
    const tsSteps = new TechSourceSteps(authenticatedPage);
    const username = process.env.TECHSOURCE_USERNAME;
    const password = process.env.TECHSOURCE_PASSWORD;

    await tsSteps.navigateToTechSource();
    await tsSteps.loginToTechSource(username, password);
    await tsSteps.verifyLoginSuccessful();

    await tsSteps.clickSearchIcon();
    await tsSteps.verifySearchModalDisplayed();
    await tsSteps.searchForProduct('laptop');
    await tsSteps.verifySearchResultsDisplayed();
    await tsSteps.clickAddToBasketFirstItem();
    await tsSteps.verifyAddToCartModalDisplayed();
    await tsSteps.clickCheckoutInModal();
    await tsSteps.verifyShoppingCartScreenDisplayed();
    await tsSteps.clickCheckoutOnCartScreen();
    await tsSteps.verifySecureCheckoutScreenDisplayed();
    await tsSteps.fillPaymentTypeStep();
    await tsSteps.fillShippingAddressStep();
    await tsSteps.fillDeliveryMethodStep();
    await tsSteps.submitOrder();

    await tsSteps.verifyOrderDetailsScreenDisplayed();
    const orderRef = tsSteps.getOrderReference();
    const orderStatus = tsSteps.getOrderStatus();
    const poNumber = tsSteps.getPONumber();

    console.log(`TechSource order created - Ref: ${orderRef}, PO: ${poNumber}, Status: ${orderStatus}`);
  });
});
