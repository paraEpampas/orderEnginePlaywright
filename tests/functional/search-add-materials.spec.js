const { test } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');

test.describe('Search and Add Materials', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test('Test 245739: Search and add Materials to an Order', async ({ authenticatedPage, country }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);

    await orderSteps.verifyOrderEnginePageLoaded();

    await orderSteps.clickCreateOrderButton();
    await orderSteps.searchForAccount();
    await orderSteps.verifyHeaderPageDisplayed();
    await orderSteps.fillCustomerOrderRefWithValue(`MatSearch-${Date.now()}`);
    await orderSteps.checkAndSelectShipTo();

    if (['FR', 'DE'].includes(country.toUpperCase())) {
      await orderSteps.checkAndSelectBillTo();
    }

    await orderSteps.navigateToQuickAddTab();
    await authenticatedPage.waitForTimeout(1000);

    await orderSteps.searchMaterialByDescAndAdd('laptop');

    await orderSteps.changeLineNumber(0, 1);
    await orderSteps.clickRecalcButton();

    await orderSteps.addTextLineAndVerify();

    await orderSteps.deleteSelectedQuickAddLine();
  });
});
