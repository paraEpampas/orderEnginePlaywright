const { test } = require('../../fixtures/base.fixture');
const { BlockingGroupingSteps } = require('../../steps/orders/blocking-grouping.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Blocking & Grouping Tab', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const createSteps = new CreateOrderSteps(authenticatedPage);
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.fillMandatoryFieldsAndVerify();
    await createSteps.submitOrder();
    await authenticatedPage.waitForTimeout(2000);
  });

  test('verify blocking grouping tab displays correctly', async ({ authenticatedPage }) => {
    const steps = new BlockingGroupingSteps(authenticatedPage);
    await steps.verifyBlockingGroupingTabDisplayed();
    await steps.verifyBlockingGroupingTableDisplayed();
  });
});
