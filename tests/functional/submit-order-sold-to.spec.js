const { test } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Submit Order Sold To Account', { tag: ['@regression-2', '@module', '@regression', '@functional', '@uk-only'] }, () => {
  test('Test 245977: Submit a new created Order for Sold-to Account', async ({ authenticatedPage }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await orderSteps.verifyOrderEnginePageLoaded();

    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.verifySelectAccountWindowDisplayed();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.verifyHeaderTabDisplayed();
    await createSteps.fillMandatoryFieldsAndVerify();

    await createSteps.addLineItemsAndValidate();
    await orderSteps.clickSaveAndSubmitButton();
    await authenticatedPage.waitForTimeout(3000);

    await orderSteps.verifyOrderIsReadOnlyAfterSubmission();

    await createSteps.registerOrderForDeferredSapVerification();
  });
});
