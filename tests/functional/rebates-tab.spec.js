const { test } = require('../../fixtures/base.fixture');
const { RebatesSteps } = require('../../steps/orders/rebates.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Rebates Tab', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const createSteps = new CreateOrderSteps(authenticatedPage);
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.fillMandatoryFieldsAndVerify();
    await createSteps.submitOrder();
    await authenticatedPage.waitForTimeout(2000);
  });

  test('verify rebates tab displays correctly', async ({ authenticatedPage }) => {
    const steps = new RebatesSteps(authenticatedPage);
    await steps.verifyRebatesTabDisplayed();
    await steps.verifyRebatesTableDisplayed();
  });
});
