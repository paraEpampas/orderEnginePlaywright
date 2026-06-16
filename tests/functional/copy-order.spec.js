const { test } = require('../../fixtures/base.fixture');
const { CopyOrderSteps } = require('../../steps/orders/copy-order.steps');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');

test.describe('Copy Order', { tag: ['@regression-2', '@module', '@health-check', '@regression', '@functional'] }, () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const steps = new OrderCreationSteps(authenticatedPage);
    await steps.verifyOrderEnginePageLoaded();
    await steps.clickCreateOrderButton();
    await steps.searchForAccount();
    await steps.fillCustomerOrderRef();
    await steps.checkAndSelectShipTo();
    await steps.navigateToHeaderTab();
    await steps.fillMissingHeaderFields();
    await steps.navigateToQuickAddTab();
    await steps.addItemsToQuickAdd();
    await steps.setUnitSellPriceForAllItems('100');
    await steps.clickRecalcButton();
    await steps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);
  });

  test('verify copy order button and modal workflow', async ({ authenticatedPage }) => {
    const steps = new CopyOrderSteps(authenticatedPage);
    await steps.verifyCopyOrderButtonVisible();
    await steps.clickCopyOrderButton();
    await steps.verifyCopyOrderModalDisplayed();
    await steps.clickCopyOrderContinue();
    await steps.verifyCopiedOrderDisplayed();
  });
});
