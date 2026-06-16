const { test } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Change Currency', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test('Test 245974: Create order for sold to Account / change the currency', async ({ authenticatedPage }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await orderSteps.verifyOrderEnginePageLoaded();

    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.verifySelectAccountWindowDisplayed();

    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.verifyHeaderTabDisplayed();
    await createSteps.fillMandatoryFieldsAndVerify();

    await orderSteps.navigateToQuickAddTab();
    await orderSteps.verifyQuickAddTabDisplayed();
    await orderSteps.addItemsToQuickAdd();

    const initialUnitSell = await orderSteps.getUnitSellPriceFromFirstRow();
    const initialCost = await orderSteps.getCostValueFromFirstRow();
    const soldToCurrency = await orderSteps.getSoldToAccountCurrency();

    const newCurrency = soldToCurrency === 'GBP' ? 'EUR' : soldToCurrency === 'EUR' ? 'USD' : 'GBP';
    await orderSteps.changeOrderCurrency(newCurrency);
    await authenticatedPage.waitForTimeout(2000);

    const updatedCost = await orderSteps.getCostValueFromFirstRow();
    await orderSteps.verifyCostCurrencyUnchanged(initialCost, soldToCurrency);
  });
});
