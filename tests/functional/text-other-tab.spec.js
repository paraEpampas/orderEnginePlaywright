const { test } = require('../../fixtures/base.fixture');
const { TextOtherSteps } = require('../../steps/orders/text-other.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Text/Other Tab', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const createSteps = new CreateOrderSteps(authenticatedPage);
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.fillMandatoryFieldsAndVerify();
    await createSteps.submitOrder();
    await authenticatedPage.waitForTimeout(2000);
  });

  test('verify text/other tab displays correctly', async ({ authenticatedPage }) => {
    const steps = new TextOtherSteps(authenticatedPage);
    await steps.verifyTextOtherTabDisplayed();
    await steps.verifyTextOtherTableDisplayed();
  });
});
