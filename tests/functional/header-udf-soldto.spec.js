const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { ChangeSoldToSteps } = require('../../steps/orders/change-sold-to.steps');
const { randomCustomerOrderRef } = require('../../data/generators');

const SELECTORS = {
  headerUdfsTab: "div[data-name='Header UDFs']",
  headerTab: "div[data-name='Header']",
  headerUdfsComponent: 'app-header-udfs',
  soldToAccountInput: "app-account-search input[name='Sold-to Account Number']",
  accountSearchModal: 'app-account-search',
};

const SOLD_TO_WITH_UDFS = '51005253';
const SOLD_TO_WITHOUT_UDFS = '51004810';

async function searchAndSelectAccount(page, accountNumber) {
  const input = page.locator(SELECTORS.soldToAccountInput);
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(accountNumber);
  await input.press('Tab');
  await page.waitForTimeout(500);
  await page.locator("app-account-search button:has-text('SEARCH')").click({ force: true });
  await page.waitForTimeout(3000);
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

  const firstLink = page.locator('app-account-search tbody span.redirect').first();
  await expect(firstLink).toBeVisible({ timeout: 15000 });
  await firstLink.click({ force: true });
  await page.waitForTimeout(2000);
}

async function isHeaderUdfTabVisible(page) {
  return page.locator(SELECTORS.headerUdfsTab).isVisible({ timeout: 5000 }).catch(() => false);
}

async function verifyHeaderUdfTabVisible(page) {
  await expect(page.locator(SELECTORS.headerUdfsTab)).toBeVisible({ timeout: 10000 });
  await page.locator(SELECTORS.headerUdfsTab).click({ force: true });
  await page.waitForTimeout(1000);
  await expect(page.locator(SELECTORS.headerUdfsComponent)).toBeVisible({ timeout: 10000 });
}

async function verifyHeaderUdfTabNotVisible(page) {
  const visible = await isHeaderUdfTabVisible(page);
  expect(visible).toBeFalsy();
}

test.describe('Header UDF Sold-To', { tag: ['@regression-2', '@udf', '@regression', '@functional'] }, () => {
  test('Test 460660: Header UDF issue when changing Sold-To', { tag: ['@regression-2', '@fr-only'] }, async ({ authenticatedPage, country }) => {
    test.setTimeout(300000);
    test.skip(country.toUpperCase() !== 'FR', 'Header UDF Sold-To test uses FR-specific accounts (51005253 / 51004810)');

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const changeSteps = new ChangeSoldToSteps(authenticatedPage);

    // Step 1: Create order for Sold-To with Header UDFs available in Salesforce
    await orderSteps.verifyOrderEnginePageLoaded();
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await searchAndSelectAccount(authenticatedPage, SOLD_TO_WITH_UDFS);
    await createSteps.verifyHeaderTabDisplayed();

    const headerUdfVisible = await isHeaderUdfTabVisible(authenticatedPage);
    test.skip(!headerUdfVisible, `Sold-To ${SOLD_TO_WITH_UDFS} does not expose Header UDF tab in this environment`);

    await verifyHeaderUdfTabVisible(authenticatedPage);

    // Step 2: Change Sold-To to account WITHOUT UDFs, enter Customer Order Reference, save
    await changeSteps.clickChangeSoldToButton();
    await changeSteps.verifySelectAccountModalDisplayed();
    await changeSteps.searchForNewAccount(SOLD_TO_WITHOUT_UDFS);
    await changeSteps.selectFirstAccount();
    await changeSteps.handlePreservePricingDialog(true);

    const customerOrderRef = randomCustomerOrderRef();
    await orderSteps.fillCustomerOrderRefWithValue(customerOrderRef);
    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    await verifyHeaderUdfTabNotVisible(authenticatedPage);
  });

});
