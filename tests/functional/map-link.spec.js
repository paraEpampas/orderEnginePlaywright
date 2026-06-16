const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');

test.describe('MAP Link', { tag: ['@regression-2', '@smoke', '@health-check', '@regression', '@functional'] }, () => {
  test('MAP Link Functionality - verify MAP link opens and SAP number extraction', async ({ authenticatedPage }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);

    await orderSteps.verifyOrderEnginePageLoaded();
    await orderSteps.clickCreateOrderButton();
    await orderSteps.searchForAccount();
    await orderSteps.verifyHeaderPageDisplayed();
    await orderSteps.fillCustomerOrderRefForBulkUpload();
    await orderSteps.checkAndSelectShipTo();
    await orderSteps.navigateToHeaderTab();
    await orderSteps.fillMissingHeaderFields();
    await orderSteps.navigateToQuickAddTab();
    await orderSteps.verifyQuickAddTabDisplayed();

    await orderSteps.addItemsToQuickAdd();
    await orderSteps.verifyQuickAddItemsInCart();

    await orderSteps.clickCCPartNumber();
    await orderSteps.verifyMAPLinkOpened();

    const matNumber = await orderSteps.extractMatNumber();
    await orderSteps.closeMAPTab();

    await orderSteps.saveOrder();

    console.log(`SAP/MAT number extracted: ${matNumber}`);
    expect(matNumber).toBeTruthy();
  });
});
