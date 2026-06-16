const { test } = require('../../fixtures/base.fixture');
const { BulkUploadSteps } = require('../../steps/orders/bulk-upload.steps');
const path = require('path');
const fs = require('fs');

test.describe('Bulk Upload', { tag: ['@regression-2', '@module', '@health-check', '@regression', '@functional'] }, () => {
  test.describe.configure({ timeout: 300000 });

  test('verify bulk upload workflow with Excel file', async ({ authenticatedPage, country }) => {
    const countryCode = country || process.env.COUNTRY || 'UK';
    const bulkUploadFilePath = path.join(__dirname, '..', '..', 'test-data', 'bulk-upload', `${countryCode} Bulk Upload.xlsx`);
    test.skip(
      !fs.existsSync(bulkUploadFilePath),
      `Bulk upload Excel file not found at test-data/bulk-upload/${countryCode} Bulk Upload.xlsx — place the country-specific template file to run this test`,
    );

    const steps = new BulkUploadSteps(authenticatedPage);
    await steps.verifyOrderEngineLoaded();
    await steps.clickCreateOrder();
    await steps.searchForAccountAndSelect();
    await steps.completeMandatoryHeaderSetup();
    await steps.navigateToQuickAddTab();
    await steps.clickUploadButton();
    await steps.uploadExcelFile(bulkUploadFilePath);
    await steps.verifyItemsLoadedFromExcel();
    await steps.validateAndSubmitOrder();
  });
});
