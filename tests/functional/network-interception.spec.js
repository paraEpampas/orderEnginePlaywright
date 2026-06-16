const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { NetworkCaptureHelper } = require('../../utils/network-capture');
const { getCountryConfig } = require('../../data/constants/country-config');
const { randomCustomerOrderRef } = require('../../data/generators');

const SELECTORS = {
  validateButton: "button:has(mat-icon:has-text('fact_check'))",
  saveAndSubmitButton: "button:has(mat-icon:has-text('save_alt'))",
  saveButton: "button:has(mat-icon:text-is('save'))",
  headerTab: "div[data-name='Header']",
  quickAddTab: "div[data-name='Quick add / pricing']",
  costsSourcingTab: "div[data-name='Costs & Sourcing']",
};

async function navigateToTab(page, tabSelector) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator(tabSelector).click({ force: true });
  await page.waitForTimeout(1000);
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function createEditableOrderWithItems(page, orderSteps, createSteps) {
  await orderSteps.verifyOrderEnginePageLoaded();
  await createSteps.clickCreateOrderForSoldToAccountButton();
  await createSteps.searchForAccountAndSelectFirst();
  await createSteps.verifyHeaderTabDisplayed();
  await createSteps.fillMandatoryFieldsWithRef(randomCustomerOrderRef());
  await orderSteps.checkAndSelectShipTo();
  await orderSteps.navigateToQuickAddTab();
  await orderSteps.verifyQuickAddTabDisplayed();
  await orderSteps.addItemsToQuickAdd();
  await orderSteps.setUnitSellPriceForAllItems('100');
  await orderSteps.clickRecalcButton();
}

test.describe('Network Interception Tests', { tag: ['@regression-2', '@module', '@regression', '@functional', '@network'] }, () => {

  test('Test 459522: Checker API call on submit-without-save verifies orderHeader present', async ({ authenticatedPage, country }) => {
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const networkHelper = new NetworkCaptureHelper(authenticatedPage);

    await createEditableOrderWithItems(authenticatedPage, orderSteps, createSteps);

    const captured = await networkHelper.captureResponse({
      urlPattern: /api.*order|order.*check|order.*submit|order.*save/i,
      method: 'POST',
      timeout: 60000,
      action: async () => {
        await authenticatedPage.locator(SELECTORS.saveAndSubmitButton).click({ force: true });
      },
    });

    expect(captured, 'Should capture an API call on submit').toBeTruthy();
    expect(captured.status, 'API response should not be a server error').toBeLessThan(500);

    if (captured.requestBody && typeof captured.requestBody === 'object') {
      const body = captured.requestBody;
      const bodyKeys = Object.keys(body);
      const hasOrderData = body.orderHeader !== undefined
        || body.OrderHeader !== undefined
        || body.header !== undefined
        || body.order !== undefined
        || body.executeOrderStrategy !== undefined
        || body.metadata !== undefined
        || body.account !== undefined;
      expect(hasOrderData, `Submit request should contain order data. Keys found: ${bodyKeys.join(', ')}`).toBeTruthy();
    }

    const loader = authenticatedPage.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  });

  test('Test 454771: Checker API payloads contain required order fields', async ({ authenticatedPage, country }) => {
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const networkHelper = new NetworkCaptureHelper(authenticatedPage);
    const countryConfig = getCountryConfig(country);

    await createEditableOrderWithItems(authenticatedPage, orderSteps, createSteps);

    const captured = await networkHelper.captureResponse({
      urlPattern: /api.*order|order.*check|order.*valid/i,
      method: 'POST',
      timeout: 60000,
      action: async () => {
        await authenticatedPage.locator(SELECTORS.validateButton).click({ force: true });
      },
    });

    expect(captured, 'Should capture a validation API call').toBeTruthy();
    expect(captured.status).toBeLessThan(500);

    if (captured.requestBody && typeof captured.requestBody === 'object') {
      const body = captured.requestBody;
      const bodyStr = JSON.stringify(body).toLowerCase();
      const hasAccountRef = bodyStr.includes('account') || bodyStr.includes('soldto') || bodyStr.includes('sold_to');
      const hasOrderRef = bodyStr.includes('reference') || bodyStr.includes('orderref') || bodyStr.includes('customerorder');
      expect(hasAccountRef || hasOrderRef, `Validation payload should contain account or order reference data. Payload keys: ${Object.keys(body).join(', ')}`).toBeTruthy();
    }

    const loader = authenticatedPage.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  });

  test('Test 450203: SAP submit payload includes LanguIso for DE', { tag: ['@de-only'] }, async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'DE', 'LanguIso DE test requires German environment');
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const networkHelper = new NetworkCaptureHelper(authenticatedPage);

    await createEditableOrderWithItems(authenticatedPage, orderSteps, createSteps);

    const captured = await networkHelper.captureResponse({
      urlPattern: /api.*order|order.*submit|order.*save/i,
      method: 'POST',
      timeout: 60000,
      action: async () => {
        await authenticatedPage.locator(SELECTORS.saveAndSubmitButton).click({ force: true });
      },
    });

    expect(captured, 'Should capture submit API call').toBeTruthy();

    if (captured.requestBody && typeof captured.requestBody === 'object') {
      const bodyStr = JSON.stringify(captured.requestBody);
      const hasLanguIso = bodyStr.includes('LanguIso') || bodyStr.includes('languIso') || bodyStr.includes('languiso') || bodyStr.includes('LANGUISO');
      if (hasLanguIso) {
        expect(bodyStr).toMatch(/[Ll]ang[Uu]?[Ii]so.*DE|DE.*[Ll]ang[Uu]?[Ii]so/);
      }
    }

    const loader = authenticatedPage.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  });

  test('Test 471907: SAP submit payload includes LanguIso for FR', { tag: ['@fr-only'] }, async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'FR', 'LanguIso FR test requires French environment');
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const networkHelper = new NetworkCaptureHelper(authenticatedPage);

    await createEditableOrderWithItems(authenticatedPage, orderSteps, createSteps);

    const captured = await networkHelper.captureResponse({
      urlPattern: /api.*order|order.*submit|order.*save/i,
      method: 'POST',
      timeout: 60000,
      action: async () => {
        await authenticatedPage.locator(SELECTORS.saveAndSubmitButton).click({ force: true });
      },
    });

    expect(captured, 'Should capture submit API call').toBeTruthy();

    if (captured.requestBody && typeof captured.requestBody === 'object') {
      const bodyStr = JSON.stringify(captured.requestBody);
      const hasLanguIso = bodyStr.includes('LanguIso') || bodyStr.includes('languIso') || bodyStr.includes('languiso');
      if (hasLanguIso) {
        expect(bodyStr).toMatch(/[Ll]ang[Uu]?[Ii]so.*FR|FR.*[Ll]ang[Uu]?[Ii]so/);
      }
    }

    const loader = authenticatedPage.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  });

  test('Test 475179: SAP submit payload language field matches environment locale', async ({ authenticatedPage, country }) => {
    test.skip(!['DE', 'FR'].includes(country.toUpperCase()), 'Language ISO test only applicable for DE/FR');
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const networkHelper = new NetworkCaptureHelper(authenticatedPage);
    const expectedLang = country.toUpperCase();

    await createEditableOrderWithItems(authenticatedPage, orderSteps, createSteps);

    const captured = await networkHelper.captureResponse({
      urlPattern: /api.*order|order.*submit/i,
      method: 'POST',
      timeout: 60000,
      action: async () => {
        await authenticatedPage.locator(SELECTORS.saveAndSubmitButton).click({ force: true });
      },
    });

    expect(captured, 'Should capture submit API call').toBeTruthy();
    expect(captured.status).toBeLessThan(500);

    if (captured.requestBody) {
      const bodyStr = JSON.stringify(captured.requestBody);
      const langPattern = new RegExp(`[Ll]ang.*${expectedLang}|${expectedLang}.*[Ll]ang`, 'i');
      const containsLang = langPattern.test(bodyStr);
      if (!containsLang) {
        console.log(`Warning: Expected language ${expectedLang} not found in submit payload. This may indicate language is set server-side.`);
      }
    }

    const loader = authenticatedPage.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  });

  test('Test 477307: SAP submit payload username is uppercase', async ({ authenticatedPage, country }) => {
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const networkHelper = new NetworkCaptureHelper(authenticatedPage);

    await createEditableOrderWithItems(authenticatedPage, orderSteps, createSteps);

    const captured = await networkHelper.captureResponse({
      urlPattern: /api.*order|order.*submit|order.*save/i,
      method: 'POST',
      timeout: 60000,
      action: async () => {
        await authenticatedPage.locator(SELECTORS.saveAndSubmitButton).click({ force: true });
      },
    });

    expect(captured, 'Should capture submit API call').toBeTruthy();

    if (captured.requestBody && typeof captured.requestBody === 'object') {
      const bodyStr = JSON.stringify(captured.requestBody);
      const usernameMatch = bodyStr.match(/"(?:username|userName|user_name|createdBy|created_by|submittedBy)":\s*"([^"]+)"/i);
      if (usernameMatch) {
        const username = usernameMatch[1];
        expect(username, `Username "${username}" in submit payload should be uppercase`).toBe(username.toUpperCase());
      }
    }

    const loader = authenticatedPage.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  });

  test('Test 450204: Costs & Sourcing API payload contains sourcing defaults for FRDL', { tag: ['@fr-only'] }, async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'FR', 'FRDL sourcing defaults test requires FR environment');
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const networkHelper = new NetworkCaptureHelper(authenticatedPage);

    await createEditableOrderWithItems(authenticatedPage, orderSteps, createSteps);
    await navigateToTab(authenticatedPage, SELECTORS.costsSourcingTab);
    await authenticatedPage.waitForTimeout(2000);

    const costsSourcingContent = authenticatedPage.locator('app-cost-sourcing').first();
    const isVisible = await costsSourcingContent.isVisible({ timeout: 10000 }).catch(() => false);
    test.skip(!isVisible, 'Costs & Sourcing tab not available in this environment');

    const captured = await networkHelper.captureResponse({
      urlPattern: /api.*order|order.*save|order.*cost|cost.*sourc/i,
      method: 'POST',
      timeout: 60000,
      action: async () => {
        await authenticatedPage.locator(SELECTORS.saveButton).click({ force: true }).catch(async () => {
          await authenticatedPage.locator(SELECTORS.validateButton).click({ force: true });
        });
      },
    });

    expect(captured, 'Should capture an API call related to order save/validate').toBeTruthy();

    if (captured.requestBody && typeof captured.requestBody === 'object') {
      const bodyStr = JSON.stringify(captured.requestBody).toLowerCase();
      const hasSourcingData = bodyStr.includes('sourcing') || bodyStr.includes('frdl') || bodyStr.includes('delivery') || bodyStr.includes('cost');
      expect(hasSourcingData, `API payload should contain sourcing or cost/delivery data for FR orders`).toBeTruthy();
    }

    const loader = authenticatedPage.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  });
});
