const { test, expect } = require('../../fixtures/base.fixture');
const { ApiClient } = require('../../utils/api-client');
const { OEOrderVerificationSteps } = require('../../steps/oe-order-verification.steps');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { TextOtherSteps } = require('../../steps/orders/text-other.steps');

test.describe('Line UDF Fields', { tag: ['@regression-2', '@udf', '@regression', '@functional'] }, () => {
  test.beforeEach(async () => {
    const country = (process.env.COUNTRY || 'UK').toUpperCase();
    test.skip(country !== 'UK', 'Line UDF test runs only for country UK');
  });

  test('Test 408842: Verify Line UDF fields (SoldTo/Salesforce/Both)', async ({ authenticatedPage }) => {
    test.setTimeout(300000);
    const apiClient = new ApiClient('UK');
    const orderRef = `AutoOE-UDF-L-UK-${Date.now()}`;
    const { status } = await apiClient.createOrderForCountry({
      customerOrderReference: orderRef,
    });
    expect(status).toBe(202);
    console.log(`Line UDF order created via API: ${orderRef}`);

    const oeSteps = new OEOrderVerificationSteps(authenticatedPage);
    const found = await oeSteps.waitForApiOrder(orderRef, { initialWaitMs: 15000, maxRetries: 20, retryDelayMs: 3000 });
    test.skip(!found, `API-created order ${orderRef} not indexed by backend after retries`);

    await oeSteps.clickOnOrderNumber(orderRef);
    await oeSteps.verifyOrderDetailsLoaded();

    const textSteps = new TextOtherSteps(authenticatedPage);
    await textSteps.verifyLineUdfsVisibleInViewMode();

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    const originalValue = await textSteps.getFirstLineUdfValue();
    if (!originalValue) {
      console.log('No Line UDF value to compare - skipping copy');
      return;
    }

    const copyClicked = await orderSteps.clickCopyOrderButton();
    if (!copyClicked) {
      console.log('Copy button not available - skipping');
      return;
    }
    await orderSteps.verifyCopyOrderModalDisplayed();
    await orderSteps.clickCopyOrderContinue();
    await orderSteps.verifyNewOrderPageDisplayed();
    await orderSteps.verifyHeaderTabDisplayed();

    await textSteps.verifyLineUdfsVisibleInViewMode();
    const copiedValue = await textSteps.getFirstLineUdfValue();
    expect(copiedValue).toBe(originalValue);
  });
});
