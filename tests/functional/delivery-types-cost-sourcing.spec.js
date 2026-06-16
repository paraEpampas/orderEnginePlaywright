const { test } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { CostsSourcingSteps } = require('../../steps/orders/costs-sourcing.steps');

test.describe('Delivery Types Cost Sourcing', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test('Test 408904: Delivery types in Cost & Source Tab', async ({ authenticatedPage }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const costsSteps = new CostsSourcingSteps(authenticatedPage);

    await orderSteps.verifyOrderEnginePageLoaded();

    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.verifySelectAccountWindowDisplayed();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.verifyHeaderTabDisplayed();
    await createSteps.fillMandatoryFieldsAndVerify();

    await orderSteps.navigateToQuickAddTab();
    await orderSteps.verifyQuickAddTabDisplayed();
    await orderSteps.addItemsToQuickAdd();

    await costsSteps.navigateToCostsSourcingTab();
    await costsSteps.verifyCostsSourcingTabDisplayed();

    await costsSteps.selectDeliveryType('DD');
    await costsSteps.verifyDeliveryTypeInViewMode('DD');

    await costsSteps.selectDeliveryType('BB');

    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    await costsSteps.navigateToCostsSourcingTab();
    await costsSteps.verifyCostsSourcingTabDisplayed();
    await costsSteps.verifyDeliveryTypeInViewMode('BB');
  });
});
