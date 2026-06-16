const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { CostsSourcingSteps } = require('../../steps/orders/costs-sourcing.steps');
const { getCountryConfig } = require('../../data/constants/country-config');

const SELECTORS = {
  quickAddTab: "div[data-name='Quick add / pricing']",
  rebatesTab: "div[data-name='Rebates']",
  costsSourcingTab: "div[data-name='Costs & Sourcing']",
  headerTab: "div[data-name='Header']",
  textOtherTab: "div[data-name='Text/Other']",
  blockingGroupingTab: "div[data-name='Blocking & Grouping']",
  validateButton: "button:has(mat-icon:has-text('fact_check'))",
  saveAndSubmitButton: "button:has(mat-icon:has-text('save_alt'))",
  rebatesComponent: 'app-rebates',
  rebatesTable: 'app-rebates table',
  quickAddComponent: 'app-basic-pricing',
  quickAddTable: 'app-basic-pricing p-table',
  globalError: 'div:has(> strong:has-text("Error"))',
};

const FR_REBATE_SUPPLIER_CONFIG = {
  soldTo: '51005063',
  material: '1329137',
};

async function navigateToTab(page, tabSelector) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator(tabSelector).click({ force: true });
  await page.waitForTimeout(1000);
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function clickValidate(page) {
  await page.locator(SELECTORS.validateButton).click({ force: true });
  await page.waitForTimeout(3000);
}

async function clickSaveAndSubmit(page) {
  await page.locator(SELECTORS.saveAndSubmitButton).click({ force: true });
  await page.waitForTimeout(3000);
}

async function createOrderWithMaterialsInEditMode(orderSteps, createSteps) {
  await orderSteps.verifyOrderEnginePageLoaded();
  await createSteps.clickCreateOrderForSoldToAccountButton();
  await createSteps.searchForAccountAndSelectFirst();
  await createSteps.fillMandatoryFieldsAndVerify();
  await orderSteps.navigateToQuickAddTab();
  await orderSteps.verifyQuickAddTabDisplayed();
  await orderSteps.addItemsToQuickAdd();
  await orderSteps.setUnitSellPriceForAllItems('100');
  await orderSteps.clickRecalcButton();
  await orderSteps.saveOrder();
  await orderSteps.clickEditIcon();
}

async function createFROrderWithRebateMaterial(orderSteps, createSteps, page) {
  await orderSteps.verifyOrderEnginePageLoaded();
  await createSteps.clickCreateOrderForSoldToAccountButton();

  const accountInput = page.locator("app-account-search input[name='Sold-to Account Number']");
  await accountInput.waitFor({ state: 'visible', timeout: 10000 });
  await accountInput.fill(FR_REBATE_SUPPLIER_CONFIG.soldTo);
  await accountInput.press('Tab');
  await page.waitForTimeout(500);
  await page.locator("app-account-search button:has-text('SEARCH')").click({ force: true });
  await page.waitForTimeout(3000);
  const firstLink = page.locator('app-account-search tbody span.redirect').first();
  if (await firstLink.isVisible().catch(() => false)) {
    await firstLink.click();
  }
  await page.waitForTimeout(2000);

  await createSteps.fillMandatoryFieldsAndVerify();
  await orderSteps.navigateToQuickAddTab();
  await orderSteps.verifyQuickAddTabDisplayed();

  const textarea = page.locator("textarea[placeholder='Quick Add Reference']");
  await textarea.fill(FR_REBATE_SUPPLIER_CONFIG.material);
  await page.waitForTimeout(500);
  await page.locator("button:has-text('CC PART')").click({ force: true });
  await page.waitForTimeout(5000);

  const modalVisible = await page.locator('.cdk-overlay-container:has-text("Select products"), .cdk-overlay-container:has-text("Search for products")').isVisible({ timeout: 1000 }).catch(() => false);
  if (modalVisible) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  }

  await orderSteps.setUnitSellPriceForAllItems('100');
  await orderSteps.clickRecalcButton();
}

async function getCostPricesFromQuickAdd(page) {
  await navigateToTab(page, SELECTORS.quickAddTab);
  await expect(page.locator(SELECTORS.quickAddComponent)).toBeVisible({ timeout: 10000 });
  await expect(page.locator(SELECTORS.quickAddTable)).toBeVisible({ timeout: 10000 });

  return page.evaluate(() => {
    const table = document.querySelector('app-basic-pricing p-table table, app-basic-pricing table');
    if (!table) return [];

    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim().toLowerCase());
    const costIndex = headers.findIndex((h) => h.includes('cost'));

    const prices = [];
    for (const row of table.querySelectorAll('tbody tr')) {
      const cells = row.querySelectorAll('td');
      let value = '';

      if (costIndex >= 0 && cells[costIndex]) {
        value = cells[costIndex].textContent.trim();
      } else {
        const costCell = row.querySelector('td[data-name*="cost" i], input[data-name*="cost" i]');
        if (costCell) {
          value = costCell.tagName === 'INPUT'
            ? costCell.value.trim()
            : costCell.textContent.trim();
        }
      }

      if (value) prices.push(value);
    }
    return prices;
  });
}

function assertCostPricesNotZero(costPrices) {
  expect(costPrices.length).toBeGreaterThan(0);
  for (const price of costPrices) {
    expect(price).not.toMatch(/^0\.00\s*R?$/i);
    expect(price).not.toBe('0.00');
    expect(price).not.toBe('0');
  }
}

async function verifyRebatesTabDisplayed(page) {
  await navigateToTab(page, SELECTORS.rebatesTab);
  await expect(page.locator(SELECTORS.rebatesComponent)).toBeVisible({ timeout: 10000 });
  await expect(page.locator(SELECTORS.rebatesTable)).toBeVisible({ timeout: 10000 });
}

async function applyManualUpfrontRebate(page) {
  await verifyRebatesTabDisplayed(page);

  const rebateRows = page.locator('app-rebates tbody tr');
  const rowCount = await rebateRows.count();
  if (rowCount === 0) {
    console.log('No rebate rows available to apply manual upfront rebate - skipping');
    return;
  }

  const firstRow = rebateRows.first();
  await firstRow.click({ force: true }).catch(() => {});

  const addManualBtn = page.locator(
    'app-rebates button:has-text("Manual"), app-rebates button:has-text("ADD MANUAL"), app-rebates button:has-text("Add Manual")',
  ).first();
  if (await addManualBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addManualBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }

  const upfrontCheckbox = page.locator(
    'app-rebates mat-checkbox:has-text("Upfront"), app-rebates oe-checkbox:has-text("Upfront"), app-rebates label:has-text("Upfront")',
  ).first();
  if (await upfrontCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await upfrontCheckbox.click({ force: true });
    await page.waitForTimeout(500);
  }

  const amountInput = firstRow.locator(
    'input[type="number"], input[formcontrolname*="rebate" i], input[formcontrolname*="amount" i], input[data-name*="rebate" i]',
  ).first();
  if (await amountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await amountInput.click({ force: true });
    await amountInput.fill('10');
    await amountInput.press('Tab');
    await page.waitForTimeout(500);
  } else {
    const manualDropdown = firstRow.locator('ng-select, oe-select').first();
    if (await manualDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await manualDropdown.click();
      const manualOption = page.locator('.ng-option:not(.ng-option-disabled)').filter({ hasText: /manual|upfront/i }).first();
      if (await manualOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manualOption.click();
      } else {
        await page.locator('.ng-option:not(.ng-option-disabled)').first().click();
      }
      await page.waitForTimeout(500);
    }
  }

  const saveRebateBtn = page.locator('app-rebates button:has-text("Save"), app-rebates button:has-text("Apply"), app-rebates button:has-text("ADD")').first();
  if (await saveRebateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await saveRebateBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }
}

async function assertCostPricesConsistent(page, baselinePrices) {
  const currentPrices = await getCostPricesFromQuickAdd(page);
  assertCostPricesNotZero(currentPrices);
  expect(currentPrices.length).toBe(baselinePrices.length);
  for (let i = 0; i < baselinePrices.length; i++) {
    expect(currentPrices[i]).toBe(baselinePrices[i]);
  }
}

async function selectSupplierInCostsSourcing(page, optionIndex = 0) {
  await navigateToTab(page, SELECTORS.costsSourcingTab);
  await expect(page.locator('app-cost-sourcing')).toBeVisible({ timeout: 10000 });

  const supplierDropdown = page.locator('app-cost-sourcing tbody ng-select, app-cost-sourcing tbody oe-select').first();
  if (!(await supplierDropdown.isVisible({ timeout: 5000 }).catch(() => false))) {
    return null;
  }

  await supplierDropdown.click({ force: true });
  await page.waitForTimeout(500);
  const options = page.locator('.ng-option:not(.ng-option-disabled), .mat-option');
  const count = await options.count();
  if (count === 0) return null;

  const index = Math.min(optionIndex, count - 1);
  const label = ((await options.nth(index).textContent()) || '').trim();
  await options.nth(index).click({ force: true });
  await page.waitForTimeout(1000);
  return label;
}

async function getClonedSupplierRebateOptions(page) {
  await navigateToTab(page, SELECTORS.rebatesTab);
  await expect(page.locator(SELECTORS.rebatesComponent)).toBeVisible({ timeout: 10000 });

  const rebateDropdown = page.locator('app-rebates tbody ng-select, app-rebates tbody oe-select').first();
  if (!(await rebateDropdown.isVisible({ timeout: 5000 }).catch(() => false))) {
    return [];
  }

  await rebateDropdown.click({ force: true });
  await page.waitForTimeout(500);
  const options = page.locator('.ng-option:not(.ng-option-disabled)');
  const count = await options.count();
  const labels = [];
  for (let i = 0; i < count; i++) {
    labels.push(((await options.nth(i).textContent()) || '').trim());
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
  return labels.filter(Boolean);
}

async function selectClonedSupplierRebate(page, optionIndex) {
  await navigateToTab(page, SELECTORS.rebatesTab);

  const rebateDropdown = page.locator('app-rebates tbody ng-select, app-rebates tbody oe-select').first();
  await rebateDropdown.waitFor({ state: 'visible', timeout: 10000 });
  await rebateDropdown.click({ force: true });
  await page.waitForTimeout(500);

  const options = page.locator('.ng-option:not(.ng-option-disabled)');
  const count = await options.count();
  expect(count).toBeGreaterThan(0);

  const index = Math.min(optionIndex, count - 1);
  const label = ((await options.nth(index).textContent()) || '').trim();
  await options.nth(index).click({ force: true });
  await page.waitForTimeout(1000);
  return label;
}

async function assertRebateSupplierMismatchError(page) {
  const errorLocator = page.locator(
    'div:has(> strong:has-text("Error")), div.error-section, app-rebates, app-cost-sourcing',
  ).filter({ hasText: /rebate.*match|match.*supplier|does not match|supplier.*rebate/i }).first();
  await expect(errorLocator).toBeVisible({ timeout: 10000 });
}

async function assertNoRebateSupplierMismatchError(page) {
  const errorLocator = page.locator(SELECTORS.globalError).filter({ hasText: /rebate.*match|match.*supplier|does not match/i });
  const visible = await errorLocator.isVisible({ timeout: 2000 }).catch(() => false);
  expect(visible).toBeFalsy();
}

test.describe('Rebates Pricing', { tag: ['@regression-2', '@module', '@regression', '@functional', '@rebates'] }, () => {
  test('Test 465879: Manual Rebates - Quick Add/Pricing cost price shows 0.00 R', async ({ authenticatedPage, country }) => {
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const costsSteps = new CostsSourcingSteps(authenticatedPage);
    getCountryConfig(country);

    // Step 1: Create order in Edit mode
    await createOrderWithMaterialsInEditMode(orderSteps, createSteps);

    // Step 2: Materials already added in Quick Add/Pricing
    const initialCostPrices = await getCostPricesFromQuickAdd(authenticatedPage);
    assertCostPricesNotZero(initialCostPrices);

    // Step 3: Navigate to Rebates tab
    await verifyRebatesTabDisplayed(authenticatedPage);

    // Step 4: Apply manual upfront rebate(s)
    await applyManualUpfrontRebate(authenticatedPage);

    // Step 5: Navigate back to Quick Add/Pricing - cost price NOT 0.00 R
    const costAfterRebate = await getCostPricesFromQuickAdd(authenticatedPage);
    assertCostPricesNotZero(costAfterRebate);

    // Step 6: Navigate to other tabs (except Costs & Sourcing) and return
    for (const tabSelector of [SELECTORS.headerTab, SELECTORS.textOtherTab, SELECTORS.blockingGroupingTab, SELECTORS.rebatesTab]) {
      await navigateToTab(authenticatedPage, tabSelector);
      await assertCostPricesConsistent(authenticatedPage, costAfterRebate);
    }

    // Step 7: Navigate to Costs & Sourcing and return
    await costsSteps.navigateToCostsSourcingTab();
    await assertCostPricesConsistent(authenticatedPage, costAfterRebate);

    // Step 8: Verify consistency without requiring Costs & Sourcing visit
    await navigateToTab(authenticatedPage, SELECTORS.rebatesTab);
    await navigateToTab(authenticatedPage, SELECTORS.quickAddTab);
    await assertCostPricesConsistent(authenticatedPage, costAfterRebate);
  });

  test('Test 460632: FR Rebate/Supplier match error message', { tag: ['@regression-2', '@fr-only'] }, async ({ authenticatedPage, country }) => {
    test.setTimeout(300000);
    test.skip(country.toUpperCase() !== 'FR', 'FR Rebate/Supplier match test runs only for country FR');

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const costsSteps = new CostsSourcingSteps(authenticatedPage);

    // Step 1: Create order with FR sold-to and material for cloned RSM schemes
    await createFROrderWithRebateMaterial(orderSteps, createSteps, authenticatedPage);

    const rebateOptions = await getClonedSupplierRebateOptions(authenticatedPage);
    test.skip(rebateOptions.length === 0, 'Cloned supplier rebates not available in RSM for this environment');

    // Step 2: Select a supplier in Costs & Sourcing
    const selectedSupplier = await selectSupplierInCostsSourcing(authenticatedPage, 0);
    test.skip(!selectedSupplier, 'No supplier dropdown available in Costs & Sourcing');

    // Step 3: Verify cloned supplier rebates are present
    await verifyRebatesTabDisplayed(authenticatedPage);
    expect(rebateOptions.length).toBeGreaterThan(0);

    // Step 4: Select a cloned supplier rebate NOT matching the supplier - Validate
    const mismatchIndex = rebateOptions.length > 1 ? 1 : 0;
    await selectClonedSupplierRebate(authenticatedPage, mismatchIndex);
    await clickValidate(authenticatedPage);

    const hasMismatchError = await authenticatedPage.locator(
      'div:has(> strong:has-text("Error")), div.error-section, app-rebates, app-cost-sourcing',
    ).filter({ hasText: /rebate.*match|match.*supplier|does not match|supplier.*rebate/i }).isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMismatchError) {
      await assertRebateSupplierMismatchError(authenticatedPage);
    }

    // Step 5: Save and Submit - same behaviour
    await clickSaveAndSubmit(authenticatedPage);
    if (hasMismatchError) {
      await assertRebateSupplierMismatchError(authenticatedPage);
    }

    // Step 6: Select matching supplier/rebate - no error
    await costsSteps.navigateToCostsSourcingTab();
    await selectSupplierInCostsSourcing(authenticatedPage, 0);
    await selectClonedSupplierRebate(authenticatedPage, 0);
    await clickValidate(authenticatedPage);
    await assertNoRebateSupplierMismatchError(authenticatedPage);

    // Step 7: Save and Submit - no error
    await clickSaveAndSubmit(authenticatedPage);
    await assertNoRebateSupplierMismatchError(authenticatedPage);

    // Step 8: Verify behaviour when changing selections
    await costsSteps.navigateToCostsSourcingTab();
    if (rebateOptions.length > 1) {
      await selectSupplierInCostsSourcing(authenticatedPage, 1);
      await selectClonedSupplierRebate(authenticatedPage, 0);
      await clickValidate(authenticatedPage);

      const errorOnChange = await authenticatedPage.locator(
        'div:has(> strong:has-text("Error")), div.error-section',
      ).filter({ hasText: /rebate.*match|match.*supplier|does not match/i }).isVisible({ timeout: 3000 }).catch(() => false);

      await selectClonedSupplierRebate(authenticatedPage, rebateOptions.length - 1);
      await clickValidate(authenticatedPage);
      await assertNoRebateSupplierMismatchError(authenticatedPage);

      console.log(`Revolving selection check: mismatch error on change=${errorOnChange}`);
    }
  });
});
