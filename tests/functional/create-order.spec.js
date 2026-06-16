const { test } = require('../../fixtures/base.fixture');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Create Order', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test('Test 245666: Create a new Order - full workflow', async ({ authenticatedPage }) => {
    const steps = new CreateOrderSteps(authenticatedPage);
    await steps.clickCreateOrderForSoldToAccountButton();
    await steps.verifySelectAccountWindowDisplayed();
    await steps.verifyAllFieldsDisplayed();
    await steps.verifyAllColumnsDisplayed();
    await steps.searchForAccountAndSelectFirst();
    await steps.verifyHeaderTabDisplayed();
    await steps.verifyAllHeaderTabFieldsDisplayed();
    await steps.fillMandatoryFieldsAndVerify();
    await steps.fullSubmitOrder();
    await steps.verifyEditIconDisplayed();
    await steps.verifyOrderInOrdersList();
  });
});
