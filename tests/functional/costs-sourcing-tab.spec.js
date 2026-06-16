const { test } = require('../../fixtures/base.fixture');
const { CostsSourcingSteps } = require('../../steps/orders/costs-sourcing.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Costs & Sourcing Tab', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const createSteps = new CreateOrderSteps(authenticatedPage);
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.fillMandatoryFieldsAndVerify();
    await createSteps.addLineItemsAndValidate();
    await createSteps.submitOrder();
    await authenticatedPage.waitForTimeout(3000);
  });

  test('verify costs sourcing tab displays correctly', async ({ authenticatedPage }) => {
    const steps = new CostsSourcingSteps(authenticatedPage);
    await steps.verifyCostsSourcingTabDisplayed();
    await steps.verifyCostsSourcingTableDisplayed();
    await steps.verifyColumnsDisplayed();
    await steps.verifyDeliveryTypeOptions();
    await steps.verifyCopyOrderButton();
  });
});
