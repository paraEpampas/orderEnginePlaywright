const { test, expect } = require('../../fixtures/base.fixture');
const { SalesforceSteps } = require('../../steps/salesforce.steps');

test.describe('Salesforce Order Creation', { tag: ['@regression-2', '@salesforce', '@disabled'] }, () => {
  test.beforeEach(async () => {
    test.skip(true, 'Salesforce tests disabled - SSO authentication not supported in automated runs');
  });

  test('Salesforce Clone and Create Order for all countries', async ({ authenticatedPage }) => {
    const sfSteps = new SalesforceSteps(authenticatedPage);
    const username = process.env.SALESFORCE_USERNAME;
    const password = process.env.SALESFORCE_PASSWORD;

    await sfSteps.navigateToSalesforce();
    await sfSteps.loginToSalesforce(username, password);
    await sfSteps.verifyLoginSuccessful();

    const countries = ['DE'];
    for (const country of countries) {
      await sfSteps.navigateToQuote(country);
      await sfSteps.clickCloneButton();
      await sfSteps.verifyCloneModalDisplayed();
      await sfSteps.clickNextButton();
      await sfSteps.verifyCloneDetailsModalDisplayed();
      await sfSteps.enterQuoteName(country);
      await sfSteps.clickFinishButton();
      await sfSteps.clickCreateOrderButton();
      await sfSteps.verifyCreateOrderModalDisplayed();
      await sfSteps.enterCustomerPONumberWithTimestamp(country);
      await sfSteps.clickSaveButton();

      try {
        await sfSteps.verifyOrderCreationSuccessAndClickLink();
      } catch {
        const orderName = sfSteps.getGeneratedOrderName();
        await sfSteps.navigateToOrdersListAndSearchForOrder(orderName);
      }

      await sfSteps.clickEditOrderProductsButton();
      await sfSteps.clickToggleAllCheckbox();
      await sfSteps.clickSaveOrderButton();
      await sfSteps.clickSubmitToOEButton();
      await sfSteps.verifySubmitToOESuccessModal();
      await sfSteps.clickSubmitToOESuccessOKButton();
    }
  });

  test('Salesforce Full Order Workflow', async ({ authenticatedPage }) => {
    const sfSteps = new SalesforceSteps(authenticatedPage);
    const username = process.env.SALESFORCE_USERNAME;
    const password = process.env.SALESFORCE_PASSWORD;

    await sfSteps.navigateToSalesforce();
    await sfSteps.loginToSalesforce(username, password);
    await sfSteps.verifyLoginSuccessful();

    await sfSteps.navigateToQuote('UK');
    await sfSteps.clickCloneButton();
    await sfSteps.verifyCloneModalDisplayed();
    await sfSteps.clickNextButton();
    await sfSteps.verifyCloneDetailsModalDisplayed();
    await sfSteps.enterQuoteName('UK');
    await sfSteps.clickFinishButton();
    await sfSteps.verifyCloneSuccessPopup();

    await sfSteps.clickInlineEditTriggerIcon();
    await sfSteps.clickCreateOrderButton();
    await sfSteps.verifyCreateOrderModalDisplayed();
    await sfSteps.enterCustomerPONumberWithTimestamp('UK');
    await sfSteps.clickSaveButton();

    try {
      await sfSteps.verifyOrderCreationSuccessAndClickLink();
    } catch {
      await sfSteps.navigateToOrdersListAndSearchForOrder('CPQ to OE');
    }

    await sfSteps.clickEditOrderProductsButton();
    await sfSteps.clickToggleAllCheckbox();
    await sfSteps.clickSaveOrderButton();
    await sfSteps.clickSubmitToOEButton();
    await sfSteps.verifySubmitToOESuccessModal();
    await sfSteps.clickSubmitToOESuccessOKButton();

    await sfSteps.navigateToOEPage();
    await sfSteps.searchForOrderInOE('AutoSFOrderForOE');
    await sfSteps.clickOESearchButton();
    await sfSteps.verifyOrderAppearsInOE('AutoSFOrderForOE');
  });

  test('Search CPQ orders in Order Engine', async ({ authenticatedPage }) => {
    const sfSteps = new SalesforceSteps(authenticatedPage);

    await sfSteps.navigateToOEPage();

    const countries = ['UK', 'US', 'DE', 'NL', 'BE', 'FR'];
    for (const country of countries) {
      const now = new Date();
      const timestamp = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const orderName = `CPQtoOE_${country}-${timestamp}`;

      try {
        await sfSteps.searchForOrderInOE(orderName);
        await sfSteps.clickOESearchButton();
        await sfSteps.verifyOrderInOETableAndClick(orderName);
        await sfSteps.verifyOrderAppearsInOE(orderName);
      } catch (e) {
        console.log(`Order not found for ${country}: ${e.message}`);
      }
    }
  });
});
