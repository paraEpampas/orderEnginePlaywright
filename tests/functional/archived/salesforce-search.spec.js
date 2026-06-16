const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { getCountryConfig } = require('../../data/constants/country-config');

const SELECTORS = {
  overlayPane: '.cdk-overlay-pane',
  searchResultsTable: '.cdk-overlay-container tbody tr, mat-dialog-container tbody tr',
  noResultsMessage: ':text-matches("No results found", "i")',
};

const SF_SEARCH = {
  caseKeyword: process.env.SF_CASE_KEYWORD || '',
  opportunityKeyword: process.env.SF_OPPORTUNITY_KEYWORD || '',
  contactKeyword: process.env.SF_CONTACT_KEYWORD || '',
};

async function triggerSalesforceSearch(page, fieldLabelPattern, keyword) {
  const fieldSection = page.locator('div, oe-input, oe-field').filter({
    has: page.locator(`:text-matches("${fieldLabelPattern}", "i")`),
  }).first();

  const keywordInput = fieldSection.locator('input:not([disabled])').first()
    .or(page.locator(`input[formcontrolname*="keyword"], input[placeholder*="Keyword"]`).filter({
      has: page.locator(`xpath=ancestor::*[contains(., "${fieldLabelPattern.split('|')[0]}")]`),
    }).first());

  if (keyword && await keywordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await keywordInput.clear();
    await keywordInput.fill(keyword);
    await keywordInput.press('Tab');
    await page.waitForTimeout(500);
  }

  const searchBtn = fieldSection.locator('button:has-text("SEARCH"), button:has-text("Search")').first()
    .or(page.locator('button:has-text("SEARCH")').filter({
      has: page.locator(`xpath=ancestor::*[contains(., "${fieldLabelPattern.split('|')[0]}")]`),
    }).first());

  await searchBtn.click({ force: true });
  await page.waitForTimeout(3000);
}

async function assertSearchPopupHasResults(page) {
  const overlay = page.locator(SELECTORS.overlayPane).last();
  await expect(overlay).toBeVisible({ timeout: 10000 });
  const noResults = overlay.locator(SELECTORS.noResultsMessage);
  await expect(noResults).not.toBeVisible({ timeout: 5000 });
  const resultRow = page.locator(SELECTORS.searchResultsTable).first();
  await expect(resultRow).toBeVisible({ timeout: 10000 });
}

async function selectFirstSearchResult(page) {
  const resultRow = page.locator(SELECTORS.searchResultsTable).first();
  await resultRow.click({ force: true });
  await page.waitForTimeout(1000);
  const selectBtn = page.locator('.cdk-overlay-container button:has-text("Select"), mat-dialog-container button:has-text("SELECT"), .cdk-overlay-container button:has-text("OK")').first();
  if (await selectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await selectBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }
}

async function getDisplayFieldValue(page, fieldLabelPattern) {
  const field = page.locator('div, span, input').filter({
    has: page.locator(`:text-matches("${fieldLabelPattern}", "i")`),
  }).first();
  const displayInput = field.locator('input[disabled], input[readonly], .ng-value-label, span.redirect').first();
  if (await displayInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    return ((await displayInput.inputValue().catch(() => '')) || (await displayInput.textContent()) || '').trim();
  }
  return '';
}

async function triggerContactSearch(page, keyword) {
  const orderedBySection = page.locator('div').filter({
    has: page.locator(':text("Customer Ordered By Information")'),
  }).first();

  const searchBtn = orderedBySection.locator('button:has-text("SEARCH"), button:has-text("Search")').first();
  if (keyword) {
    const contactInput = orderedBySection.locator('input:not([disabled])').first();
    if (await contactInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contactInput.fill(keyword);
      await contactInput.press('Tab');
      await page.waitForTimeout(500);
    }
  }
  await searchBtn.click({ force: true });
  await page.waitForTimeout(3000);
}

async function assertContactFieldsDisplayOnly(page) {
  const orderedBySection = page.locator('div').filter({
    has: page.locator(':text("Customer Ordered By Information")'),
  }).first();
  const inputs = orderedBySection.locator('input');
  const count = await inputs.count();
  let disabledCount = 0;
  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    const isDisabled = await input.isDisabled().catch(() => false);
    const isReadonly = await input.getAttribute('readonly').catch(() => null);
    if (isDisabled || isReadonly !== null) disabledCount++;
  }
  expect(disabledCount).toBeGreaterThan(0);
}

test.describe('Salesforce Search', { tag: ['@regression-2', '@module', '@regression', '@functional', '@salesforce'] }, () => {
  test('Test 459524: OE not retrieving Cases, Opportunities, Contacts from Salesforce', async ({ authenticatedPage, country }) => {
    /*
     * Pre-condition: Sold-To must have existing Salesforce Cases, Opportunities, and Contacts.
     * Configure keywords via SF_CASE_KEYWORD, SF_OPPORTUNITY_KEYWORD, SF_CONTACT_KEYWORD env vars.
     */
    const countryConfig = getCountryConfig(country);
    if (!SF_SEARCH.caseKeyword && !SF_SEARCH.opportunityKeyword && !SF_SEARCH.contactKeyword) {
      test.skip(true, 'Requires SF_CASE_KEYWORD, SF_OPPORTUNITY_KEYWORD, and/or SF_CONTACT_KEYWORD env vars for search criteria');
    }

    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    // Step 1: Start manual order creation with Sold-To that has SF entities
    await orderSteps.verifyOrderEnginePageLoaded();
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.verifyHeaderTabDisplayed();
    console.log(`Using Sold-To account ${countryConfig.accounts} — must have Cases, Opportunities, Contacts in Salesforce`);

    let caseId = '';
    let opportunityId = '';
    let contactPopulated = false;

    // Steps 2-3: Salesforce Case ID search and selection
    if (SF_SEARCH.caseKeyword) {
      await triggerSalesforceSearch(authenticatedPage, 'Salesforce Case|Case ID', SF_SEARCH.caseKeyword);
      await assertSearchPopupHasResults(authenticatedPage);
      await selectFirstSearchResult(authenticatedPage);
      caseId = await getDisplayFieldValue(authenticatedPage, 'Salesforce Case|Case ID');
      expect(caseId.length).toBeGreaterThan(0);
      console.log(`Salesforce Case ID populated: ${caseId}`);
    }

    // Steps 4-5: Salesforce Opportunity ID search and selection
    if (SF_SEARCH.opportunityKeyword) {
      await triggerSalesforceSearch(authenticatedPage, 'Opportunity|Opportunity ID', SF_SEARCH.opportunityKeyword);
      await assertSearchPopupHasResults(authenticatedPage);
      await selectFirstSearchResult(authenticatedPage);
      opportunityId = await getDisplayFieldValue(authenticatedPage, 'Opportunity|Opportunity ID');
      expect(opportunityId.length).toBeGreaterThan(0);
      console.log(`Salesforce Opportunity ID populated: ${opportunityId}`);
    }

    // Steps 6-7: Customer Ordered By Contact search and selection
    if (SF_SEARCH.contactKeyword) {
      await triggerContactSearch(authenticatedPage, SF_SEARCH.contactKeyword);
      await assertSearchPopupHasResults(authenticatedPage);
      await selectFirstSearchResult(authenticatedPage);
      await assertContactFieldsDisplayOnly(authenticatedPage);
      contactPopulated = true;
      console.log('Salesforce Contact linked — Customer Ordered By fields are display-only');
    }

    // Step 8: Verify Case, Opportunity, and Contact all retrieved correctly
    if (SF_SEARCH.caseKeyword) expect(caseId.length).toBeGreaterThan(0);
    if (SF_SEARCH.opportunityKeyword) expect(opportunityId.length).toBeGreaterThan(0);
    if (SF_SEARCH.contactKeyword) expect(contactPopulated).toBeTruthy();
  });
});
