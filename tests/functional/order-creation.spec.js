const { test } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { getCountryConfig } = require('../../data/constants/country-config');

test.describe('Order Creation', { tag: ['@regression-2', '@module', '@health-check', '@regression', '@functional'] }, () => {
  test('Complete order creation workflow with Quick Add', async ({ authenticatedPage, country }) => {
    const steps = new OrderCreationSteps(authenticatedPage);
    const countryConfig = getCountryConfig(country);
    await steps.verifyOrderEnginePageLoaded();
    await steps.clickCreateOrderButton();
    await steps.searchForAccount();
    await steps.verifyHeaderPageDisplayed();
    await steps.fillCustomerOrderRef();
    await steps.checkAndSelectShipTo();
    if (countryConfig.code === 'FR' || countryConfig.code === 'DE') {
      await steps.checkAndSelectBillTo();
      await steps.checkAndSelectPayer();
    }
    await steps.navigateToHeaderTab();
    await steps.fillMissingHeaderFields();
    if (countryConfig.code === 'DE') {
      await steps.fillMandatoryUDFForDE();
    }
    await steps.navigateToQuickAddTab();
    await steps.verifyQuickAddTabDisplayed();
    await steps.addItemsToQuickAdd();
    await steps.verifyItemsAddedToCart();
    await steps.setUnitSellPriceForAllItems('100');
    await steps.clickRecalcButton();
    await steps.checkForErrors();
    await steps.validateAndSubmitOrder();
    await steps.verifyOrderStatusAfterSubmission();
    await steps.verifyOrderInOrdersList();
  });
});
