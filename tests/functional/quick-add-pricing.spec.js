const { test } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { getCountryConfig } = require('../../data/constants/country-config');

test.describe('Quick Add / Basic Pricing', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test('Test 245731: Quick Add/Basic Pricing', async ({ authenticatedPage, country }) => {
    const steps = new OrderCreationSteps(authenticatedPage);
    const countryConfig = getCountryConfig(country);
    await steps.verifyOrderEnginePageLoaded();
    await steps.clickCreateOrderButton();
    await steps.searchForAccount();
    await steps.verifyHeaderPageDisplayed();
    await steps.fillCustomerOrderRef();
    await steps.checkAndSelectShipTo();
    await steps.navigateToQuickAddTab();
    await steps.verifyQuickAddColumnHeaders();
    await steps.saveOrder();
    await steps.clickEditIcon();
    await steps.exerciseQuickAddSearchButtons(
      countryConfig.mapCcPart,
      countryConfig.item2,
      null,
      countryConfig.quickAddSearchKeyword
    );
    await steps.addTextLineAndVerify();
    await steps.deleteSelectedQuickAddLine();
    await steps.clickRecalcButton();
  });
});
