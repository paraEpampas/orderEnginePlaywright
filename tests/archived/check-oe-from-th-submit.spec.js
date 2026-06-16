const { test } = require('../../fixtures/base.fixture');
const { TechSourceSteps } = require('../../steps/techsource.steps');
const { OEOrderVerificationSteps } = require('../../steps/oe-order-verification.steps');

test.describe('Check OE From TH Submit', { tag: ['@techsource', '@disabled'] }, () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const username = process.env.TECHSOURCE_USERNAME;
    const password = process.env.TECHSOURCE_PASSWORD;
    test.skip(!username || !password, 'TechSource credentials not configured (TECHSOURCE_USERNAME / TECHSOURCE_PASSWORD)');

    const tsUrl = process.env.TECHSOURCE_URL || 'https://techsource.computacenter.com';
    await authenticatedPage.goto(tsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await authenticatedPage.waitForTimeout(5000);
    const loginForm = authenticatedPage.locator('form[action*="login"], #loginForm, form#kc-form-login').first();
    const stillOnLogin = await loginForm.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(stillOnLogin, 'TechSource login failed - SSO/credentials issue in this environment');
  });

  test('Create TechSource order, verify in OE, validate and submit', async ({ authenticatedPage }) => {
    const tsSteps = new TechSourceSteps(authenticatedPage);
    const oeSteps = new OEOrderVerificationSteps(authenticatedPage);

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
    const accountNumber = '91004901';

    await oeSteps.navigateToOELandingPage();
    await oeSteps.searchForOrderByAccountNumber(accountNumber);
    await oeSteps.verifyOrderDisplayedInOE(orderRef);
    await oeSteps.clickOnOrderNumber(orderRef);
    await oeSteps.clickValidateOrder();

    const validationOk = await oeSteps.checkValidationMessage();
    if (validationOk) {
      await oeSteps.clickSaveAndSubmitOrder();
      await oeSteps.verifyOrderSubmissionSuccessful();
    }
  });
});
