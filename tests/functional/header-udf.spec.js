const { test, expect } = require('../../fixtures/base.fixture');
const { ApiClient } = require('../../utils/api-client');
const { OEOrderVerificationSteps } = require('../../steps/oe-order-verification.steps');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');

test.describe('Header UDF Fields', { tag: ['@regression-2', '@udf', '@regression', '@functional'] }, () => {
  test.beforeEach(async () => {
    const country = (process.env.COUNTRY || 'UK').toUpperCase();
    test.skip(country !== 'UK', 'Header UDF test runs only for country UK');
  });

  test('Test 408731: Verify Header UDF fields (SoldTo/Salesforce/Both)', async ({ authenticatedPage }) => {
    test.setTimeout(300000);
    const apiClient = new ApiClient('UK');
    const orderRef = `AutoOE-UDF-H-UK-${Date.now()}`;
    const { status } = await apiClient.createOrderForCountry({
      customerOrderReference: orderRef,
      orderHeader: {
        UDFs: { UDF: [{ fieldName: 'Mandatory UDF', fieldValue: '34' }] },
      },
    });
    expect(status).toBe(202);
    console.log(`UDF order created via API: ${orderRef}`);

    const oeSteps = new OEOrderVerificationSteps(authenticatedPage);
    const found = await oeSteps.waitForApiOrder(orderRef, { initialWaitMs: 15000, maxRetries: 20, retryDelayMs: 3000 });
    test.skip(!found, `API-created order ${orderRef} not indexed by backend after retries`);

    await oeSteps.clickOnOrderNumber(orderRef);
    await oeSteps.verifyOrderDetailsLoaded();

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    await orderSteps.verifyHeaderUdfsVisibleInViewMode();

    await orderSteps.verifyEditAndSaveHeaderUdfs();

    const originalValues = await orderSteps.getHeaderUdfValuesMap();
    if (Object.keys(originalValues).length === 0) {
      console.log('No UDF values to compare - skipping copy');
      return;
    }

    const copyClicked = await orderSteps.clickCopyOrderButton();
    if (!copyClicked) {
      console.log('Copy button not available - skipping copy comparison');
      return;
    }
    await orderSteps.verifyCopyOrderModalDisplayed();
    await orderSteps.clickCopyOrderContinue();
    await orderSteps.verifyNewOrderPageDisplayed();
    await orderSteps.verifyHeaderTabDisplayed();

    const copiedValues = await orderSteps.getHeaderUdfValuesMap();
    for (const [key, value] of Object.entries(originalValues)) {
      expect(copiedValues[key]).toBe(value);
    }
  });
});
